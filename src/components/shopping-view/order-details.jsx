import { useDispatch, useSelector } from "react-redux";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { DialogContent } from "../ui/dialog";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { useToast } from "../ui/use-toast";
import { CheckCircle, Package } from "lucide-react";
import {
  confirmDeliveryByCustomer,
  getAllOrdersByUserId,
  getOrderDetails,
} from "@/store/shop/order-slice";

function ShoppingOrderDetailsView({ orderDetails }) {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { user } = useSelector((state) => state.auth);
  const { isSubmitting } = useSelector((state) => state.shopOrder);

  const canConfirmDelivery =
    orderDetails?.paymentStatus === "paid" &&
    orderDetails?.orderStatus === "shipped" &&
    !orderDetails?.deliveryConfirmedByCustomer &&
    !orderDetails?.escrowReleased;

  const handleConfirmDelivery = async () => {
    const result = await dispatch(confirmDeliveryByCustomer(orderDetails._id));

    if (result?.payload?.success) {
      toast({ title: result.payload.message });
      dispatch(getOrderDetails(orderDetails._id));
      if (user?.id) dispatch(getAllOrdersByUserId(user.id));
    } else {
      toast({
        title: "Could not confirm delivery",
        description: result?.payload?.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const statusBadgeClass = (status) => {
    const map = {
      pending:    "bg-yellow-100 text-yellow-800",
      confirmed:  "bg-blue-100 text-blue-800",
      processing: "bg-indigo-100 text-indigo-800",
      shipped:    "bg-purple-100 text-purple-800",
      delivered:  "bg-green-100 text-green-800",
      cancelled:  "bg-red-100 text-red-800",
    };
    return map[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <DialogContent className="sm:max-w-[600px] min-h-[90%]">
      <div className="grid gap-6">
        <div className="grid gap-2">
          <div className="flex mt-6 items-center justify-between">
            <p className="font-medium">Order ID</p>
            <Label className="font-mono text-xs">
              ORD-{orderDetails?._id?.slice(-8).toUpperCase()}
            </Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Order Date</p>
            <Label>{orderDetails?.orderDate?.split("T")[0]}</Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Order Price</p>
            <Label>ETB {orderDetails?.totalAmount?.toFixed(2)}</Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Payment method</p>
            <Label className="capitalize">{orderDetails?.paymentMethod}</Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Payment Status</p>
            <Label className="capitalize">{orderDetails?.paymentStatus}</Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Order Status</p>
            <Badge className={statusBadgeClass(orderDetails?.orderStatus)}>
              {orderDetails?.orderStatus}
            </Badge>
          </div>
          {orderDetails?.paymentStatus === "paid" &&
            (orderDetails?.orderStatus === "shipped" || orderDetails?.orderStatus === "delivered") && (
            <div className="flex mt-2 items-center justify-between">
              <p className="font-medium">Your confirmation</p>
              {orderDetails?.deliveryConfirmedByCustomer ? (
                <Badge className="bg-green-100 text-green-800 gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Confirmed
                </Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800">Pending your confirmation</Badge>
              )}
            </div>
          )}
        </div>

        {canConfirmDelivery && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-sm">Your order has been shipped!</p>
                <p className="text-sm text-muted-foreground">
                  Did you receive your order? Confirm only after everything has arrived as expected.
                  The vendor will be paid after platform review.
                </p>
              </div>
            </div>
            <Button
              onClick={handleConfirmDelivery}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Confirming…" : "Yes, I received my order ✓"}
            </Button>
          </div>
        )}

        {orderDetails?.deliveryConfirmedByCustomer && !orderDetails?.escrowReleased && (
          <p className="text-sm text-center text-green-600 rounded-lg border py-3">
            Thank You For Your Comfirmation. 
          </p>
        )}

        <Separator />
        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="font-medium">Order Details</div>
            <ul className="grid gap-3">
              {orderDetails?.cartItems?.map((item, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span>{item.title}</span>
                  <span>Qty: {item.quantity}</span>
                  <span>ETB {item.price}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="font-medium">Shipping Info</div>
            <div className="grid gap-0.5 text-muted-foreground text-sm">
              <span>{user?.userName}</span>
              <span>{orderDetails?.addressInfo?.address}</span>
              <span>{orderDetails?.addressInfo?.city}</span>
              <span>{orderDetails?.addressInfo?.pincode}</span>
              <span>{orderDetails?.addressInfo?.phone}</span>
              {orderDetails?.addressInfo?.notes && (
                <span>{orderDetails?.addressInfo?.notes}</span>
              )}
            </div>
          </div>
        </div> */}
      </div>
    </DialogContent>
  );
}

export default ShoppingOrderDetailsView;
