import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  User,
  XCircle,
  CheckCircle2,
  Truck,
  ClipboardList,
  Clock,
  CheckCheck,
  History,
  Loader2,
} from "lucide-react";
import {
  getOrderDetailsForVendor,
  getAllOrdersForVendor,
  acceptOrder,
  processOrder,
  shipOrder,
} from "@/store/vendor/order-slice";

// ── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:    { label: "Pending",    className: "bg-yellow-100 text-yellow-800", icon: Clock },
  confirmed:  { label: "Confirmed",  className: "bg-blue-100 text-blue-800",    icon: CheckCircle2 },
  processing: { label: "Processing", className: "bg-indigo-100 text-indigo-800",icon: ClipboardList },
  shipped:    { label: "Shipped",    className: "bg-purple-100 text-purple-800",icon: Truck },
  delivered:  { label: "Delivered",  className: "bg-green-100 text-green-800",  icon: CheckCheck },
  cancelled:  { label: "Cancelled",  className: "bg-red-100 text-red-800",      icon: XCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

// ── Workflow steps bar ─────────────────────────────────────────────────────
const STEPS = ["confirmed", "processing", "shipped", "delivered"];

function WorkflowBar({ currentStatus, deliveryConfirmedByCustomer }) {
  const activeIdx = STEPS.indexOf(currentStatus);

  // A step is "green" (fully complete) when:
  //   - it came before the current step (done), OR
  //   - it IS the current step (active) — the order has reached this status, OR
  //   - it's "delivered" and the customer has confirmed
  function isGreen(step, idx) {
    if (idx < activeIdx) return true;               // previous steps always green
    if (idx === activeIdx) return true;             // current status is reached → green
    if (step === "delivered" && deliveryConfirmedByCustomer) return true;
    return false;
  }

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const green  = isGreen(step, idx);
        const active = idx === activeIdx;           // still used for connector line
        const cfg    = STATUS_CONFIG[step];
        const Icon   = cfg.icon;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className={`
              flex flex-col items-center gap-1
              ${green ? "text-green-600" : "text-muted-foreground/40"}
            `}>
              <div className={`
                h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors
                ${green ? "bg-green-100 border-green-500" : "bg-muted border-muted-foreground/20"}
              `}>
                {green ? <CheckCheck className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className="text-[10px] font-medium capitalize hidden sm:block">{step}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${isGreen(STEPS[idx + 1], idx + 1) ? "bg-green-400" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

function VendorOrderDetails() {
  const { orderId } = useParams();
  const navigate    = useNavigate();
  const dispatch    = useDispatch();
  const { toast }   = useToast();

  const { orderDetails, isSubmitting } = useSelector((s) => s.vendorOrder);

  useEffect(() => {
    if (orderId) dispatch(getOrderDetailsForVendor(orderId));
  }, [dispatch, orderId]);

  // ── Action handlers ────────────────────────────────────────────────────

  async function handleAction(thunk, args, successMsg) {
    const result = await dispatch(thunk(args));
    if (result?.payload?.success) {
      toast({ title: successMsg });
      dispatch(getAllOrdersForVendor({}));
    } else {
      toast({
        title:       "Action failed",
        description: result?.payload?.message || "Something went wrong",
        variant:     "destructive",
      });
    }
  }

  function handleAccept()  { handleAction(acceptOrder,  orderId, "Order accepted!"); }
  function handleProcess() { handleAction(processOrder, orderId, "Order is now being processed"); }
  function handleShip()    { handleAction(shipOrder, { id: orderId }, "Order marked as shipped!"); }

  // ── Render helpers ─────────────────────────────────────────────────────

  function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  if (!orderDetails) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          {isSubmitting
            ? <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            : <>
                <p className="text-lg text-muted-foreground">Order not found</p>
                <Button onClick={() => navigate("/vendor/orders")} className="mt-4">
                  Back to Orders
                </Button>
              </>
          }
        </div>
      </div>
    );
  }

  const status = orderDetails.orderStatus;

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/vendor/orders")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order Details</h1>
            <p className="text-muted-foreground font-mono text-sm">
              ORD-{orderDetails._id?.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* ── Workflow bar ───────────────────────────────────────────────── */}
      {status !== "cancelled" && (
        <Card>
          <CardContent className="pt-5 pb-4 px-6">
            <WorkflowBar
              currentStatus={status}
              deliveryConfirmedByCustomer={orderDetails.deliveryConfirmedByCustomer}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Action panel ──────────────────────────────────────────────── */}
      <OrderActionPanel
        status={status}
        isSubmitting={isSubmitting}
        orderDetails={orderDetails}
        onAccept={handleAccept}
        onProcess={handleProcess}
        onShip={handleShip}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* ── Order items ───────────────────────────────────────────── */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" /> Order Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orderDetails.cartItems?.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-20 w-20 rounded border overflow-hidden flex-shrink-0 bg-muted">
                    {item.image
                      ? <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                      : <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                    }
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                    <p className="text-sm font-medium mt-0.5">
                      ETB {item.price} × {item.quantity} = ETB{" "}
                      {(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>ETB {orderDetails.totalAmount?.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* ── Sidebar ───────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" /> Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{orderDetails.customerName}</p>
              <p className="text-muted-foreground">{orderDetails.userId?.email || "—"}</p>
            </CardContent>
          </Card>

          {/* Shipping address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-0.5">
              <p>{orderDetails.addressInfo?.address}</p>
              <p>{orderDetails.addressInfo?.city}</p>
              <p>{orderDetails.addressInfo?.pincode}</p>
              <p>Phone: {orderDetails.addressInfo?.phone}</p>
              {orderDetails.addressInfo?.notes && (
                <p className="text-muted-foreground mt-1">Note: {orderDetails.addressInfo.notes}</p>
              )}
            </CardContent>
          </Card>

          {/* Shipping info (only after shipped) */}
          {(status === "shipped" || status === "delivered") &&
            (orderDetails.shippingInfo?.courierName || orderDetails.shippingInfo?.trackingNumber) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Shipping Info
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                {orderDetails.shippingInfo.courierName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Courier</span>
                    <span>{orderDetails.shippingInfo.courierName}</span>
                  </div>
                )}
                {orderDetails.shippingInfo.trackingNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tracking #</span>
                    <span className="font-mono text-xs">{orderDetails.shippingInfo.trackingNumber}</span>
                  </div>
                )}
                {orderDetails.shippingInfo.shippedDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipped on</span>
                    <span>{formatDate(orderDetails.shippingInfo.shippedDate)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="capitalize">{orderDetails.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={orderDetails.paymentStatus === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                  {orderDetails.paymentStatus}
                </Badge>
              </div>
              {orderDetails.paymentStatus === "paid" && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payout</span>
                  {orderDetails.escrowReleased
                    ? <Badge className="bg-green-100 text-green-800">Funds released</Badge>
                    : orderDetails.escrowRejected
                    ? <Badge className="bg-red-100 text-red-800">Release rejected</Badge>
                    : orderDetails.deliveryConfirmedByCustomer
                    ? <Badge className="bg-blue-100 text-blue-800">Customer confirmed — admin review</Badge>
                    : status === "delivered"
                    ? <Badge className="bg-orange-100 text-orange-800">Awaiting customer confirmation</Badge>
                    : <Badge className="bg-yellow-100 text-yellow-800">In escrow</Badge>
                  }
                </div>
              )}
              {orderDetails.escrowRejected && orderDetails.escrowRejectionNote && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm mt-2">
                  <div className="flex items-center gap-2 font-medium text-red-800">
                    <XCircle className="h-4 w-4" />
                    Admin rejected payout release
                  </div>
                  <p className="mt-1 text-red-700">{orderDetails.escrowRejectionNote}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" /> Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1.5">
              <TimelineRow label="Order placed"  value={formatDate(orderDetails.orderDate)} />
              {orderDetails.confirmedAt  && <TimelineRow label="Confirmed"  value={formatDate(orderDetails.confirmedAt)} />}
              {orderDetails.processedAt  && <TimelineRow label="Processing" value={formatDate(orderDetails.processedAt)} />}
              {orderDetails.shippedAt    && <TimelineRow label="Shipped"    value={formatDate(orderDetails.shippedAt)} />}
              {orderDetails.deliveredAt  && <TimelineRow label="Delivered"  value={formatDate(orderDetails.deliveredAt)} />}
            </CardContent>
          </Card>

          {/* Status history */}
          {orderDetails.statusHistory?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" /> Status History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...orderDetails.statusHistory].reverse().map((entry, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="flex-shrink-0 w-1.5 rounded-full bg-primary/30 mt-1" />
                      <div>
                        <p className="font-medium capitalize">
                          {entry.previousStatus
                            ? `${entry.previousStatus} → ${entry.newStatus}`
                            : entry.newStatus
                          }
                        </p>
                        {entry.reason && (
                          <p className="text-xs text-muted-foreground">{entry.reason}</p>
                        )}
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          {entry.changedByRole && <span className="capitalize">{entry.changedByRole} · </span>}
                          {formatDate(entry.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}

// ── Action panel ───────────────────────────────────────────────────────────

function OrderActionPanel({ status, isSubmitting, orderDetails, onAccept, onProcess, onShip }) {
  const isPaid = orderDetails?.paymentStatus === "paid";

  // No action available after delivery
  if (status === "delivered" || status === "cancelled") return null;

  // Waiting for payment — no vendor action
  if (!isPaid) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="flex items-center gap-3 py-4">
          <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-yellow-800 text-sm">Awaiting payment confirmation</p>
            <p className="text-xs text-yellow-700">No actions available until payment is confirmed.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "pending") {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="flex items-center justify-between gap-4 py-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">New Order Received</p>
              <p className="text-xs text-muted-foreground">
                Customer: <span className="font-medium">{orderDetails.customerName}</span>
                {" · "}ETB {orderDetails.totalAmount?.toFixed(2)}
              </p>
            </div>
          </div>
          <Button onClick={onAccept} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Accept Order
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "confirmed") {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex items-center justify-between gap-4 py-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Order Confirmed</p>
              <p className="text-xs text-muted-foreground">Start preparing the product when you're ready.</p>
            </div>
          </div>
          <Button onClick={onProcess} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
            Start Processing
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "processing") {
    return (
      <Card className="border-indigo-200 bg-indigo-50">
        <CardContent className="flex items-center justify-between gap-4 py-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Preparing Order</p>
              <p className="text-xs text-muted-foreground">Hand to courier and mark as shipped when ready.</p>
            </div>
          </div>
          <Button onClick={onShip} disabled={isSubmitting} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
            Mark as Shipped
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "shipped") {
    return (
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="flex items-center gap-3 py-4">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Truck className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-purple-800">Order Shipped</p>
            <p className="text-xs text-purple-700">
              Waiting for the customer to confirm delivery. No further action required from you.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

// ── Small helper ───────────────────────────────────────────────────────────

function TimelineRow({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export default VendorOrderDetails;
