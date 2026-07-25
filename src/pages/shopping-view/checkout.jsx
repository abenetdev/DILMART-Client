import Address from "@/components/shopping-view/address";
import { useDispatch, useSelector } from "react-redux";
import UserCartItemsContent from "@/components/shopping-view/cart-items-content";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createNewOrder, resetCheckout } from "@/store/shop/order-slice";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CreditCard, ShoppingBag, Truck, ShieldCheck, RotateCcw, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { currencyFormatter } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function ShoppingCheckout() {
  const { cartItems }              = useSelector((s) => s.shopCart);
  const { user }                   = useSelector((s) => s.auth);
  const { checkoutUrl, isLoading } = useSelector((s) => s.shopOrder);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { toast } = useToast();

  const items = cartItems?.items || [];

  const totalAmount = items.reduce((sum, item) => {
    const price = item.salePrice > 0 ? item.salePrice : item.price;
    return sum + price * item.quantity;
  }, 0);

  const itemCount = items.reduce((s, i) => s + (i.quantity || 0), 0);

  // Redirect when Chapa URL is ready
  if (checkoutUrl) {
    window.location.href = checkoutUrl;
    return null;
  }

  async function handlePay() {
    if (!items.length) {
      toast({ title: "Your cart is empty", variant: "destructive" });
      return;
    }
    if (!selectedAddress) {
      toast({ title: "Select a delivery address", description: "Choose or add an address below.", variant: "destructive" });
      return;
    }

    const orderData = {
      userId:   user?.id,
      cartId:   cartItems?._id,
      cartItems: items.map((item) => ({
        productId: item.productId,
        title:     item.title,
        image:     item.image,
        price:     item.salePrice > 0 ? item.salePrice : item.price,
        quantity:  item.quantity,
      })),
      addressInfo: {
        addressId: selectedAddress._id,
        address:   selectedAddress.address,
        city:      selectedAddress.city,
        pincode:   selectedAddress.pincode,
        phone:     selectedAddress.phone,
        notes:     selectedAddress.notes,
      },
      totalAmount,
      customerEmail:     user?.email    || "customer@example.com",
      customerFirstName: user?.userName || "Customer",
      customerLastName:  "",
    };

    const result = await dispatch(createNewOrder(orderData));
    if (!result?.payload?.success) {
      toast({
        title: "Payment failed to start",
        description: result?.payload?.message || "Please try again",
        variant: "destructive",
      });
      dispatch(resetCheckout());
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">

          {/* ── Left: Address ── */}
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <Address
              selectedId={selectedAddress}
              setCurrentSelectedAddress={setSelectedAddress}
            />
          </div>

          {/* ── Right: Order summary ── */}
          <div className="space-y-4 sticky top-24">

            {/* Summary card */}
            <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-1 max-h-60 overflow-y-auto -mx-1 px-1">
                {items.map((item) => (
                  <UserCartItemsContent key={item.productId} cartItem={item} />
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})</span>
                  <span className="text-foreground font-medium">ETB {currencyFormatter(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>Included</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">ETB {currencyFormatter(totalAmount)}</span>
              </div>

              {/* Selected address preview */}
              {selectedAddress && (
                <div className="rounded-xl bg-primary/5 border border-primary/15 px-3 py-2.5 text-xs text-gray-700 space-y-0.5">
                  <p className="font-semibold text-primary">Delivering to:</p>
                  <p>{selectedAddress.address}, {selectedAddress.city}</p>
                  <p>{selectedAddress.phone}</p>
                </div>
              )}

              {/* Pay button */}
              <Button
                onClick={handlePay}
                disabled={isLoading || !selectedAddress || !items.length}
                className="w-full h-12 gap-2 text-base bg-green-700 hover:bg-green-700 font-semibold"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Redirecting…</>
                ) : (
                  <><CreditCard className="h-4 w-4" />Pay ETB {currencyFormatter(totalAmount)}</>
                )}
              </Button>

              {!selectedAddress && (
                <p className="text-center text-xs text-muted-foreground">
                  Select a delivery address to enable payment
                </p>
              )}

              <p className="text-center text-xs text-muted-foreground">
                Secured by Chapa · End-to-end encrypted
              </p>
            </div>

            {/* Trust badges */}
            <div className="bg-white rounded-2xl border p-4 space-y-2.5 shadow-sm">
              {[
                { icon: Truck,        color: "text-green-600",  text: "Free delivery on all orders" },
                { icon: ShieldCheck,  color: "text-blue-600",   text: "Secure & encrypted payment"  },
                { icon: RotateCcw,    color: "text-orange-500", text: "Easy returns within 7 days"   },
              ].map(({ icon: Icon, color, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                  {text}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
