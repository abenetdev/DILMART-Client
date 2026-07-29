import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { brandOptionsMap, categoryOptionsMap } from "@/config";
import { ShoppingCart, Loader2, Heart } from "lucide-react";
import { addToWishlist, removeFromWishlist } from "@/store/shop/wishlist-slice";
import { useToast } from "../ui/use-toast";
import { currencyFormatter } from "@/utils";

function ShoppingProductTile({ product, handleAddtoCart }) {
  const [adding, setAdding] = useState(false);
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const { items: wishlistItems }  = useSelector((s) => s.shopWishlist);

  const userId      = user?.id || user?._id;
  const isWishlisted = wishlistItems?.some(
    (i) => i.productId?.toString() === product?._id?.toString()
  );

  const title      = product?.name        || product?.title      || "Unknown Product";
  const image      = product?.images?.[0] || product?.image      || "";
  const totalStock = product?.stock       ?? product?.totalStock ?? 0;
  const price      = product?.price       ?? 0;
  const salePrice  = product?.salePrice   ?? 0;

  const categoryLabel = categoryOptionsMap[product?.category] || product?.category || "";
  const brandLabel    = brandOptionsMap[product?.brand]       || product?.brand    || "";

  async function onAddToCart(e) {
    e.stopPropagation();
    if (adding || totalStock === 0) return;
    setAdding(true);
    await handleAddtoCart(product?._id, totalStock);
    setAdding(false);
  }

  function onToggleWishlist(e) {
    e.stopPropagation();
    if (!isAuthenticated) { navigate("/auth/login"); return; }
    const productId = product?._id;
    const action = isWishlisted
      ? removeFromWishlist({ userId, productId })
      : addToWishlist({ userId, productId });
    dispatch(action).then((res) => {
      if (res?.payload?.success) {
        toast({ title: isWishlisted ? "Removed from wishlist" : "Added to wishlist" });
      } else if (res?.payload?.message) {
        toast({ title: res.payload.message, variant: "destructive" });
      }
    });
  }

  return (
    /* no max-w-sm — let the grid cell dictate width */
    <Card className="w-full group hover:shadow-md transition-shadow duration-200 cursor-pointer flex flex-col overflow-hidden">

      {/* ── Image area ── */}
      <div
        className="relative overflow-hidden"
        onClick={() => navigate(`/product/${product?._id}`)}
      >
        {/*
          aspect-square on mobile → perfectly square image that always fits
          a 2-col cell without overflow.
          On sm+ use aspect-[3/4] for a taller portrait ratio.
        */}
        <div className="aspect-square sm:aspect-[3/4] w-full overflow-hidden bg-gray-100">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Badge — tiny on mobile */}
        {totalStock === 0 ? (
          <Badge className="absolute top-1.5 left-1.5 text-[9px] sm:text-xs px-1.5 py-0.5 bg-red-500 leading-none">
            Out of Stock
          </Badge>
        ) : totalStock < 10 ? (
          <Badge className="absolute top-1.5 left-1.5 text-[9px] sm:text-xs px-1.5 py-0.5 bg-orange-500 leading-none">
            {totalStock} left
          </Badge>
        ) : salePrice > 0 ? (
          <Badge className="absolute top-1.5 left-1.5 text-[9px] sm:text-xs px-1.5 py-0.5 bg-green-600 leading-none">
            Sale
          </Badge>
        ) : null}

        {/* Wishlist — compact round button */}
        <button
          onClick={onToggleWishlist}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-1.5 right-1.5 h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition-colors"
        >
          <Heart
            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
              isWishlisted ? "fill-red-500 text-red-500" : "text-gray-500"
            }`}
          />
        </button>
      </div>

      {/* ── Text content ── */}
      <CardContent
        className="p-2 sm:p-3 flex-1 flex flex-col gap-1"
        onClick={() => navigate(`/product/${product?._id}`)}
      >
        {/* Title */}
        <h2 className="text-[14px] sm:text-lg font-semibold line-clamp-2 leading-snug text-gray-900">
          {title}
        </h2>

        {/* Category (brand hidden on mobile to save space) */}
        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
          {categoryLabel}
          {brandLabel && (
            <span className="hidden sm:inline"> · {brandLabel}</span>
          )}
        </p>

        {/* Price — stack on mobile, inline on sm+ */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5 mt-auto pt-1">
          {salePrice > 0 ? (
            <>
              <span className="text-md sm:text-lg font-bold text-primary leading-tight">
                ETB {currencyFormatter(salePrice)}
              </span>
              <span className="text-[9px] sm:text-xs line-through text-muted-foreground leading-tight">
                ETB {currencyFormatter(price)}
              </span>
            </>
          ) : (
            <span className="text-md sm:text-lg font-bold text-primary leading-tight">
              ETB {currencyFormatter(price)}
            </span>
          )}
        </div>
      </CardContent>

      {/* ── Add to cart ── */}
      <CardFooter className="p-2 sm:p-3 pt-0">
        {totalStock === 0 ? (
          <Button
            className="w-full h-7 sm:h-9 text-[10px] sm:text-xs"
            disabled
            variant="secondary"
          >
            Out of Stock
          </Button>
        ) : (
          <Button
            className="w-full h-7 sm:h-9 text-[10px] sm:text-xs gap-1 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 hover:border-gray-400 shadow-none px-1 sm:px-3"
            onClick={onAddToCart}
            disabled={adding}
          >
            {adding ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                {/* Full label on sm+, icon-only on tiny screens */}
                <span className="hidden xs:inline sm:inline truncate">Add to Cart</span>
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default ShoppingProductTile;
