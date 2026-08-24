import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { useToast } from "../ui/use-toast";
import { CheckCircle, Package, RotateCcw, Store, Truck } from "lucide-react";
import {
  confirmDeliveryByCustomer,
  getAllOrdersByUserId,
  getOrderDetails,
} from "@/store/shop/order-slice";
import { fetchMyReturnRequests } from "@/store/shop/return-slice";
import { currencyFormatter } from "@/utils";
import ReturnStatusBadge from "@/components/common/return-status-badge";
import ReturnTimeline from "@/components/common/return-timeline";
import ReturnRequestForm from "./return-request-form";

// ── Status badge helper ────────────────────────────────────────────────────
function statusBadgeClass(status) {
  const map = {
    pending:    "bg-yellow-100 text-yellow-800",
    confirmed:  "bg-blue-100 text-blue-800",
    processing: "bg-indigo-100 text-indigo-800",
    shipped:    "bg-purple-100 text-purple-800",
    delivered:  "bg-green-100 text-green-800",
    cancelled:  "bg-red-100 text-red-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}

// ── Single vendor sub-order block ──────────────────────────────────────────
function SubOrderBlock({ sub, index, orderDetails, onConfirmDelivery, isSubmitting }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { list: returnList } = useSelector((s) => s.shopReturn);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [showTimeline,   setShowTimeline]   = useState(false);

  const existingReturn = returnList?.find(
    (r) => r.orderId?.toString() === sub._id?.toString() ||
           r.orderId?._id?.toString() === sub._id?.toString()
  );

  const canConfirm =
    orderDetails.paymentStatus === "paid" &&
    sub.orderStatus === "shipped" &&
    !sub.deliveryConfirmedByCustomer &&
    !sub.escrowReleased;

  const canReturn =
    orderDetails.paymentStatus === "paid" &&
    sub.orderStatus === "delivered" &&
    !existingReturn;

  return (
    <div className="rounded-xl border p-4 space-y-3">
      {/* Sub-order header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <Store className="h-3.5 w-3.5 text-muted-foreground" />
          {sub.storeName || `Store ${index + 1}`}
          <span className="font-mono text-xs font-semibold ml-1 text-muted-foreground">
            {sub.vendorOrderId || `#${sub._id?.toString().slice(-6).toUpperCase()}`}
          </span>
        </span>
        <Badge className={statusBadgeClass(sub.orderStatus)}>
          {sub.orderStatus}
        </Badge>
      </div>

      {/* Items in this sub-order */}
      <ul className="space-y-2">
        {sub.cartItems?.map((item, i) => (
          <li key={i} className="flex items-center justify-between text-sm">
            <span className="flex-1 truncate mr-2">{item.title}</span>
            <span className="text-muted-foreground shrink-0 mr-3">×{item.quantity}</span>
            <span className="font-medium shrink-0">{currencyFormatter(item.price)}</span>
          </li>
        ))}
      </ul>

      {/* Sub-order total */}
      <div className="flex justify-between text-sm font-semibold pt-1 border-t">
        <span>Subtotal</span>
        <span>{currencyFormatter(sub.totalAmount)}</span>
      </div>

      {/* Shipping info */}
      {sub.shippingInfo?.trackingNumber && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
          <Truck className="h-3.5 w-3.5 shrink-0" />
          <span>
            {sub.shippingInfo.courierName && `${sub.shippingInfo.courierName} · `}
            Tracking: <span className="font-mono font-medium">{sub.shippingInfo.trackingNumber}</span>
          </span>
        </div>
      )}

      {/* Delivery confirmation prompt */}
      {canConfirm && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 space-y-2">
          <p className="text-sm font-medium flex items-center gap-1.5">
            <Package className="h-4 w-4 text-orange-600" />
            This part of your order has been shipped!
          </p>
          <p className="text-xs text-muted-foreground">
            Confirm only after your items have arrived as expected.
          </p>
          <Button
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={isSubmitting}
            onClick={() => onConfirmDelivery(sub._id)}
          >
            {isSubmitting ? "Confirming…" : "Yes, I received this ✓"}
          </Button>
        </div>
      )}

      {sub.deliveryConfirmedByCustomer && !sub.escrowReleased && (
        <p className="text-xs text-green-600 text-center py-1">
          ✓ You confirmed receipt of this part
        </p>
      )}

      {/* Return / refund section */}
      {existingReturn ? (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <RotateCcw className="h-3.5 w-3.5 text-orange-500" />
              Return Request
            </span>
            <ReturnStatusBadge status={existingReturn.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            Reason: <span className="font-medium capitalize">{existingReturn.reason?.replace(/_/g, " ")}</span>
            {" · "}Resolution: <span className="font-medium capitalize">{existingReturn.requestedResolution}</span>
          </p>
          {existingReturn.vendorDecisionReason && (
            <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              Vendor note: {existingReturn.vendorDecisionReason}
            </div>
          )}
          <Button variant="outline" size="sm" className="w-full" onClick={() => setShowTimeline((p) => !p)}>
            {showTimeline ? "Hide" : "Show"} Timeline
          </Button>
          {showTimeline && <ReturnTimeline timeline={existingReturn.timeline} />}
        </div>
      ) : canReturn ? (
        <Button
          variant="outline" size="sm"
          className="w-full gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
          onClick={() => setShowReturnForm(true)}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Request Return / Refund
        </Button>
      ) : null}

      {/* Return form dialog for this sub-order */}
      <Dialog open={showReturnForm} onOpenChange={setShowReturnForm}>
        <ReturnRequestForm
          // Pass a synthetic order object with this sub-order's _id and items
          order={{ ...orderDetails, _id: sub._id, cartItems: sub.cartItems }}
          onSuccess={() => {
            setShowReturnForm(false);
            if (user?.id) dispatch(fetchMyReturnRequests());
          }}
        />
      </Dialog>
    </div>
  );
}

// ── Main dialog ────────────────────────────────────────────────────────────
function ShoppingOrderDetailsView({ orderDetails }) {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { user } = useSelector((state) => state.auth);
  const { isSubmitting } = useSelector((state) => state.shopOrder);

  const subOrders = orderDetails?.subOrders || [];
  // Single-vendor legacy: wrap the flat cartItems as one sub-order for display
  const displaySubs = subOrders.length > 0
    ? subOrders
    : orderDetails
      ? [{ _id: orderDetails._id, orderStatus: orderDetails.orderStatus,
           totalAmount: orderDetails.totalAmount, cartItems: orderDetails.cartItems || [],
           shippingInfo: orderDetails.shippingInfo,
           deliveryConfirmedByCustomer: orderDetails.deliveryConfirmedByCustomer,
           escrowReleased: orderDetails.escrowReleased }]
      : [];

  const handleConfirmDelivery = async (subOrderId) => {
    const result = await dispatch(confirmDeliveryByCustomer(subOrderId));
    if (result?.payload?.success) {
      toast({ title: result.payload.message });
      // Refresh — pass orderGroupId so the grouped detail reloads
      const groupId = orderDetails.orderGroupId || orderDetails._id;
      dispatch(getOrderDetails(groupId));
      if (user?.id) dispatch(getAllOrdersByUserId(user.id));
    } else {
      toast({
        title: "Could not confirm delivery",
        description: result?.payload?.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const groupId = orderDetails?.orderGroupId || orderDetails?._id;

  return (
    <DialogContent className="sm:max-w-[620px] max-h-[90vh] flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-1 py-1 space-y-5">

        {/* ── Order summary header ── */}
        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">Order ID</p>
            <Label className="font-mono text-xs font-semibold">
              {orderDetails?.displayOrderId
                || (orderDetails?.subOrders?.length > 1
                  ? orderDetails?.parentOrderId
                  : orderDetails?.subOrders?.[0]?.vendorOrderId)
                || `ORD-${groupId?.toString().slice(-8).toUpperCase()}`}
            </Label>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-medium">Order Date</p>
            <Label>{orderDetails?.orderDate?.toString().split("T")[0]}</Label>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-medium">Total Amount</p>
            <Label className="font-semibold">{currencyFormatter(orderDetails?.totalAmount)}</Label>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-medium">Payment Method</p>
            <Label className="capitalize">{orderDetails?.paymentMethod}</Label>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-medium">Payment Status</p>
            <Label className="capitalize">{orderDetails?.paymentStatus}</Label>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-medium">Overall Status</p>
            <Badge className={statusBadgeClass(orderDetails?.orderStatus)}>
              {orderDetails?.orderStatus}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* ── Per-vendor sub-orders ── */}
        <div className="space-y-3">
          {displaySubs.length > 1 && (
            <p className="text-sm font-medium text-muted-foreground">
              {displaySubs.length} stores in this order
            </p>
          )}
          {displaySubs.map((sub, i) => (
            <SubOrderBlock
              key={sub._id?.toString() || i}
              sub={sub}
              index={i}
              orderDetails={orderDetails}
              onConfirmDelivery={handleConfirmDelivery}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>

        {/* ── Shipping address ── */}
        {orderDetails?.addressInfo && (
          <>
            <Separator />
            <div className="space-y-1">
              <p className="font-medium text-sm">Delivery Address</p>
              <p className="text-sm text-muted-foreground">
                {orderDetails.addressInfo.address}, {orderDetails.addressInfo.city}
              </p>
              {orderDetails.addressInfo.phone && (
                <p className="text-sm text-muted-foreground">
                  Phone: {orderDetails.addressInfo.phone}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </DialogContent>
  );
}

export default ShoppingOrderDetailsView;
