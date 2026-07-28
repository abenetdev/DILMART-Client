import { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye,
  Search,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
} from "lucide-react";
import { getAllOrdersForVendor } from "@/store/vendor/order-slice";
import { currencyFormatter } from "@/utils";

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:    { className: "bg-yellow-100 text-yellow-800",  label: "Pending"    },
  confirmed:  { className: "bg-blue-100 text-blue-800",     label: "Confirmed"  },
  processing: { className: "bg-indigo-100 text-indigo-800", label: "Processing" },
  shipped:    { className: "bg-purple-100 text-purple-800", label: "Shipped"    },
  delivered:  { className: "bg-green-100 text-green-800",   label: "Delivered"  },
  cancelled:  { className: "bg-red-100 text-red-800",       label: "Cancelled"  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

// ── Next action hint shown in table ───────────────────────────────────────
function NextActionHint({ status, paymentStatus }) {
  if (paymentStatus !== "paid") return <span className="text-xs text-muted-foreground">Awaiting payment</span>;
  const map = {
    pending:    <span className="text-xs font-medium text-yellow-700">→ Accept Order</span>,
    confirmed:  <span className="text-xs font-medium text-blue-700">→ Start Processing</span>,
    processing: <span className="text-xs font-medium text-indigo-700">→ Mark as Shipped</span>,
    shipped:    <span className="text-xs text-purple-700">Waiting for customer</span>,
    delivered:  <span className="text-xs text-green-700">Complete</span>,
    cancelled:  <span className="text-xs text-muted-foreground">Cancelled</span>,
  };
  return map[status] || null;
}

// ── Page component ─────────────────────────────────────────────────────────

function VendorOrders() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm,   setSearchTerm]   = useState("");

  const { orderList, isListLoading } = useSelector((s) => s.vendorOrder);
  const { isAuthenticated, user }    = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      dispatch(getAllOrdersForVendor({ status: filterStatus }));
    }
  }, [dispatch, filterStatus, isAuthenticated, user?.id]);

  // Stats
  const stats = {
    total:      orderList?.length || 0,
    pending:    orderList?.filter((o) => o.orderStatus === "pending").length    || 0,
    inProgress: orderList?.filter((o) => ["confirmed", "processing", "shipped"].includes(o.orderStatus)).length || 0,
    delivered:  orderList?.filter((o) => o.orderStatus === "delivered").length || 0,
  };

  const filtered = orderList?.filter((order) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      order._id?.toLowerCase().includes(q) ||
      order.customerName?.toLowerCase().includes(q) ||
      order.addressInfo?.city?.toLowerCase().includes(q)
    );
  });

  function formatDate(d) {
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <Fragment>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage and track your customer orders</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard label="Total Orders"  value={stats.total}      icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />} />
        <StatCard label="Pending"       value={stats.pending}    icon={<Clock className="h-4 w-4 text-yellow-600" />} />
        <StatCard label="In Progress"   value={stats.inProgress} icon={<TrendingUp className="h-4 w-4 text-blue-600" />} />
        <StatCard label="Delivered"     value={stats.delivered}  icon={<CheckCircle className="h-4 w-4 text-green-600" />} />
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
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

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
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
            ) : filtered?.length > 0 ? (
              filtered.map((order) => (
                <TableRow key={order._id} className="hover:bg-muted/40">
                  <TableCell className="font-mono text-sm">
                    ORD-{order._id?.slice(-8).toUpperCase()}
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
                    <NextActionHint status={order.orderStatus} paymentStatus={order.paymentStatus} />
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(order.orderDate)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/vendor/orders/${order._id}`)}
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
    </Fragment>
  );
}

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

export default VendorOrders;
