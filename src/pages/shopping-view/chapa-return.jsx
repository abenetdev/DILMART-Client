/**
 * Chapa Return Page
 *
 * Chapa redirects the customer here after payment.
 * URL includes:  ?trx_ref=order-<orderId>-<timestamp>&status=success|failed
 *
 * We verify the payment server-side before confirming the order.
 */

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyPayment } from "@/store/shop/order-slice";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

function ChapaReturnPage() {
  const dispatch  = useDispatch();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [status, setStatus]   = useState("verifying"); // verifying | success | failed
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params  = new URLSearchParams(location.search);
    const txRef        = params.get("trx_ref")  || sessionStorage.getItem("currentTxRef") || "";
    const orderId      = JSON.parse(sessionStorage.getItem("currentOrderId") || "null");
    const orderGroupId = JSON.parse(sessionStorage.getItem("currentOrderGroupId") || "null");

    if (!txRef || (!orderId && !orderGroupId)) {
      setStatus("failed");
      setMessage("Missing transaction reference. Please contact support.");
      return;
    }

    dispatch(verifyPayment({ txRef, orderId, orderGroupId })).then((result) => {
      if (result?.payload?.success) {
        sessionStorage.removeItem("currentOrderId");
        sessionStorage.removeItem("currentOrderGroupId");
        sessionStorage.removeItem("currentTxRef");
        setStatus("success");
        // Redirect to success page after 2 s
        setTimeout(() => navigate("/shop/payment-success"), 2000);
      } else {
        setStatus("failed");
        setMessage(result?.payload?.message || "Payment could not be verified.");
      }
    });
  }, [dispatch, location.search, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === "verifying" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-2" />
              <CardTitle>Verifying your payment…</CardTitle>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <CardTitle>Payment Confirmed!</CardTitle>
            </>
          )}
          {status === "failed" && (
            <>
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <CardTitle>Payment Failed</CardTitle>
            </>
          )}
        </CardHeader>

        <CardContent className="text-center space-y-4">
          {status === "verifying" && (
            <p className="text-muted-foreground text-sm">
              Please wait while we confirm your transaction with Chapa…
            </p>
          )}
          {status === "success" && (
            <p className="text-muted-foreground text-sm">
              Your order has been placed successfully! Redirecting…
            </p>
          )}
          {status === "failed" && (
            <>
              <p className="text-muted-foreground text-sm">{message}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/shop/checkout")} variant="outline">
                  Try Again
                </Button>
                <Button onClick={() => navigate("/shop/home")}>
                  Back to Shop
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ChapaReturnPage;
