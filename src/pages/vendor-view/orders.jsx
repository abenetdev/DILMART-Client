import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye, Search, ShoppingBag, TrendingUp, Clock, CheckCircle, RotateCcw, Loader2,
} from "lucide-react";
import {
  fetchOrdersPage,
  resetOrders,
} from "@/store/vendor/order-slice";
import { currencyFormatter } from "@/utils";
import VendorReturnRequestsTab from "@/components/vendor-view/return-requests-tab";

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:    { className: "bg-yellow-100 text-yellow-800",  label: "Pending"    },
  confirmed:  { className: "bg-blue-100 text-blue-800",     label: "Confirmed"  },
  processing: { className: "bg-indigo-100 text-indigo-800", label: "Processing" },
  shipped:    { className: "bg-purple-100 text-purple-800", label: "Shipped"    },
  delivered:  { className: "bg-green-100 text-green-800",   label: "Delivered"  },
  cancelled:  { className: "bg-red-100 text-red-800",       label: "Cancelled"  },
};

// ── Shared: status badge ───────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

// ── Shared: next-action hint ───────────────────────────────────────────────
function NextActionHint({ status, paymentStatus }) {
  if (paymentStatus !== "paid") {
    return <span className="text-xs text-muted-foreground">Awaiting payment</span>;
  }
  const map = {
    pending:    <span className="text-xs font-medium text-yellow-700">Tap to Accept Order →</span>,
    confirmed:  <span className="text-xs font-medium text-blue-700">Tap to Start Processing →</span>,
    processing: <span className="text-xs font-medium text-indigo-700">Tap to Mark as Shipped →</span>,
    shipped:    <span className="text-xs text-purple-700">Waiting for customer confirmation</span>,
    delivered:  <span className="text-xs text-green-700">✓ Completed</span>,
    cancelled:  <span className="text-xs text-muted-foreground">Cancelled</span>,
  };
  return map[status] ?? null;
}

