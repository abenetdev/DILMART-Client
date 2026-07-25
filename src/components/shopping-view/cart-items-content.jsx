import { Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { useDispatch, useSelector } from "react-redux";
import { deleteCartItem, updateCartQuantity } from "@/store/shop/cart-slice";
import { useToast } from "../ui/use-toast";
import { useState } from "react";
import { currencyFormatter } from "@/utils";

/** Returns the cart userId — real user ID if logged in, null for guests */
function getCartUserId(user, isAuthenticated) {
  return (isAuthenticated && user?.id) ? user.id : null;
}

function UserCartItemsContent({ cartItem }) {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const dispatch     = useDispatch();
  const { toast }    = useToast();
  const [loading, setLoading] = useState(false);

  const cartUserId = getCartUserId(user, isAuthenticated);

  // totalStock is now included in every cart item from the updated cart controller
  const totalStock = cartItem?.totalStock ?? 999;
  const currentQty = cartItem?.quantity   ?? 1;
  const price      = cartItem?.salePrice > 0 ? cartItem.salePrice : cartItem?.price;
  const lineTotal  = currencyFormatter((price * currentQty));

  async function handleUpdateQuantity(action) {
    const newQty = action === "plus" ? currentQty + 1 : currentQty - 1;

    if (action === "plus" && newQty > totalStock) {
      toast({
        title:       "Stock limit reached",
        description: `Only ${totalStock} unit${totalStock !== 1 ? "s" : ""} available`,
        variant:     "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await dispatch(
      updateCartQuantity({
        userId:    cartUserId,
        productId: cartItem?.productId,
        quantity:  newQty,
      })
    );
    setLoading(false);

    if (!result?.payload?.success) {
      toast({ title: "Could not update quantity", variant: "destructive" });
    }
  }

  async function handleDelete() {
    setLoading(true);
    await dispatch(
      deleteCartItem({ userId: cartUserId, productId: cartItem?.productId })
    );
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-4 py-3 border-b last:border-0">
      {/* Product image */}
      <div className="h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        <img
          src={cartItem?.image}
          alt={cartItem?.title}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Title + qty controls */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">
          {cartItem?.title}
        </h3>

        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full"
            disabled={currentQty === 1 || loading}
            onClick={() => handleUpdateQuantity("minus")}
          >
            <Minus className="h-3 w-3" />
          </Button>

          <span className="w-6 text-center text-sm font-semibold">
            {loading ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : currentQty}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full"
            disabled={currentQty >= totalStock || loading}
            onClick={() => handleUpdateQuantity("plus")}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Price + delete */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="text-sm font-bold">ETB {lineTotal}</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-muted-foreground hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default UserCartItemsContent;
