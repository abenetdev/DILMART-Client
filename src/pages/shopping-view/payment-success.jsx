import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, ShoppingBag } from "lucide-react";

function PaymentSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4 py-16">
      <div className="bg-white rounded-2xl shadow-sm border max-w-md w-full p-10 text-center">

        {/* Animated success icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Your order has been placed successfully. You'll receive a
          confirmation soon.
        </p>

        {/* Divider */}
        <div className="my-8 border-t border-dashed" />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate("/shop/account/orders")}
            className="gap-2"
          >
            <Package className="h-4 w-4" />
            View My Orders
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/shop/home")}
            className="gap-2"
          >
            <ShoppingBag className="h-4 w-4" />
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