// ── Mobile order card ──────────────────────────────────────────────────────
function OrderCard({ order, formatDate, onView }) {
  return (
    <div className="bg-background border rounded-xl p-3 space-y-3">
      {/* Top row: order ID + status + view button */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold truncate">
            {order.vendorOrderId || `ORD-${order._id?.slice(-8).toUpperCase()}`}
          </p>
          {order.parentOrderId && (
            <p className="font-mono text-[11px] text-muted-foreground truncate">
              {order.parentOrderId}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={order.orderStatus} />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onView(order._id)}
            title="View order"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <div>
          <span className="text-xs text-muted-foreground block">Customer</span>
          <span className="font-medium line-clamp-1">{order.customerName || "—"}</span>
          {order.addressInfo?.city && (
            <span className="text-xs text-muted-foreground">{order.addressInfo.city}</span>
          )}
        </div>

        <div>
          <span className="text-xs text-muted-foreground block">Total</span>
          <span className="font-semibold">ETB {currencyFormatter(order.totalAmount)}</span>
        </div>

        <div>
          <span className="text-xs text-muted-foreground block">Items</span>
          <span>{order.cartItems?.length || 0} item(s)</span>
        </div>

        <div>
          <span className="text-xs text-muted-foreground block">Date</span>
          <span className="text-xs">{formatDate(order.orderDate)}</span>
        </div>
      </div>

      {/* Next action — tappable for actionable states, static for terminal */}
      {["delivered", "cancelled"].includes(order.orderStatus) ? (
        <div className="flex items-center gap-1.5 bg-muted/30 rounded-lg px-3 py-1.5">
          <NextActionHint status={order.orderStatus} paymentStatus={order.paymentStatus} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onView(order._id)}
          className="w-full flex items-center gap-1.5 bg-muted/40 hover:bg-muted/70 rounded-lg px-3 py-1.5 transition-colors text-left"
        >
          <NextActionHint status={order.orderStatus} paymentStatus={order.paymentStatus} />
        </button>
      )}
    </div>
  );
}

// ── Mobile skeleton card ───────────────────────────────────────────────────
function OrderCardSkeleton() {
  return (
    <div className="bg-background border rounded-xl p-3 space-y-3 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
        <div className="h-6 w-20 bg-muted rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-8 bg-muted rounded" />
        <div className="h-8 bg-muted rounded" />
        <div className="h-8 bg-muted rounded" />
        <div className="h-8 bg-muted rounded" />
      </div>
      <div className="h-7 bg-muted rounded-lg" />
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

// ── Page component ─────────────────────────────────────────────────────────
function VendorOrders() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm,   setSearchTerm]   = useState("");
  const [activeTab,    setActiveTab]    = useState("orders");

  const {
    orderList,
    isListLoading,
    isLoadingMore,
    hasNextPage,
    currentPage,
  } = useSelector((s) => s.vendorOrder);
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ── Sentinel ref ──────────────────────────────────────────────────────
  const sentinelRef = useRef(null);

  // ── Keep latest filter values in a ref for the observer callback ──────
  const filtersRef = useRef({ filterStatus: "all", searchTerm: "" });
  useEffect(() => {
    filtersRef.current = { filterStatus, searchTerm };
  }, [filterStatus, searchTerm]);

  // ── Load a single page ────────────────────────────────────────────────
  const loadPage = useCallback(
    (page) => {
      if (!isAuthenticated || !user?.id) return;
      dispatch(
        fetchOrdersPage({
          page,
          limit:  20,
          status: filtersRef.current.filterStatus,
          search: filtersRef.current.searchTerm,
        })
      );
    },
    [dispatch, isAuthenticated, user?.id]
  );

  // ── Reset + fetch page 1 when filters/search change ──────────────────
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    dispatch(resetOrders());
    const raf = requestAnimationFrame(() => {
      dispatch(
        fetchOrdersPage({
          page:   1,
          limit:  20,
          status: filterStatus,
          search: searchTerm,
        })
      );
    });
    return () => cancelAnimationFrame(raf);
  }, [dispatch, isAuthenticated, user?.id, filterStatus, searchTerm]);

  // ── Guard refs — updated every render so the observer never goes stale
  const hasNextPageRef = useRef(true);
  const isLoadingRef   = useRef(false);
  const currentPageRef = useRef(0);

  hasNextPageRef.current = hasNextPage;
  isLoadingRef.current   = isListLoading || isLoadingMore;
  currentPageRef.current = currentPage;

  // ── IntersectionObserver ──────────────────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        if (!hasNextPageRef.current || isLoadingRef.current) return;
        loadPage(currentPageRef.current + 1);
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadPage]);

  // ── Stats computed from the loaded orderList ──────────────────────────
  // Note: because the list may be paginated, counts reflect loaded orders.
  // The server returns totalCount for an accurate total if needed.
  const stats = {
    total:      orderList?.length || 0,
    pending:    orderList?.filter((o) => o.orderStatus === "pending").length    || 0,
    inProgress: orderList?.filter((o) => ["confirmed", "processing", "shipped"].includes(o.orderStatus)).length || 0,
    delivered:  orderList?.filter((o) => o.orderStatus === "delivered").length || 0,
  };

  function formatDate(d) {
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  const handleView = (id) => navigate(`/vendor/orders/${id}`);

  // Orders come pre-filtered from the server
  const displayOrders = orderList || [];

  return (
    <Fragment>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm">Manage and track your customer orders</p>
      </div>

      {/* ── Tab switcher ────────────────────────────────────────────────── */}
      <div className="flex gap-0 border-b mb-6">
        {[
          { id: "orders",  label: "Orders" },
          { id: "returns", label: "Returns & Refunds", icon: <RotateCcw className="h-3.5 w-3.5" /> },
        ].map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
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

      {activeTab === "returns" && <VendorReturnRequestsTab />}

      {activeTab === "orders" && (
        <>
          {/* ── Stats ─────────────────────────────────────────────────── */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-6">
            <StatCard
              label="Total Orders"
              value={stats.total}
              icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              label="Pending"
              value={stats.pending}
              icon={<Clock className="h-4 w-4 text-yellow-600" />}
            />
            <StatCard
              label="In Progress"
              value={stats.inProgress}
              icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
            />
            <StatCard
              label="Delivered"
              value={stats.delivered}
              icon={<CheckCircle className="h-4 w-4 text-green-600" />}
            />
          </div>

          {/* ── Filters ───────────────────────────────────────────────── */}
          <div className="flex gap-2 items-center mb-6 flex-wrap">
            <div className="relative flex-1 min-w-0" style={{ minWidth: "160px" }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID or customer…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px] shrink-0">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              MOBILE — order cards  (below md)
          ═══════════════════════════════════════════════════════════ */}
          <div className="md:hidden space-y-3">
            {isListLoading ? (
              <>
                <OrderCardSkeleton />
                <OrderCardSkeleton />
                <OrderCardSkeleton />
              </>
            ) : displayOrders.length > 0 ? (
              displayOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  formatDate={formatDate}
                  onView={handleView}
                />
              ))
            ) : (
              <div className="flex flex-col items-center gap-2 py-16 border rounded-xl text-muted-foreground">
                <ShoppingBag className="h-12 w-12 opacity-30" />
                <p className="text-sm">
                  {searchTerm ? "No orders match your search" : "No orders found"}
                </p>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════
              TABLET — simplified table  (md → xl)
          ═══════════════════════════════════════════════════════════ */}
          <div className="hidden md:block xl:hidden border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Action</TableHead>
                  <TableHead className="w-[60px]">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isListLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading orders…
                    </TableCell>
                  </TableRow>
                ) : displayOrders.length > 0 ? (
                  displayOrders.map((order) => (
                    <TableRow key={order._id} className="hover:bg-muted/40">
                      <TableCell>
                        <p className="font-mono text-sm font-semibold">
                          {order.vendorOrderId || `ORD-${order._id?.slice(-8).toUpperCase()}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(order.orderDate)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm line-clamp-1">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.addressInfo?.city || "—"}</p>
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        ETB {currencyFormatter(order.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.orderStatus} />
                      </TableCell>
                      <TableCell>
                        {["delivered", "cancelled"].includes(order.orderStatus) ? (
                          <NextActionHint status={order.orderStatus} paymentStatus={order.paymentStatus} />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleView(order._id)}
                            className="text-left hover:opacity-70 transition-opacity"
                          >
                            <NextActionHint status={order.orderStatus} paymentStatus={order.paymentStatus} />
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(order._id)}
                          title="View order"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ShoppingBag className="h-12 w-12 opacity-30" />
                        <p>{searchTerm ? "No orders match your search" : "No orders found"}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              DESKTOP — full table  (xl+)
          ═══════════════════════════════════════════════════════════ */}
          <div className="hidden xl:block border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Action</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[80px]">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isListLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading orders…
                    </TableCell>
                  </TableRow>
                ) : displayOrders.length > 0 ? (
                  displayOrders.map((order) => (
                    <TableRow key={order._id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-sm">
                        {order.vendorOrderId || `ORD-${order._id?.slice(-8).toUpperCase()}`}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.addressInfo?.city || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{order.cartItems?.length || 0} item(s)</TableCell>
                      <TableCell className="font-medium">ETB {currencyFormatter(order.totalAmount)}</TableCell>
                      <TableCell><StatusBadge status={order.orderStatus} /></TableCell>
                      <TableCell>
                        {["delivered", "cancelled"].includes(order.orderStatus) ? (
                          <NextActionHint status={order.orderStatus} paymentStatus={order.paymentStatus} />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleView(order._id)}
                            className="text-left hover:opacity-70 transition-opacity"
                          >
                            <NextActionHint status={order.orderStatus} paymentStatus={order.paymentStatus} />
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(order.orderDate)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(order._id)}
                          title="View order"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ShoppingBag className="h-12 w-12 opacity-30" />
                        <p>{searchTerm ? "No orders match your search" : "No orders found"}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Infinite scroll sentinel + loading indicator ─────────── */}
          <div className="flex flex-col items-center gap-2 py-4">
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading more orders…
              </div>
            )}
            {/* Invisible sentinel — watched by IntersectionObserver */}
            <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
          </div>
        </>
      )}
    </Fragment>
  );
}

export default VendorOrders;
