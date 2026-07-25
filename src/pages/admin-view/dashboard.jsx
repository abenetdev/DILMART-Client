import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAdminDashboardData } from "@/store/admin/dashboard-slice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  TrendingUp, ShoppingBag, Users, Store, Package, Wallet,
  AlertTriangle, RefreshCw, Bell, BarChart3, ArrowUpRight,
  Clock, CheckCircle2, XCircle, Truck, ClipboardList,
  ChevronRight, Activity,
} from "lucide-react";

// ── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n) =>
  `ETB ${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtCompact = (n) => {
  if (n >= 1_000_000) return `ETB ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `ETB ${(n / 1_000).toFixed(1)}K`;
  return `ETB ${(n || 0).toFixed(2)}`;
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  pending:    { bg: "bg-yellow-100 text-yellow-800",  dot: "bg-yellow-500"  },
  confirmed:  { bg: "bg-blue-100 text-blue-800",      dot: "bg-blue-500"    },
  processing: { bg: "bg-indigo-100 text-indigo-800",  dot: "bg-indigo-500"  },
  shipped:    { bg: "bg-purple-100 text-purple-800",  dot: "bg-purple-500"  },
  delivered:  { bg: "bg-green-100 text-green-800",    dot: "bg-green-500"   },
  cancelled:  { bg: "bg-red-100 text-red-800",        dot: "bg-red-500"     },
  paid:       { bg: "bg-emerald-100 text-emerald-800",dot: "bg-emerald-500" },
  failed:     { bg: "bg-red-100 text-red-800",        dot: "bg-red-500"     },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: "bg-gray-100 text-gray-700", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color = "blue", accent, onClick }) {
  const colorMap = {
    blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   border: "border-blue-100"   },
    green:  { bg: "bg-green-50",  icon: "text-green-600",  border: "border-green-100"  },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-100" },
    orange: { bg: "bg-orange-50", icon: "text-orange-600", border: "border-orange-100" },
    rose:   { bg: "bg-rose-50",   icon: "text-rose-600",   border: "border-rose-100"   },
    teal:   { bg: "bg-teal-50",   icon: "text-teal-600",   border: "border-teal-100"   },
    indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", border: "border-indigo-100" },
    slate:  { bg: "bg-slate-50",  icon: "text-slate-600",  border: "border-slate-100"  },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border ${c.border} p-5 flex items-start justify-between gap-3 shadow-sm hover:shadow-md transition-all duration-200 ${onClick ? "cursor-pointer hover:-translate-y-0.5" : ""}`}
    >
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight truncate">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        {accent && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 mt-1">
            <ArrowUpRight className="h-3 w-3" />{accent}
          </span>
        )}
      </div>
      <div className={`p-2.5 rounded-xl ${c.bg} shrink-0`}>
        <Icon className={`h-5 w-5 ${c.icon}`} />
      </div>
    </div>
  );
}

// ── Sales period card ─────────────────────────────────────────────────────────

function SalesCard({ label, value, icon: Icon, iconColor }) {
  return (
    <div className="bg-white rounded-2xl border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data, isLoading, error } = useSelector((s) => s.adminDashboard);

  useEffect(() => { dispatch(getAdminDashboardData()); }, [dispatch]);

  const refresh = () => dispatch(getAdminDashboardData());

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button onClick={refresh} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const {
    overview = {},
    salesPerformance = {},
    orderStatusSummary = {},
    topVendors = [],
    recentOrders = [],
    notifications = [],
  } = data || {};

  // Order status display config
  const statusConfig = [
    { key: "pending",    label: "Pending",    icon: Clock,         color: "text-yellow-600", bg: "bg-yellow-50" },
    { key: "confirmed",  label: "Confirmed",  icon: CheckCircle2,  color: "text-blue-600",   bg: "bg-blue-50"   },
    { key: "processing", label: "Processing", icon: Activity,      color: "text-indigo-600", bg: "bg-indigo-50" },
    { key: "shipped",    label: "Shipped",    icon: Truck,         color: "text-purple-600", bg: "bg-purple-50" },
    { key: "delivered",  label: "Delivered",  icon: CheckCircle2,  color: "text-green-600",  bg: "bg-green-50"  },
    { key: "cancelled",  label: "Cancelled",  icon: XCircle,       color: "text-red-600",    bg: "bg-red-50"    },
  ];

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" :
    now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{greeting} 👋</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatDate(now)} · Marketplace overview
          </p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm" className="gap-2 shrink-0">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* ── Notifications ── */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
                n.level === "warning"
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              <Bell className="h-4 w-4 shrink-0" />
              <span className="flex-1">{n.message}</span>
              {n.level === "warning" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-amber-700 hover:bg-amber-100 text-xs"
                  onClick={() => navigate("/admin/withdrawals")}
                >
                  Review <ChevronRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Overview stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={fmtCompact(overview.totalRevenue)}
          sub={fmt(overview.totalRevenue)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Total Orders"
          value={(overview.totalOrders ?? 0).toLocaleString()}
          sub={`${overview.paidOrders ?? 0} paid`}
          icon={ShoppingBag}
          color="blue"
          onClick={() => navigate("/admin/orders")}
        />
        <StatCard
          label="Vendors"
          value={overview.totalVendors ?? 0}
          sub={`${overview.activeStores ?? 0} active stores`}
          icon={Store}
          color="purple"
          onClick={() => navigate("/admin/vendors")}
        />
        <StatCard
          label="Customers"
          value={(overview.totalCustomers ?? 0).toLocaleString()}
          icon={Users}
          color="teal"
        />
        <StatCard
          label="Products"
          value={(overview.totalProducts ?? 0).toLocaleString()}
          icon={Package}
          color="indigo"
        />
        <StatCard
          label="Active Stores"
          value={overview.activeStores ?? 0}
          icon={Store}
          color="orange"
        />
        <StatCard
          label="Platform Commission"
          value={fmtCompact(overview.platformCommission)}
          sub={fmt(overview.platformCommission)}
          icon={Wallet}
          color="rose"
        />
        <StatCard
          label="Pending Withdrawals"
          value={overview.pendingWithdrawals ?? 0}
          icon={ClipboardList}
          color={overview.pendingWithdrawals > 0 ? "orange" : "slate"}
          onClick={() => navigate("/admin/withdrawals")}
        />
      </div>

      {/* ── Sales performance ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Sales Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SalesCard label="Today"      value={fmt(salesPerformance.today)}     icon={Activity}   iconColor="text-blue-500" />
          <SalesCard label="This Week"  value={fmt(salesPerformance.thisWeek)}  icon={BarChart3}  iconColor="text-purple-500" />
          <SalesCard label="This Month" value={fmt(salesPerformance.thisMonth)} icon={TrendingUp} iconColor="text-green-500" />
        </div>
      </div>

      {/* ── Order status breakdown ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Order Status Breakdown
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {statusConfig.map(({ key, label, icon: Icon, color, bg }) => (
            <div
              key={key}
              className="bg-white rounded-2xl border p-4 text-center shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate("/admin/orders")}
            >
              <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{orderStatusSummary[key] ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tables row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Recent orders — wider */}
        <div className="lg:col-span-3 bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs text-primary"
              onClick={() => navigate("/admin/orders")}
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-xs">Order</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <TableRow key={order._id} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{order.orderId}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium leading-tight">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.vendorName}</p>
                      </TableCell>
                      <TableCell className="text-sm font-semibold">{fmt(order.totalAmount)}</TableCell>
                      <TableCell><StatusBadge status={order.orderStatus} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(order.orderDate)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                      No orders yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Top vendors — narrower */}
        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Top Vendors</h2>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs text-primary"
              onClick={() => navigate("/admin/vendors")}
            >
              All <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          {topVendors.length > 0 ? (
            <div className="divide-y">
              {topVendors.map((vendor, i) => (
                <div key={vendor.vendorId} className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/20 transition-colors">
                  {/* Rank badge */}
                  <span className={`h-7 w-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                    i === 0 ? "bg-yellow-100 text-yellow-700" :
                    i === 1 ? "bg-slate-100 text-slate-600" :
                    i === 2 ? "bg-orange-100 text-orange-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {i + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{vendor.storeName}</p>
                    <p className="text-xs text-muted-foreground">{vendor.orderCount} order{vendor.orderCount !== 1 ? "s" : ""}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">{fmtCompact(vendor.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm gap-2">
              <Store className="h-8 w-8 text-muted-foreground/40" />
              No vendor sales yet
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
