import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingBag,
  ShoppingCart,
  ArrowLeft,
  Truck,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { fetchCartItems } from "@/store/shop/cart-slice";
import UserCartItemsContent from "@/components/shopping-view/cart-items-content";
import { currencyFormatter } from "@/utils";

/** Returns the cart userId — real user ID if logged in, null for guests */
function getCartUserId(user, isAuthenticated) {
  return (isAuthenticated && user?.id) ? user.id : null;
}

function CartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border rounded-xl">
            <Skeleton className="h-24 w-24 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-8 w-28 mt-3" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const { cartItems, isLoading }  = useSelector((s) => s.shopCart);

  const cartUserId = getCartUserId(user, isAuthenticated);
  const items      = cartItems?.items || [];

  useEffect(() => {
    dispatch(fetchCartItems(cartUserId));
  }, [dispatch, cartUserId]);

  const totalAmount = items.reduce((sum, item) => {
    const price = item?.salePrice > 0 ? item.salePrice : item?.price;
    return sum + price * (item?.quantity || 0);
  }, 0);

  const itemCount = items.reduce((s, i) => s + (i.quantity || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-2 max-w-6xl">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {isLoading ? (
          <CartSkeleton />
        ) : items.length === 0 ? (
          /* ── Empty cart ── */
          <div className="flex flex-col items-center py-24 gap-4 bg-white rounded-2xl border">
            <ShoppingBag className="h-20 w-20 text-muted-foreground" />
            <p className="text-xl font-semibold">Your cart is empty</p>
            <p className="text-muted-foreground text-sm">
              Looks like you haven't added anything yet
            </p>
            <Button asChild className="mt-2">
              <Link to="/listing">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          /* ── Cart with items ── */
          <div className="grid gap-6 lg:grid-cols-3 items-start">

            {/* Left — item list */}
            <div className="lg:col-span-2 bg-white rounded-2xl border overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="font-semibold text-base">
                  Cart Items
                  <Badge variant="secondary" className="ml-2">{itemCount}</Badge>
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-primary text-sm"
                >
                  <Link to="/listing">+ Add more</Link>
                </Button>
              </div>

              <div className="divide-y px-2">
                {items.map((item) => (
                  <UserCartItemsContent key={item.productId} cartItem={item} />
                ))}
              </div>
            </div>

            {/* Right — order summary */}
            <div className="space-y-4 sticky top-24">
              <div className="bg-white rounded-2xl border p-5 space-y-4">
                <h2 className="font-bold text-base">Order Summary</h2>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                    </span>
                    <span className="font-medium">ETB {currencyFormatter(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="text-muted-foreground">Calculated at checkout</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>ETB {currencyFormatter(totalAmount)}</span>
                </div>

                <Button
                  className="w-full h-12 text-base font-semibold bg-green-700 hover:bg-green-600"
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate("/auth/login?redirect=/checkout");
                    } else {
                      navigate("/checkout");
                    }
                  }}
                >
                  Proceed to Checkout
                </Button>
                <Button  variant="outline" className="w-full border-2" asChild>
                  <Link to="/listing">Continue Shopping</Link>
                </Button>
              </div>

              {/* Trust badges */}
              <div className="bg-white rounded-2xl border p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Truck className="h-4 w-4 shrink-0 text-green-600" />
                  Free shipping on all orders
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
                  Secure checkout &amp; payment
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <RotateCcw className="h-4 w-4 shrink-0 text-orange-500" />
                  Easy returns &amp; refunds
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
