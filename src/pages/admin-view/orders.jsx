import { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllOrdersForAdmin, getOrderDetailsForAdmin,
  updateOrderStatus, confirmEscrowRelease,
  rejectEscrowRelease, resetOrderDetails,
} from "@/store/admin/order-slice";
import { Button }    from "@/components/ui/button";
import { Badge }     from "@/components/ui/badge";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea }  from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Search, ShoppingBag, Clock, CheckCircle, XCircle, Eye,
  MoreVertical, Package, MapPin, CreditCard, Store,
  ChevronDown, ChevronUp, RotateCcw, RefreshCw,
} from "lucide-react";
import AdminReturnRequestsTab from "@/components/admin-view/return-requests-tab";
import { currencyFormatter } from "@/utils";

// ── Constants ──────────────────────────────────────────────────────────────
const ORDER_STATUSES = ["pending","confirmed","processing","shipped","delivered","cancelled"];

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" })
  : "—";
const fmtDateTime = (d) => d
  ? new Date(d).toLocaleString("en-US", { year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })
  : "—";

// ── Badge helpers ──────────────────────────────────────────────────────────
const ORDER_STATUS_COLORS = {
  pending:    "bg-yellow-100 text-yellow-800",
  confirmed:  "bg-blue-100   text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped:    "bg-purple-100 text-purple-800",
  delivered:  "bg-green-100  text-green-800",
  cancelled:  "bg-red-100    text-red-800",
};
const PAYMENT_STATUS_COLORS = {
  pending:  "bg-yellow-100 text-yellow-800",
  paid:     "bg-green-100  text-green-800",
  failed:   "bg-red-100    text-red-800",
  refunded: "bg-gray-100   text-gray-800",
};

function OrderStatusBadge({ status }) {
  return (
    <Badge className={`${ORDER_STATUS_COLORS[status] || "bg-gray-100 text-gray-800"} border-0 capitalize`}>
      {status}
    </Badge>
  );
}
function PaymentBadge({ status }) {
  return (
    <Badge className={`${PAYMENT_STATUS_COLORS[status] || "bg-gray-100 text-gray-800"} border-0 capitalize`}>
      {status}
    </Badge>
  );
}

// ── Escrow status cell ─────────────────────────────────────────────────────
function EscrowBadge({ group }) {
  if (group.paymentStatus !== "paid")
    return <Badge className="bg-gray-100 text-gray-600 border-0">N/A</Badge>;
  if (group.subOrders?.every((s) => s.escrowReleased))
    return <Badge className="bg-green-100 text-green-800 border-0">Released</Badge>;
  if (group.subOrders?.some((s) => s.escrowRejected))
    return <Badge className="bg-red-100 text-red-800 border-0">Rejected</Badge>;
  if (group.escrowPending)
    return <Badge className="bg-orange-100 text-orange-800 border-0">Ready to release</Badge>;
  if (group.awaitingCustomer)
    return <Badge className="bg-yellow-100 text-yellow-800 border-0">Awaiting customer</Badge>;
  return <Badge className="bg-gray-100 text-gray-700 border-0">In escrow</Badge>;
}

