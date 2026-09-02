import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Package, Loader2, Store, ChevronRight, AlertCircle } from "lucide-react";
import {
  getAllOrdersByUserId,
  getOrderDetails,
  resetOrderDetails,
} from "@/store/shop/order-slice";
import { fetchMyReturnRequests } from "@/store/shop/return-slice";
import ShoppingOrderDetailsView from "../order-details";
import Pagination from "@/components/common/pagination";
import { currencyFormatter } from "@/utils";

const PAGE_SIZE = 5;

// ── Status colour map ────────────────────────────────────────────────────────
const statusColor = (status) => {
  const map = {
    delivered:  "bg-green-100  text-green-800",
    shipped:    "bg-purple-100 text-purple-800",
    processing: "bg-blue-100   text-blue-800",
    confirmed:  "bg-indigo-100 text-indigo-800",
    cancelled:  "bg-red-100    text-red-800",
    pending:    "bg-yellow-100 text-yellow-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
};

// ── Payment status pill ──────────────────────────────────────────────────────
const paymentColor = (status) =>
  status === "paid"
    ? "bg-green-50 text-green-700 border-green-200"
    : "bg-yellow-50 text-yellow-700 border-yellow-200";

// ── Single order card ────────────────────────────────────────────────────────
function OrderCard({ order, onView }) {
  const groupId    = order.orderGroupId || order._id;
  const subOrders  = order.subOrders || [];
  const itemCount  = subOrders.reduce((s, sub) => s + (sub.cartItems?.length || 0), 0)
                     || order.cartItems?.length || 0;
  const vendorCount = subOrders.length;

  const needsConfirm = subOrders.some(
    (sub) =>
      order.paymentStatus === "paid" &&
      sub.orderStatus === "shipped" &&
      !sub.deliveryConfirmedByCustomer
  );

  const displayId =
    order.displayOrderId ||
    (order.subOrders?.length > 1
      ? order.parentOrderId
      : order.subOrders?.[0]?.vendorOrderId) ||
    `ORD-${groupId?.slice(-8).toUpperCase()}`;

  const formattedDate = new Date(order.orderDate).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  });

  return (
    <div className="group bg-white m-auto md:w-[70%] rounded-2xl border border-gray-100 overflow-hidden">

      {/* ── Card top bar: order id + date ── */}
      <div className="flex items-center justify-between gap-3 px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
          <span className="font-mono text-[11px] sm:text-sm font-semibold text-gray-700 truncate">
            {displayId}
          </span>
        </div>
        <span className="text-[10px] sm:text-sm text-muted-foreground shrink-0">{formattedDate}</span>
      </div>

      {/* ── Card body ── */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-6">

        {/* Left — status + meta */}
        <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2.5">

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <Badge className={`text-[10px] sm:text-xs font-medium border-0 ${statusColor(order.orderStatus)}`}>
              {order.orderStatus}
            </Badge>
            <span className={`inline-flex items-center text-[9px] sm:text-[11px] font-medium px-1.5 sm:px-2.5 py-0.5 rounded-full border capitalize ${paymentColor(order.paymentStatus)}`}>
              {order.paymentStatus}
            </span>

            {vendorCount > 1 && subOrders.map((sub) => (
              <Badge
                key={sub._id}
                className={`text-[9px] sm:text-[10px] border-0 ${statusColor(sub.orderStatus)}`}
              >
                {sub.storeName
                  ? sub.storeName.split(" ")[0]
                  : `Store ${sub._id?.toString().slice(-4).toUpperCase()}`
                }: {sub.orderStatus}
              </Badge>
            ))}

            {needsConfirm && (
              <button
                onClick={() => onView(groupId)}
                className="inline-flex items-center gap-1 text-[9px] sm:text-[11px] font-semibold px-1.5 sm:px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
              >
                <AlertCircle className="h-2.5 w-2.5" />
                Confirm delivery
              </button>
            )}
          </div>

          {/* Item + vendor count */}
          <p className="text-[10px] sm:text-sm text-muted-foreground flex items-center gap-2">
            <span>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
            {vendorCount > 1 && (
              <span className="flex items-center gap-0.5">
                <span className="text-gray-300">·</span>
                <Store className="h-3 w-3" />
                {vendorCount} stores
              </span>
            )}
          </p>
        </div>

        {/* Right — amount + action */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-2.5 shrink-0">
          <span className="text-sm sm:text-xl font-bold text-gray-900">
            {currencyFormatter(order.totalAmount)}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(groupId)}
            className="h-7 sm:h-10 px-2.5 sm:px-5 text-[10px] sm:text-sm gap-1 rounded-xl border-gray-200 hover:border-primary hover:text-primary transition-colors"
          >
            Details
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
function AccountOrders() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { orderList, orderDetails, isLoading } = useSelector(
    (state) => state.shopOrder
  );
  const [openDetails, setOpenDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const userId = user?.id || user?._id;

  // ── Data fetching (unchanged) ────────────────────────────────────────────
  useEffect(() => {
    if (userId) {
      dispatch(getAllOrdersByUserId(userId));
      dispatch(fetchMyReturnRequests());
    }
  }, [dispatch, userId]);

  useEffect(() => {
    if (orderDetails) setOpenDetails(true);
  }, [orderDetails]);

  useEffect(() => {
    setCurrentPage(1);
  }, [orderList?.length]);

  // ── Handlers (unchanged) ─────────────────────────────────────────────────
  const handleView = (id) => dispatch(getOrderDetails(id));

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Pagination (unchanged) ────────────────────────────────────────────────
  const totalOrders = orderList?.length ?? 0;
  const totalPages  = Math.ceil(totalOrders / PAGE_SIZE);
  const startIdx    = (currentPage - 1) * PAGE_SIZE;
  const paginated   = orderList?.slice(startIdx, startIdx + PAGE_SIZE) || [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Page header */}
      <div className="flex flex-col items-center justify-center mt-5">
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">
            My Orders
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {totalOrders > 0
              ? `${totalOrders} order${totalOrders !== 1 ? "s" : ""}`
              : "Track and manage your purchases"}
          </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading your orders…</p>
        </div>

      ) : paginated.length > 0 ? (
        <>
          <div className="space-y-3">
            {paginated.map((order) => (
              <OrderCard
                key={order.orderGroupId || order._id}
                order={order}
                onView={handleView}
              />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>

      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <div className="text-center">
            <p className="font-medium text-gray-900">No orders yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your order history will appear here once you place an order.
            </p>
          </div>
        </div>
      )}

      {/* Details dialog (unchanged) */}
      <Dialog
        open={openDetails}
        onOpenChange={() => {
          setOpenDetails(false);
          dispatch(resetOrderDetails());
        }}
      >
        <ShoppingOrderDetailsView orderDetails={orderDetails} />
      </Dialog>
    </div>
  );
}

export default AccountOrders;
