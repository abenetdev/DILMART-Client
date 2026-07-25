import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Loader2, ShoppingCart, Trash2, Plus } from "lucide-react";
import { fetchWishlist, removeFromWishlist } from "@/store/shop/wishlist-slice";
import { addToCart } from "@/store/shop/cart-slice";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

function WishlistProductCard({ item, onRemove, onAddToCart, addingId, onView }) {
  const isAdding = addingId === item.productId;
  const outOfStock = item.stock === 0;
  const hasSale = item.salePrice > 0;
  const displayPrice = hasSale ? item.salePrice : item.price;

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-xl border bg-card overflow-hidden",
        "transition-all duration-200 hover:shadow-md hover:border-primary/20"
      )}
    >
      {/* Image */}
      <div
        className="relative h-36 sm:h-32 bg-muted overflow-hidden cursor-pointer"
        onClick={() => onView(item.productId)}
        onKeyDown={(e) => e.key === "Enter" && onView(item.productId)}
        role="button"
        tabIndex={0}
      >
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {outOfStock ? (
          <Badge className="absolute top-2 left-2 h-5 text-[10px] bg-red-500 hover:bg-red-500">
            Sold out
          </Badge>
        ) : hasSale ? (
          <Badge className="absolute top-2 left-2 h-5 text-[10px] bg-emerald-600 hover:bg-emerald-600">
            Sale
          </Badge>
        ) : null}
        <button
          type="button"
          onClick={() => onRemove(item.productId)}
          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          aria-label="Remove from wishlist"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-500" />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <h3
          className="text-xs sm:text-sm font-medium leading-snug line-clamp-2 min-h-[2.5rem] cursor-pointer hover:text-primary"
          onClick={() => onView(item.productId)}
        >
          {item.title}
        </h3>

        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-primary">
            ETB {displayPrice?.toFixed(2)}
          </span>
          {hasSale && (
            <span className="text-[10px] text-muted-foreground line-through">
              ETB {item.price?.toFixed(2)}
            </span>
          )}
        </div>

        <div className="mt-auto pt-2.5 flex gap-1.5">
          <Button
            size="sm"
            className="h-8 flex-1 text-xs gap-1 px-2"
            disabled={outOfStock || isAdding}
            onClick={() => onAddToCart(item)}
          >
            {isAdding ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 shrink-0"
            onClick={() => onRemove(item.productId)}
            aria-label="Remove"
          >
            <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
          </Button>
        </div>
      </div>
    </article>
  );
}

function AccountWishlist() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSelector((state) => state.auth);
  const { items, isLoading } = useSelector((state) => state.shopWishlist);
  const [addingId, setAddingId] = useState(null);

  const userId = user?.id || user?._id;

  useEffect(() => {
    if (userId) dispatch(fetchWishlist(userId));
  }, [dispatch, userId]);

  const handleRemove = async (productId) => {
    const result = await dispatch(removeFromWishlist({ userId, productId }));
    if (result?.payload?.success) {
      toast({ title: "Removed from wishlist" });
    }
  };

  const handleAddToCart = async (item) => {
    if (item.stock === 0) {
      toast({ title: "Out of stock", variant: "destructive" });
      return;
    }
    setAddingId(item.productId);
    const result = await dispatch(
      addToCart({ userId, productId: item.productId, quantity: 1 })
    );
    setAddingId(null);
    if (result?.payload?.success) {
      toast({ title: "Added to cart" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Wishlist</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {items.length} saved {items.length === 1 ? "item" : "items"}
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0" asChild>
            <Link to="/shop/listing">
              <Plus className="h-4 w-4" />
              Browse more
            </Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((item) => (
            <WishlistProductCard
              key={item.productId}
              item={item}
              onRemove={handleRemove}
              onAddToCart={handleAddToCart}
              addingId={addingId}
              onView={(id) => navigate(`/shop/product/${id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 mb-4">
            <Heart className="h-7 w-7 text-rose-400" />
          </div>
          <p className="font-medium">Your wishlist is empty</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-xs">
            Tap the heart on any product while shopping to save it here
          </p>
          <Button size="sm" asChild>
            <Link to="/shop/listing">Explore Products</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default AccountWishlist;