// ── Sub-order vendor block inside the details dialog ──────────────────────
function SubOrderBlock({ sub, groupOrder, onUpdateStatus, onEscrowAction, isSubmitting }) {
  const [expanded, setExpanded] = useState(true);
  const [selStatus, setSelStatus] = useState(sub.orderStatus);

  useEffect(() => { setSelStatus(sub.orderStatus); }, [sub.orderStatus]);

  const canRelease =
    groupOrder.paymentStatus === "paid" &&
    sub.orderStatus === "delivered" &&
    sub.deliveryConfirmedByCustomer &&
    !sub.escrowReleased &&
    !sub.escrowRejected;

  const awaitingConfirm =
    groupOrder.paymentStatus === "paid" &&
    sub.orderStatus === "delivered" &&
    !sub.deliveryConfirmedByCustomer &&
    !sub.escrowReleased;

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Vendor header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {sub.storeLogo
            ? <img src={sub.storeLogo} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" />
            : <Store className="h-4 w-4 text-muted-foreground shrink-0" />
          }
          <span className="font-semibold text-sm truncate">{sub.storeName}</span>
          {sub.vendorOrderId && (
            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono hidden sm:inline">
              {sub.vendorOrderId}
            </code>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <OrderStatusBadge status={sub.orderStatus} />
          <span className="font-semibold text-sm">{currencyFormatter(sub.totalAmount)}</span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Items */}
          <div className="space-y-2">
            {sub.cartItems?.map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border bg-muted/20 p-2.5 text-sm">
                {item.image && (
                  <img src={item.image} alt={item.title}
                    className="h-10 w-10 rounded-lg object-cover shrink-0 border" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold shrink-0">
                  {currencyFormatter(parseFloat(item.price) * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Commission breakdown */}
          {groupOrder.paymentStatus === "paid" && sub.commissionRate != null && (
            <div className="rounded-lg border bg-slate-50 p-3 space-y-1.5 text-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />Financial Breakdown
              </p>
              <div className="flex justify-between text-muted-foreground">
                <span>Order Amount</span>
                <span className="font-medium text-foreground">{currencyFormatter(sub.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-orange-700">
                <span>Commission ({sub.commissionRate}%)</span>
                <span className="font-medium">− {currencyFormatter(sub.commissionAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1.5 text-green-700">
                <span>Vendor Receives</span>
                <span>{currencyFormatter(sub.vendorAmount)}</span>
              </div>
            </div>
          )}

          {/* Status update */}
          <div className="flex gap-2 items-center">
            <Select value={selStatus} onValueChange={setSelStatus}>
              <SelectTrigger className="flex-1 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm" className="shrink-0"
              disabled={isSubmitting || selStatus === sub.orderStatus}
              onClick={() => onUpdateStatus(sub._id, selStatus)}
            >
              Update
            </Button>
          </div>

          {/* Escrow panel */}
          {groupOrder.paymentStatus === "paid" && (
            <div className="rounded-lg border p-3 space-y-3">
              <p className="text-sm font-medium">Escrow</p>
              <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                <span className="text-muted-foreground">Customer confirmed</span>
                <span>
                  {sub.deliveryConfirmedByCustomer
                    ? <Badge className="bg-green-100 text-green-800 border-0">Yes · {fmtDate(sub.deliveryConfirmedAt)}</Badge>
                    : <Badge className="bg-yellow-100 text-yellow-800 border-0">Waiting</Badge>}
                </span>
                <span className="text-muted-foreground">Escrow status</span>
                <span>
                  {sub.escrowReleased
                    ? <Badge className="bg-green-100 text-green-800 border-0">Released · {fmtDate(sub.escrowReleasedAt)}</Badge>
                    : sub.escrowRejected
                    ? <Badge className="bg-red-100 text-red-800 border-0">Rejected</Badge>
                    : <Badge className="bg-gray-100 text-gray-700 border-0">Held</Badge>}
                </span>
              </div>

              {sub.escrowRejected && sub.escrowRejectionNote && (
                <div className="rounded-md bg-red-50 border border-red-200 p-2.5 text-sm text-red-800">
                  <p className="font-medium flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5" />Rejection note
                  </p>
                  <p className="mt-1">{sub.escrowRejectionNote}</p>
                </div>
              )}

              {canRelease && (
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1"
                    disabled={isSubmitting} onClick={() => onEscrowAction("release", sub._id)}>
                    {isSubmitting ? "Processing…" : "Release funds"}
                  </Button>
                  <Button size="sm" variant="destructive" className="flex-1"
                    disabled={isSubmitting} onClick={() => onEscrowAction("reject", sub._id)}>
                    Reject release
                  </Button>
                </div>
              )}

              {awaitingConfirm && (
                <p className="text-xs text-muted-foreground">
                  Waiting for customer to confirm delivery before escrow can be released.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Order Details Dialog ───────────────────────────────────────────────────
function OrderDetailsDialog({ open, onClose, orderGroupId }) {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { orderDetails, isSubmitting } = useSelector((s) => s.adminOrder);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTargetId,   setRejectTargetId]   = useState(null);
  const [rejectNote,       setRejectNote]       = useState("");

  useEffect(() => {
    if (open && orderGroupId) dispatch(getOrderDetailsForAdmin(orderGroupId));
  }, [open, orderGroupId, dispatch]);

  useEffect(() => {
    if (!open) { setRejectDialogOpen(false); setRejectNote(""); }
  }, [open]);

  const reload = () => { if (orderGroupId) dispatch(getOrderDetailsForAdmin(orderGroupId)); };

  const handleUpdateStatus = async (subOrderId, status) => {
    const r = await dispatch(updateOrderStatus({ id: subOrderId, orderStatus: status }));
    if (r?.payload?.success) { toast({ title: r.payload.message }); }
    else toast({ title: r?.payload?.message || "Update failed", variant: "destructive" });
  };

  const handleEscrowAction = (type, subOrderId) => {
    if (type === "release") {
      dispatch(confirmEscrowRelease(subOrderId)).then((r) => {
        if (r?.payload?.success) toast({ title: r.payload.message });
        else toast({ title: r?.payload?.message || "Failed", variant: "destructive" });
      });
    } else {
      setRejectTargetId(subOrderId);
      setRejectDialogOpen(true);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectNote.trim()) {
      toast({ title: "Please provide a reason", variant: "destructive" });
      return;
    }
    const r = await dispatch(rejectEscrowRelease({ id: rejectTargetId, adminNote: rejectNote.trim() }));
    if (r?.payload?.success) {
      toast({ title: r.payload.message });
      setRejectDialogOpen(false);
      setRejectNote("");
    } else {
      toast({ title: r?.payload?.message || "Failed", variant: "destructive" });
    }
  };

  const d = orderDetails;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Package className="h-5 w-5 text-primary" />
              Order Details
            </DialogTitle>
          </DialogHeader>

          {!d ? (
            <div className="py-16 text-center text-muted-foreground">Loading…</div>
          ) : (
            <div className="space-y-5 pt-1">

              {/* ── Header summary ── */}
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-bold font-mono">{d.displayOrderId}</p>
                    {d.isMultiVendor && d.parentOrderId && (
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        Group: {d.parentOrderId}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <PaymentBadge status={d.paymentStatus} />
                    <OrderStatusBadge status={d.orderStatus} />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="font-medium">{d.customerName}</p>
                    <p className="text-xs text-muted-foreground truncate">{d.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium">{fmtDate(d.orderDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Vendors</p>
                    <p className="font-medium">{d.vendorCount} store{d.vendorCount !== 1 ? "s" : ""}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold">{currencyFormatter(d.totalAmount)}</p>
                  </div>
                </div>

                {d.paymentId && (
                  <p className="text-[11px] text-muted-foreground font-mono truncate">
                    Payment ref: {d.paymentId}
                  </p>
                )}
              </div>

              {/* ── Delivery address ── */}
              {d.addressInfo && (
                <div className="rounded-xl border p-3 flex items-start gap-2.5 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{d.addressInfo.address}</p>
                    <p className="text-muted-foreground">
                      {[d.addressInfo.city, d.addressInfo.pincode].filter(Boolean).join(", ")}
                    </p>
                    {d.addressInfo.phone && (
                      <p className="text-muted-foreground">{d.addressInfo.phone}</p>
                    )}
                    {d.addressInfo.notes && (
                      <p className="text-muted-foreground italic text-xs mt-0.5">{d.addressInfo.notes}</p>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* ── Per-vendor sub-orders ── */}
              <div className="space-y-3">
                {d.vendorCount > 1 && (
                  <p className="text-sm font-medium text-muted-foreground">
                    {d.vendorCount} vendors in this checkout
                  </p>
                )}
                {d.subOrders?.map((sub) => (
                  <SubOrderBlock
                    key={sub._id?.toString()}
                    sub={sub}
                    groupOrder={d}
                    onUpdateStatus={handleUpdateStatus}
                    onEscrowAction={handleEscrowAction}
                    isSubmitting={isSubmitting}
                  />
                ))}
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject escrow confirmation dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />Reject Escrow Release
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Provide a reason — the vendor will see this note.
            </p>
            <Textarea
              placeholder="Reason for rejection…"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1 gap-2"
              disabled={isSubmitting || !rejectNote.trim()} onClick={handleRejectConfirm}>
              {isSubmitting ? "Processing…" : "Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AdminOrders() {
  const dispatch   = useDispatch();
  const { toast }  = useToast();
  const { orderList, isListLoading } = useSelector((s) => s.adminOrder);

  const [searchTerm,       setSearchTerm]       = useState("");
  const [filterStatus,     setFilterStatus]      = useState("all");
  const [filterPayment,    setFilterPayment]     = useState("all");
  const [escrowPendingOnly, setEscrowPendingOnly] = useState(false);
  const [detailsGroupId,   setDetailsGroupId]    = useState(null);
  const [activeTab,        setActiveTab]         = useState("orders");

  const loadOrders = (search = searchTerm) => {
    dispatch(getAllOrdersForAdmin({
      search,
      status:        filterStatus,
      paymentStatus: filterPayment,
      escrowPending: escrowPendingOnly,
    }));
  };

  useEffect(() => { loadOrders(""); }, [filterStatus, filterPayment, escrowPendingOnly]);

  const handleSearch = () => loadOrders(searchTerm);

  // Stats derived from grouped list
  const stats = {
    total:           orderList.length,
    pending:         orderList.filter((o) => o.orderStatus   === "pending").length,
    paid:            orderList.filter((o) => o.paymentStatus === "paid").length,
    delivered:       orderList.filter((o) => o.orderStatus   === "delivered").length,
    awaitingCustomer: orderList.filter((o) => o.awaitingCustomer).length,
    escrowPending:   orderList.filter((o) => o.escrowPending).length,
  };

  return (
    <Fragment>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">All Orders</h1>
        <p className="text-muted-foreground">
          Each row represents one customer checkout — multi-vendor orders are grouped.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-0 border-b mb-6">
        {[
          { id: "orders",  label: "Orders" },
          { id: "returns", label: "Returns & Refunds", icon: <RotateCcw className="h-3.5 w-3.5" /> },
        ].map(({ id, label, icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {activeTab === "returns" && <AdminReturnRequestsTab />}

      {activeTab === "orders" && (
        <>
          {/* Stats cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
            {[
              { label: "Total Orders",     value: stats.total,           icon: ShoppingBag, color: "text-muted-foreground" },
              { label: "Pending",          value: stats.pending,         icon: Clock,       color: "text-yellow-600" },
              { label: "Paid",             value: stats.paid,            icon: CreditCard,  color: "text-green-600" },
              { label: "Delivered",        value: stats.delivered,       icon: CheckCircle, color: "text-green-600" },
              { label: "Awaiting Customer",value: stats.awaitingCustomer,icon: Clock,       color: "text-yellow-600",
                sub: "Delivered, not confirmed" },
              { label: "Ready to Release", value: stats.escrowPending,   icon: Package,     color: "text-orange-600",
                sub: escrowPendingOnly ? "Filter on" : "Click to filter", onClick: () => setEscrowPendingOnly((v) => !v) },
            ].map(({ label, value, icon: Icon, color, sub, onClick }) => (
              <Card key={label} className={onClick ? "cursor-pointer hover:bg-muted/50" : ""} onClick={onClick}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{label}</CardTitle>
                  <Icon className={`h-4 w-4 ${color}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center mb-6">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, customer, store…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={handleSearch} className="gap-1.5">
              <Search className="h-4 w-4" />Search
            </Button>
            <Button variant="outline" size="icon" onClick={() => loadOrders("")} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Order status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPayment} onValueChange={(v) => { setFilterPayment(v); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Payment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                {["pending","paid","failed","refunded"].map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Orders table */}
          <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-center">Vendors</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Escrow</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isListLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                      Loading orders…
                    </TableCell>
                  </TableRow>
                ) : orderList.length > 0 ? (
                  orderList.map((order) => (
                    <TableRow key={order._id} className="hover:bg-muted/20">
                      {/* Order ID */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-mono text-sm font-bold">{order.displayOrderId}</p>
                          {order.isMultiVendor && order.parentOrderId && (
                            <p className="font-mono text-[10px] text-muted-foreground">
                              Group: {order.parentOrderId}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <p className="font-medium text-sm">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                          {order.customerEmail}
                        </p>
                      </TableCell>

                      {/* Vendor count */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Store className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">{order.vendorCount}</span>
                        </div>
                        {order.isMultiVendor && (
                          <p className="text-[10px] text-muted-foreground">multi-vendor</p>
                        )}
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="font-semibold">
                        {currencyFormatter(order.totalAmount)}
                      </TableCell>

                      {/* Payment */}
                      <TableCell><PaymentBadge status={order.paymentStatus} /></TableCell>

                      {/* Status */}
                      <TableCell><OrderStatusBadge status={order.orderStatus} /></TableCell>

                      {/* Escrow */}
                      <TableCell><EscrowBadge group={order} /></TableCell>

                      {/* Date */}
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {fmtDate(order.orderDate)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => setDetailsGroupId(order.orderGroupId)}
                            >
                              <Eye className="h-4 w-4" />View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16">
                      <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-30" />
                      <p className="text-muted-foreground">No orders found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Details dialog */}
          <OrderDetailsDialog
            open={!!detailsGroupId}
            orderGroupId={detailsGroupId}
            onClose={() => {
              setDetailsGroupId(null);
              dispatch(resetOrderDetails());
            }}
          />
        </>
      )}
    </Fragment>
  );
}
