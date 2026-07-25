import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getDashboardData } from "@/store/vendor/dashboard-slice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Wallet,
  Clock,
  Users,
  AlertTriangle,
  Bell,
  Zap,
  Store,
  Eye,
  ArrowRight,
  Plus,
  Settings,
  CheckCircle,
  Activity,
  BarChart3,
  RefreshCw,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt  = (n) => `ETB ${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtN = (n) => (n || 0).toLocaleString();

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const formatTime = (d) => {
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const today = new Date().toLocaleDateString("en-US", {
  weekday: "long", month: "long", day: "numeric", year: "numeric",
});

// ── Status Badge ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    pending:    "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    shipped:    "bg-purple-100 text-purple-800",
    delivered:  "bg-green-100 text-green-800",
    cancelled:  "bg-red-100 text-red-800",
  };
  return (
    <Badge className={map[status] || "bg-gray-100 text-gray-800"}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </Badge>
  );
};

// ── Skeleton loader ────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function VendorDashboard() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { user }   = useSelector((s) => s.auth);
  const { data, isLoading, error } = useSelector((s) => s.vendorDashboard);

  const vendorId = user?._id || user?.id;

  useEffect(() => {
    dispatch(getDashboardData(vendorId));
  }, [dispatch, vendorId]);

  const refresh = () => dispatch(getDashboardData(vendorId));

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={refresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  // ── Destructure API data ───────────────────────────────────────────────
  const {
    storeName         = "My Store",
    storeStatus       = "active",
    overview          = {},
    salesPerformance  = {},
    recentOrders      = [],
    topProducts       = [],
    lowStockProducts  = [],
    orderStatusSummary = {},
    walletSummary     = {},
    storePerformance  = {},
    recentActivities  = [],
    notifications     = [],
  } = data || {};

  // ── Activity icon map ──────────────────────────────────────────────────
  const activityIcon = {
    order:   <ShoppingBag className="h-4 w-4 text-blue-500" />,
    product: <Package className="h-4 w-4 text-green-500" />,
    store:   <Store className="h-4 w-4 text-purple-500" />,
    wallet:  <Wallet className="h-4 w-4 text-orange-500" />,
  };

  const notifIcon = {
    order:   <ShoppingBag className="h-4 w-4 text-blue-500" />,
    stock:   <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    store:   <Store className="h-4 w-4 text-purple-500" />,
    wallet:  <Wallet className="h-4 w-4 text-green-500" />,
  };

  // ── Overview card config ───────────────────────────────────────────────
  const overviewCards = [
    {
      label: "Total Revenue",
      value: fmt(overview.totalRevenue),
      icon:  TrendingUp,
      color: "text-green-600",
      bg:    "bg-green-50",
    },
    {
      label: "Total Orders",
      value: `${fmtN(overview.totalOrders)} Orders`,
      icon:  ShoppingBag,
      color: "text-blue-600",
      bg:    "bg-blue-50",
    },
    {
      label: "Products",
      value: `${fmtN(overview.activeProducts)} Products`,
      icon:  Package,
      color: "text-purple-600",
      bg:    "bg-purple-50",
    },
    {
      label: "Available Balance",
      value: fmt(overview.availableBalance),
      icon:  Wallet,
      color: "text-orange-600",
      bg:    "bg-orange-50",
    },
    {
      label: "Pending Orders",
      value: `${fmtN(overview.pendingOrders)} Orders`,
      icon:  Clock,
      color: "text-yellow-600",
      bg:    "bg-yellow-50",
    },
    {
      label: "Customers",
      value: `${fmtN(overview.uniqueCustomers)} Customers`,
      icon:  Users,
      color: "text-pink-600",
      bg:    "bg-pink-50",
    },
  ];

  // ── Order status bar ───────────────────────────────────────────────────
  const orderStatusCards = [
    { label: "Pending",    count: orderStatusSummary.pending,    color: "border-l-yellow-500" },
    { label: "Processing", count: orderStatusSummary.processing, color: "border-l-blue-500"   },
    { label: "Shipped",    count: orderStatusSummary.shipped,    color: "border-l-purple-500" },
    { label: "Delivered",  count: orderStatusSummary.delivered,  color: "border-l-green-500"  },
    { label: "Cancelled",  count: orderStatusSummary.cancelled,  color: "border-l-red-500"    },
  ];

  // ── Quick actions ──────────────────────────────────────────────────────
  const quickActions = [
    { label: "Add Product",          icon: Plus,     path: "/vendor/products",       variant: "default"   },
    { label: "Manage Products",      icon: Package,  path: "/vendor/products",       variant: "outline"   },
    { label: "Manage Orders",        icon: ShoppingBag, path: "/vendor/orders",      variant: "outline"   },
    { label: "Store Settings",       icon: Settings, path: "/vendor/store-settings", variant: "outline"   },
    { label: "View Wallet",          icon: Wallet,   path: "/vendor/wallet",         variant: "outline"   },
    { label: "View Store",           icon: Eye,      path: `/store/${data?.slug || ""}`, variant: "outline" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-slate-400 text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold mt-0.5">{user?.userName || "Vendor"}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-slate-300 text-sm">{storeName}</span>
              <Badge
                className={
                  storeStatus === "active"
                    ? "bg-green-500 text-white border-0"
                    : "bg-yellow-500 text-white border-0"
                }
              >
                {storeStatus === "active" ? "● Active" : "● Temporarily Closed"}
              </Badge>
            </div>
            <p className="text-slate-400 text-xs mt-2">{today}</p>
          </div>
          <Button
            onClick={refresh}
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white hover:bg-slate-700 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── NOTIFICATIONS ───────────────────────────────────────────────── */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
                n.level === "warning"
                  ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              {notifIcon[n.type] || <Bell className="h-4 w-4" />}
              <span>{n.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── OVERVIEW CARDS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {overviewCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-lg font-bold mt-0.5 ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── SALES PERFORMANCE ───────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-primary" />
            Sales Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Today",      value: salesPerformance.today,    color: "from-blue-500 to-blue-600"   },
              { label: "This Week",  value: salesPerformance.thisWeek,  color: "from-purple-500 to-purple-600" },
              { label: "This Month", value: salesPerformance.thisMonth, color: "from-green-500 to-green-600"  },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className={`bg-gradient-to-r ${color} rounded-xl p-4 text-white`}
              >
                <p className="text-white/70 text-sm">{label}</p>
                <p className="text-2xl font-bold mt-1">{fmt(value)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── ROW: Recent Orders + Order Status ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Recent Orders
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/vendor/orders")}
              className="gap-1 text-xs"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Order ID</TableHead>
                    <TableHead className="text-xs">Customer</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow
                      key={order._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/vendor/orders/${order._id}`)}
                    >
                      <TableCell className="font-mono text-xs font-medium">
                        #{order.orderId}
                      </TableCell>
                      <TableCell className="text-sm">{order.customerName}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {fmt(order.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.orderStatus} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(order.orderDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center py-10 gap-2">
                <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No orders yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orderStatusCards.map(({ label, count, color }) => (
              <div
                key={label}
                className={`flex items-center justify-between p-3 rounded-lg border-l-4 bg-muted/30 ${color}`}
              >
                <span className="text-sm font-medium">{label}</span>
                <span className="text-lg font-bold">{fmtN(count)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── ROW: Top Products + Low Stock ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Selling Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Selling Products
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/vendor/products")}
              className="gap-1 text-xs"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProducts.length > 0 ? (
              topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4 font-bold">
                    {i + 1}
                  </span>
                  <div className="h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
                    {p.image ? (
                      <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-5 w-5 m-auto mt-2.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Sold: {fmtN(p.unitsSold)} units
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-green-600">{fmt(p.revenue)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-8 gap-2">
                <TrendingUp className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No sales data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Low Stock Alerts
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/vendor/products")}
              className="gap-1 text-xs"
            >
              Restock <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center justify-between p-2 rounded-lg border border-orange-100 bg-orange-50"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded overflow-hidden bg-muted flex-shrink-0">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-4 w-4 m-auto mt-2 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{p.name}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`flex-shrink-0 ${
                      p.stock === 0
                        ? "border-red-500 text-red-600 bg-red-50"
                        : "border-orange-500 text-orange-600 bg-orange-50"
                    }`}
                  >
                    {p.stock === 0 ? "Out of stock" : `${p.stock} Remaining`}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-8 gap-2">
                <CheckCircle className="h-10 w-10 text-green-500" />
                <p className="text-sm text-muted-foreground">All products well stocked</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── ROW: Wallet Summary + Store Performance ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Wallet Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Wallet Summary
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/vendor/wallet")}
              className="gap-1 text-xs"
            >
              Open Wallet <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Total Revenue",     value: walletSummary.totalRevenue,     color: "text-foreground"  },
              { label: "Available Balance", value: walletSummary.availableBalance, color: "text-green-600"   },
              { label: "Pending Balance",   value: walletSummary.pendingBalance,   color: "text-orange-600"  },
              { label: "Withdrawn Amount",  value: walletSummary.withdrawnAmount,  color: "text-muted-foreground" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className={`text-sm font-bold ${color}`}>{fmt(value)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Store Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Store Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Store Views",    value: fmtN(storePerformance.storeViews),   icon: Eye,      color: "bg-blue-50 text-blue-600"   },
              { label: "Product Views",  value: fmtN(storePerformance.productViews), icon: Package,  color: "bg-purple-50 text-purple-600" },
              { label: "Conversion Rate", value: `${storePerformance.conversionRate}%`, icon: TrendingUp, color: "bg-green-50 text-green-600" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
                <span className="font-bold text-sm">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── ROW: Activities + Quick Actions ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="relative pl-4">
                {/* vertical line */}
                <div className="absolute left-0 top-2 bottom-2 w-px bg-border" />
                <div className="space-y-4">
                  {recentActivities.map((a, i) => (
                    <div key={`${a.id}-${i}`} className="relative flex items-start gap-3">
                      {/* dot */}
                      <div className="absolute -left-[18px] mt-0.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                      <div className="flex items-center gap-2 pt-0.5">
                        {activityIcon[a.type] || <Activity className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{a.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatTime(a.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 gap-2">
                <Activity className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No recent activities</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map(({ label, icon: Icon, path, variant }) => (
              <Button
                key={label}
                variant={variant}
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => navigate(path)}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
