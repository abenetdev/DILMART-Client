import { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  Search,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MoreVertical,
  Package,
  MapPin,
  CreditCard,
} from "lucide-react";
import {
  getAllOrdersForAdmin,
  getOrderDetailsForAdmin,
  updateOrderStatus,
  confirmEscrowRelease,
  rejectEscrowRelease,
  resetOrderDetails,
} from "@/store/admin/order-slice";

const fmt = (n) =>
  `ETB ${(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function OrderStatusBadge({ status }) {
  const map = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-indigo-100 text-indigo-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return (
    <Badge className={map[status] || "bg-gray-100 text-gray-800"}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </Badge>
  );
}

function PaymentStatusBadge({ status }) {
  const map = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
  };
  return (
    <Badge className={map[status] || "bg-gray-100 text-gray-800"}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </Badge>
  );
}

export default function AdminOrders() {
  const dispatch = useDispatch();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [escrowPendingOnly, setEscrowPendingOnly] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const { orderList, orderDetails, isListLoading, isSubmitting } =
    useSelector((s) => s.adminOrder);

  const loadOrders = (search = searchTerm) => {
    dispatch(
      getAllOrdersForAdmin({
        search,
        status: filterStatus,
        paymentStatus: filterPayment,
        escrowPending: escrowPendingOnly,
      })
    );
  };

  useEffect(() => {
    loadOrders("");
  }, [dispatch, filterStatus, filterPayment, escrowPendingOnly]);

  useEffect(() => {
    if (orderDetails) {
      setSelectedStatus(orderDetails.orderStatus);
    }
  }, [orderDetails]);

  const handleSearch = () => loadOrders(searchTerm);

  const handleViewDetails = (orderId) => {
    dispatch(getOrderDetailsForAdmin(orderId));
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    dispatch(resetOrderDetails());
  };

  const handleStatusUpdate = async () => {
    if (!orderDetails || selectedStatus === orderDetails.orderStatus) {
      toast({ title: "No changes to save" });
      return;
    }

    const result = await dispatch(
      updateOrderStatus({ id: orderDetails._id, orderStatus: selectedStatus })
    );

    if (result?.payload?.success) {
      toast({ title: result.payload.message });
      loadOrders();
    } else {
      toast({
        title: "Update failed",
        description: result?.payload?.message || "Could not update status",
        variant: "destructive",
      });
    }
  };

  const handleConfirmEscrow = async () => {
    if (!orderDetails) return;

    const result = await dispatch(confirmEscrowRelease(orderDetails._id));

    if (result?.payload?.success) {
      toast({ title: result.payload.message });
      loadOrders();
    } else {
      toast({
        title: "Release failed",
        description: result?.payload?.message || "Could not release escrow",
        variant: "destructive",
      });
    }
  };

  const handleRejectEscrow = async () => {
    if (!orderDetails || !rejectNote.trim()) {
      toast({
        title: "Note required",
        description: "Please provide a reason the vendor will see",
        variant: "destructive",
      });
      return;
    }

    const result = await dispatch(
      rejectEscrowRelease({ id: orderDetails._id, adminNote: rejectNote.trim() })
    );

    if (result?.payload?.success) {
      toast({ title: result.payload.message });
      setRejectDialogOpen(false);
      setRejectNote("");
      loadOrders();
    } else {
      toast({
        title: "Rejection failed",
        description: result?.payload?.message || "Could not reject escrow release",
        variant: "destructive",
      });
    }
  };

  const canReviewEscrow = (order) =>
    order.paymentStatus === "paid" &&
    order.orderStatus === "delivered" &&
    !order.escrowReleased &&
    !order.escrowRejected;

  const needsEscrowRelease = (order) =>
    canReviewEscrow(order) && order.deliveryConfirmedByCustomer;

  const awaitingCustomerConfirm = (order) =>
    order.paymentStatus === "paid" &&
    order.orderStatus === "delivered" &&
    !order.deliveryConfirmedByCustomer &&
    !order.escrowReleased &&
    !order.escrowRejected;

  const stats = {
    total: orderList.length,
    pending: orderList.filter((o) => o.orderStatus === "pending").length,
    paid: orderList.filter((o) => o.paymentStatus === "paid").length,
    delivered: orderList.filter((o) => o.orderStatus === "delivered").length,
    awaitingCustomer: orderList.filter(awaitingCustomerConfirm).length,
    escrowPending: orderList.filter(needsEscrowRelease).length,
  };

  return (
    <Fragment>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">All Orders</h1>
        <p className="text-muted-foreground">
          View and manage orders across the entire marketplace
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Customer</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.awaitingCustomer}</div>
            <p className="text-xs text-muted-foreground mt-1">Delivered, not confirmed</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => setEscrowPendingOnly((v) => !v)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ready to Release</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.escrowPending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {escrowPendingOnly ? "Filter on" : "Customer confirmed"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search order ID or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Order status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPayment} onValueChange={setFilterPayment}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Escrow</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isListLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : orderList.length > 0 ? (
              orderList.map((order) => (
                <TableRow key={order._id}>
                  <TableCell className="font-mono text-sm">{order.orderId}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.customerEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{order.vendorName}</TableCell>
                  <TableCell className="font-medium">{fmt(order.totalAmount)}</TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.orderStatus} />
                  </TableCell>
                  <TableCell>
                    {order.paymentStatus !== "paid" ? (
                      <Badge className="bg-gray-100 text-gray-800">N/A</Badge>
                    ) : order.escrowReleased ? (
                      <Badge className="bg-green-100 text-green-800">Released</Badge>
                    ) : order.escrowRejected ? (
                      <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                    ) : order.orderStatus === "delivered" && order.deliveryConfirmedByCustomer ? (
                      <Badge className="bg-orange-100 text-orange-800">Ready to release</Badge>
                    ) : order.orderStatus === "delivered" ? (
                      <Badge className="bg-yellow-100 text-yellow-800">Awaiting customer</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">In escrow</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(order.orderDate)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(order._id)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No orders found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={detailsOpen} onOpenChange={handleCloseDetails}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {isSubmitting && !orderDetails ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : orderDetails ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">{orderDetails.orderId}</span>
                <div className="flex gap-2">
                  <PaymentStatusBadge status={orderDetails.paymentStatus} />
                  <OrderStatusBadge status={orderDetails.orderStatus} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{orderDetails.customerName}</p>
                  <p className="text-xs">{orderDetails.customerEmail}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Store</p>
                  <p className="font-medium">{orderDetails.vendorName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-bold text-lg">{fmt(orderDetails.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p>{formatDate(orderDetails.orderDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p className="capitalize">{orderDetails.paymentMethod || "—"}</p>
                </div>
                {orderDetails.paymentId && (
                  <div>
                    <p className="text-muted-foreground">Payment Ref</p>
                    <p className="text-xs font-mono truncate">{orderDetails.paymentId}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="font-medium flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4" />
                  Items ({orderDetails.cartItems?.length || 0})
                </p>
                <div className="space-y-2">
                  {orderDetails.cartItems?.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded border p-2 text-sm"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-10 w-10 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.title}</p>
                        <p className="text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{fmt(parseFloat(item.price) * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {orderDetails.addressInfo && (
                <>
                  <Separator />
                  <div>
                    <p className="font-medium flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4" />
                      Shipping Address
                    </p>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <p>{orderDetails.addressInfo.address}</p>
                      <p>
                        {[orderDetails.addressInfo.city, orderDetails.addressInfo.pincode]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p>{orderDetails.addressInfo.phone}</p>
                      {orderDetails.addressInfo.notes && (
                        <p className="italic">Note: {orderDetails.addressInfo.notes}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {orderDetails.paymentStatus === "paid" && (
                <div className="rounded-lg border p-3 space-y-3">
                  <p className="font-medium text-sm">Vendor payout (escrow)</p>

                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vendor delivered</span>
                      <span>
                        {orderDetails.orderStatus === "delivered" ? (
                          <Badge className="bg-green-100 text-green-800">Yes</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">No</Badge>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer confirmed</span>
                      <span>
                        {orderDetails.deliveryConfirmedByCustomer ? (
                          <Badge className="bg-green-100 text-green-800">
                            Yes
                            {orderDetails.deliveryConfirmedAt && (
                              <span className="ml-1 font-normal opacity-80">
                                · {formatDate(orderDetails.deliveryConfirmedAt)}
                              </span>
                            )}
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">Waiting</Badge>
                        )}
                      </span>
                    </div>
                  </div>

                  {orderDetails.escrowReleased ? (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      Funds released
                      {orderDetails.escrowReleasedAt && (
                        <span className="text-muted-foreground">
                          · {formatDate(orderDetails.escrowReleasedAt)}
                        </span>
                      )}
                    </div>
                  ) : orderDetails.escrowRejected ? (
                    <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                      <div className="flex items-center gap-2 font-medium">
                        <XCircle className="h-4 w-4" />
                        Release rejected
                        {orderDetails.escrowRejectedAt && (
                          <span className="font-normal text-red-600">
                            · {formatDate(orderDetails.escrowRejectedAt)}
                          </span>
                        )}
                      </div>
                      <p className="mt-2">{orderDetails.escrowRejectionNote}</p>
                    </div>
                  ) : orderDetails.orderStatus === "delivered" &&
                    orderDetails.deliveryConfirmedByCustomer ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Customer confirmed receipt. Review if needed, then release or reject
                        funds for this order.
                      </p>
                      <Button
                        onClick={handleConfirmEscrow}
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? "Processing..." : "Release funds to vendor"}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setRejectDialogOpen(true)}
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        Reject release
                      </Button>
                    </div>
                  ) : canReviewEscrow(orderDetails) ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        You can reject escrow release if there is a dispute. The vendor will
                        see your note.
                      </p>
                      <Button
                        variant="destructive"
                        onClick={() => setRejectDialogOpen(true)}
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        Reject release
                      </Button>
                    </div>
                  ) : orderDetails.orderStatus === "delivered" ? (
                    <p className="text-sm text-muted-foreground">
                      Vendor marked delivered. Waiting for the customer to confirm they
                      received the order before you can release funds.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Waiting for vendor to mark order as delivered.
                    </p>
                  )}
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <Label>Update Order Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleStatusUpdate}
                  disabled={isSubmitting || selectedStatus === orderDetails.orderStatus}
                  className="w-full"
                >
                  {isSubmitting ? "Updating..." : "Update Status"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject escrow release</DialogTitle>
            <DialogDescription>
              The vendor will see this note. Pending earnings for this order will be removed
              from escrow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="reject-note">Reason for rejection</Label>
            <Textarea
              id="reject-note"
              placeholder="e.g. Customer reported item not received or damaged..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectEscrow}
                disabled={isSubmitting || !rejectNote.trim()}
              >
                {isSubmitting ? "Rejecting..." : "Reject release"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}
