/**
 * useCart — centralised add-to-cart logic
 *
 * Guests (not logged in): cart is stored in localStorage.
 * Logged-in users: cart is stored on the server.
 * Auth is only required at checkout.
 */

import { useDispatch, useSelector } from "react-redux";
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice";
import { useToast } from "@/components/ui/use-toast";

export function useCart() {
  const dispatch      = useDispatch();
  const { toast }     = useToast();
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const { cartItems } = useSelector((s) => s.shopCart);

  // null means guest — cart slice handles localStorage path
  const cartUserId = (isAuthenticated && user?.id) ? user.id : null;

  /**
   * @param {string} productId
   * @param {number} totalStock  — available stock from the product
   * @param {number} [qty=1]     — how many to add (default 1)
   */
  async function handleAddToCart(productId, totalStock, qty = 1) {
    // Stock check against what's already in cart
    const existingItem = (cartItems?.items || []).find(
      (item) => item.productId === productId || item.productId?._id === productId
    );
    const alreadyInCart = existingItem?.quantity || 0;

    if (alreadyInCart + qty > totalStock) {
      toast({
        title: "Stock limit reached",
        description: totalStock === 0
          ? "This product is out of stock"
          : `Only ${totalStock - alreadyInCart} more unit${totalStock - alreadyInCart !== 1 ? "s" : ""} can be added`,
        variant: "destructive",
      });
      return false;
    }

    const result = await dispatch(
      addToCart({ userId: cartUserId, productId, quantity: qty })
    );

    if (result?.payload?.success) {
      // Refresh cart so header count stays accurate
      dispatch(fetchCartItems(cartUserId));
      toast({ title: "Added to cart!" });
      return true;
    } else {
      toast({
        title: "Could not add to cart",
        description: result?.payload?.message || "Please try again",
        variant: "destructive",
      });
      return false;
    }
  }

  return { handleAddToCart, cartUserId };
}
