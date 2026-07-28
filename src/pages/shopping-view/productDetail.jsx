import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  ChevronRight,
  Heart,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Store,
  Tag,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import StarRatingComponent from "@/components/common/star-rating";
import ShoppingProductTile from "@/components/shopping-view/product-tile";
import { categoryOptionsMap, brandOptionsMap } from "@/config";
import { useCart } from "@/hooks/useCart";
import {
  fetchProductDetails,
  setProductDetails,
} from "@/store/shop/products-slice";
import { addReview, getReviews } from "@/store/shop/review-slice";
import { getAllOrdersByUserId } from "@/store/shop/order-slice";
import {
  addToWishlist,
  removeFromWishlist,
  fetchWishlist,
} from "@/store/shop/wishlist-slice";
import { currencyFormatter } from "@/utils";

function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { handleAddToCart } = useCart();

  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const { productDetails, isLoading } = useSelector((s) => s.shopProducts);
  const { reviews } = useSelector((s) => s.shopReview);
  const { orderList } = useSelector((s) => s.shopOrder);
  const { items: wishlistItems } = useSelector((s) => s.shopWishlist);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [reviewMsg, setReviewMsg] = useState("");
  const [rating, setRating] = useState(0);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const userId = user?.id || user?._id;

  useEffect(() => {
    if (productId) {
      dispatch(fetchProductDetails(productId));
      dispatch(getReviews(productId));
    }
    return () => {
      dispatch(setProductDetails());
    };
  }, [dispatch, productId]);

  useEffect(() => {
    if (userId) {
      dispatch(fetchWishlist(userId));
      dispatch(getAllOrdersByUserId(userId)); // needed for review eligibility check
    }
  }, [dispatch, userId]);

  useEffect(() => {
    setSelectedImage(0);
    setQuantity(1);
    setShowFullDesc(false);
  }, [productId]);

  if (isLoading && !productDetails) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!productDetails) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Product not found</h1>
        <p className="text-muted-foreground mb-6">
          This product may have been removed or is no longer available.
        </p>
        <Button onClick={() => navigate("/shop/listing")}>Browse Products</Button>
      </div>
    );
  }

  const title = productDetails.name || productDetails.title;
  const images =
    productDetails.images?.length > 0
      ? productDetails.images
      : productDetails.image
        ? [productDetails.image]
        : [];
  const video     = productDetails.video || null;
  const stock     = productDetails.stock ?? productDetails.totalStock ?? 0;
  const price = productDetails.price ?? 0;
  const salePrice = productDetails.salePrice ?? 0;
  const hasSale = salePrice > 0 && salePrice < price;
  const displayPrice = hasSale ? salePrice : price;
  const categoryLabel =
    categoryOptionsMap[productDetails.category] || productDetails.category;
  const brandLabel =
    brandOptionsMap[productDetails.brand] || productDetails.brand;
  const store = productDetails.store;
  const related = productDetails.relatedProducts || [];

  const isWishlisted = wishlistItems?.some(
    (i) => i.productId?.toString() === productDetails._id?.toString()
  );

  const averageReview =
    reviews?.length > 0
      ? reviews.reduce((s, r) => s + r.reviewValue, 0) / reviews.length
      : 0;

  // ── Review eligibility ────────────────────────────────────────────────────
  // 1. Has the user purchased this product?
  const hasPurchased = isAuthenticated && orderList?.some((order) =>
    order.cartItems?.some(
      (item) => item.productId?.toString() === productDetails?._id?.toString()
    )
  );

  // 2. Has the user already left a review?
  const alreadyReviewed = isAuthenticated && reviews?.some(
    (r) => r.userId?.toString() === userId?.toString()
  );

  // Derived disabled state + tooltip message
  const canSubmitReview = hasPurchased && !alreadyReviewed && reviewMsg.trim() && rating > 0;
  const reviewBlockReason = !isAuthenticated
    ? "login"
    : !hasPurchased
      ? "You need to purchase this product before leaving a review."
      : alreadyReviewed
        ? "You've already reviewed this product."
        : null;

  const handleQtyChange = (delta) => {
    setQuantity((q) => Math.max(1, Math.min(stock, q + delta)));
  };

  const handleAddToCartClick = async () => {
    setAdding(true);
    await handleAddToCart(productDetails._id, stock, quantity);
    setAdding(false);
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    const result = isWishlisted
      ? await dispatch(removeFromWishlist({ userId, productId: productDetails._id }))
      : await dispatch(addToWishlist({ userId, productId: productDetails._id }));
    if (result?.payload?.success) {
      toast({ title: isWishlisted ? "Removed from wishlist" : "Saved to wishlist" });
    }
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    const result = await dispatch(
      addReview({
        productId: productDetails._id,
        userId,
        userName: user.userName,
        reviewMessage: reviewMsg,
        reviewValue: rating,
      })
    );
    if (result?.payload?.success) {
      setReviewMsg("");
      setRating(0);
      dispatch(getReviews(productDetails._id));
      toast({ title: "Review submitted" });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link to="/shop/home" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/shop/listing" className="hover:text-foreground">
          Products
        </Link>
        {categoryLabel && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              to={`/shop/listing?category=${productDetails.category}`}
              className="hover:text-foreground"
            >
              {categoryLabel}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {title}
        </span>
      </nav>

      <Button
        variant="ghost"
        size="sm"
        className="mb-4 gap-1 -ml-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted">
            {/* Show video if video tab is selected, otherwise show image */}
            {video && selectedImage === images.length ? (
              <video
                src={video}
                controls
                autoPlay
                className="h-full w-full object-contain bg-black"
              />
            ) : images.length > 0 ? (
              <img
                src={images[selectedImage] || images[0]}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-20 w-20 text-muted-foreground" />
              </div>
            )}
            {hasSale && selectedImage !== images.length && (
              <Badge className="absolute top-4 left-4 bg-emerald-600">Sale</Badge>
            )}
            {stock === 0 && (
              <Badge className="absolute top-4 left-4 bg-red-500">Out of Stock</Badge>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    selectedImage === i ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
              {/* Video thumbnail tab */}
              {video && (
                <button
                  type="button"
                  onClick={() => setSelectedImage(images.length)} // index beyond images = video
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 relative transition-colors ${
                    selectedImage === images.length ? "border-primary" : "border-transparent"
                  } bg-black`}
                >
                  <video src={video} className="h-full w-full object-cover opacity-70" controls  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/80 rounded-full p-1">
                      <svg className="h-3 w-3 text-gray-900 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {categoryLabel && (
                <Badge variant="secondary" className="gap-1">
                  <Tag className="h-3 w-3" />
                  {categoryLabel}
                </Badge>
              )}
              {brandLabel && <Badge variant="outline">{brandLabel}</Badge>}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
              {title}
            </h1>
            {reviews?.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <StarRatingComponent rating={averageReview} />
                <span className="text-sm text-muted-foreground">
                  {averageReview.toFixed(1)} ({reviews.length} review
                  {reviews.length !== 1 ? "s" : ""})
                </span>
              </div>
            )}
          </div>

          {/* Store */}
          {store && (
            <Link
              to={`/store/${store.slug}`}
              className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors w-fit"
            >
              <div className="h-10 w-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                {store.logo ? (
                  <img src={store.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Store className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sold by</p>
                <p className="font-semibold text-sm">{store.storeName}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />
            </Link>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">{currencyFormatter(displayPrice)}</span>
            {hasSale && (
              <span className="text-lg text-muted-foreground line-through">
                {currencyFormatter(price)}
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {stock > 0 ? (
              <span className="text-green-600 font-medium">In stock</span>
            ) : (
              <span className="text-red-600 font-medium">Currently unavailable</span>
            )}
          </p>

          <Separator />

          {/* Description */}
          {productDetails.description && (
            <div>
              <h2 className="font-semibold mb-2">Description</h2>
              <div className="relative">
                <p
                  className={`text-muted-foreground text-sm leading-relaxed whitespace-pre-line transition-all ${
                    showFullDesc ? "" : "line-clamp-4"
                  }`}
                >
                  {productDetails.description}
                </p>
                {/* Only show the toggle if description is long enough */}
                {productDetails.description.length > 250 && (
                  <button
                    type="button"
                    onClick={() => setShowFullDesc((p) => !p)}
                    className="mt-1.5 text-sm font-medium text-primary hover:underline focus:outline-none cursor-pointer"
                  >
                    {showFullDesc ? "See less" : "See more"}
                  </button>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-4">
            {stock > 0 && (
              <div className="flex items-center gap-3">
                <Label className="text-sm shrink-0">Quantity</Label>
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => handleQtyChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => handleQtyChange(1)}
                    disabled={quantity >= stock}
                  >
                    <Plus className="h-4 w-4" />
                    
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {stock === 0 ? (
                <Button className="flex-1" disabled variant="secondary">
                  Out of Stock
                </Button>
              ) : (
                <Button
                  className="flex-1 gap-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400 shadow-none"
                  size="lg"
                  disabled={adding}
                  onClick={handleAddToCartClick}
                >
                  {adding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  Add to Cart
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="px-4"
                onClick={handleWishlist}
              >
                <Heart
                  className={`h-5 w-5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`}
                />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16">
        <h2 className="text-xl font-bold mb-6">
          Customer Reviews {reviews?.length > 0 && `(${reviews.length})`}
        </h2>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            {reviews?.length > 0 ? (
              reviews.map((review, i) => (
                <div key={i} className="flex gap-3 rounded-xl border p-4">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>
                      {review.userName?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{review.userName}</p>
                    <StarRatingComponent rating={review.reviewValue} />
                    <p className="text-sm text-muted-foreground mt-1">
                      {review.reviewMessage}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>
            )}
          </div>

          <div className="rounded-xl border p-5 space-y-4 h-fit">
            <h3 className="font-semibold">Write a Review</h3>

            {/* Status banner */}
            {reviewBlockReason === "login" && (
              <div className="rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                <Link to="/auth/login" className="text-primary font-medium underline underline-offset-2">
                  Sign in
                </Link>{" "}
                to leave a review.
              </div>
            )}
            {reviewBlockReason && reviewBlockReason !== "login" && (
              <div className={`rounded-lg px-3 py-2.5 text-sm font-medium flex items-center gap-2 ${
                alreadyReviewed
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                <span>{alreadyReviewed ? "✓" : "⚠"}</span>
                {reviewBlockReason}
              </div>
            )}

            {/* Form — shown only to authenticated users */}
            {isAuthenticated && (
              <>
                <StarRatingComponent
                  rating={rating}
                  handleRatingChange={alreadyReviewed ? undefined : setRating}
                />
                <Input
                  placeholder="Share your experience with this product…"
                  value={reviewMsg}
                  onChange={(e) => setReviewMsg(e.target.value)}
                  disabled={!hasPurchased || alreadyReviewed}
                />
                <Button
                  onClick={handleSubmitReview}
                  disabled={!canSubmitReview}
                  className="w-full"
                  title={reviewBlockReason || undefined}
                >
                  {alreadyReviewed ? "Already Reviewed" : "Submit Review"}
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold mb-6">You may also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <ShoppingProductTile
                key={p._id}
                product={p}
                handleAddtoCart={(id, s) => handleAddToCart(id, s)}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}

export default ProductDetailPage;
