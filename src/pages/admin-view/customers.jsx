import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Search, MoreVertical, Eye, UserX, UserCheck, KeyRound,
  LogOut, Trash2, AlertTriangle, Loader2, ShoppingBag, MapPin,
  Star, Heart, Clock, Mail, CheckCircle2, XCircle, Package,
  TrendingUp, RefreshCw, ChevronLeft, ChevronRight as ChevronRightIcon,
} from "lucide-react";
import {
  fetchAllCustomers, fetchCustomerById, suspendCustomer, activateCustomer,
  resetCustomerPassword, forceLogoutCustomer, deleteCustomer,
  deleteCustomerReview, clearCustomerDetails,
} from "@/store/admin/customers-slice";

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => `ETB ${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
const fmtDateTime = (d) => d ? new Date(d).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

// ── Status badges ──────────────────────────────────────────────────────────
function AccountBadge({ status }) {
  if (status === "deactivated") return <Badge className="bg-orange-100 text-orange-800 border-0">Suspended</Badge>;
  if (status === "deleted")     return <Badge className="bg-red-100 text-red-800 border-0">Deleted</Badge>;
  return <Badge className="bg-green-100 text-green-800 border-0">Active</Badge>;
}

function VerifiedBadge({ verified }) {
  return verified
    ? <Badge className="bg-blue-100 text-blue-800 border-0 gap-1"><CheckCircle2 className="h-3 w-3" />Verified</Badge>
    : <Badge className="bg-gray-100 text-gray-600 border-0 gap-1"><XCircle className="h-3 w-3" />Unverified</Badge>;
}

function OrderStatusBadge({ status }) {
  const map = {
    pending:    "bg-yellow-100 text-yellow-800",
    confirmed:  "bg-blue-100 text-blue-800",
    processing: "bg-indigo-100 text-indigo-800",
    shipped:    "bg-purple-100 text-purple-800",
    delivered:  "bg-green-100 text-green-800",
    cancelled:  "bg-red-100 text-red-800",
  };
  return <Badge className={`${map[status] || "bg-gray-100 text-gray-700"} border-0 capitalize`}>{status}</Badge>;
}

function PaymentBadge({ status }) {
  const map = { paid: "bg-green-100 text-green-800", pending: "bg-yellow-100 text-yellow-800", failed: "bg-red-100 text-red-800", refunded: "bg-purple-100 text-purple-800" };
  return <Badge className={`${map[status] || "bg-gray-100 text-gray-700"} border-0 capitalize`}>{status}</Badge>;
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color = "blue", sub }) {
  const colors = {
    blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   border: "border-blue-100"   },
    green:  { bg: "bg-green-50",  icon: "text-green-600",  border: "border-green-100"  },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-100" },
    orange: { bg: "bg-orange-50", icon: "text-orange-600", border: "border-orange-100" },
    teal:   { bg: "bg-teal-50",   icon: "text-teal-600",   border: "border-teal-100"   },
    rose:   { bg: "bg-rose-50",   icon: "text-rose-600",   border: "border-rose-100"   },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className={`bg-white rounded-2xl border ${c.border} p-5 flex items-start justify-between gap-3 shadow-sm`}>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? "—"}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
      <div className={`p-2.5 rounded-xl ${c.bg} shrink-0`}>
        <Icon className={`h-5 w-5 ${c.icon}`} />
      </div>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────
function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <p className="text-xs text-muted-foreground">
        Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8"
          disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs px-2">{pagination.page} / {pagination.pages}</span>
        <Button variant="outline" size="icon" className="h-8 w-8"
          disabled={pagination.page >= pagination.pages} onClick={() => onPageChange(pagination.page + 1)}>
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Customer Details Dialog ────────────────────────────────────────────────
function CustomerDetailsDialog({ open, onClose, customerId, onAction }) {
  const dispatch = useDispatch();
  const { customerDetails, isDetailLoading } = useSelector((s) => s.adminCustomers);

  useEffect(() => {
    if (open && customerId) dispatch(fetchCustomerById(customerId));
    if (!open) dispatch(clearCustomerDetails());
  }, [open, customerId, dispatch]);

  const d = customerDetails;

  const timelineIcon = (type) => {
    if (type === "order")  return <ShoppingBag className="h-4 w-4 text-blue-500" />;
    if (type === "verify") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (type === "review") return <Star className="h-4 w-4 text-yellow-500" />;
    return <Users className="h-4 w-4 text-gray-400" />;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Profile</DialogTitle>
        </DialogHeader>

        {isDetailLoading || !d ? (
          <div className="space-y-3 py-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
          </div>
        ) : (
          <Tabs defaultValue="overview" className="mt-2">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="orders">Orders ({d.orders?.length || 0})</TabsTrigger>
              <TabsTrigger value="addresses">Addresses ({d.addresses?.length || 0})</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({d.reviews?.length || 0})</TabsTrigger>
              <TabsTrigger value="wishlist">Wishlist ({d.wishlist?.length || 0})</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            {/* ── Overview ── */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl border bg-gray-50">
                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-bold text-blue-600">
                    {d.profile.userName?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg truncate">{d.profile.userName}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3.5 w-3.5" />{d.profile.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Joined {fmtDate(d.profile.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <AccountBadge status={d.profile.accountStatus} />
                  <VerifiedBadge verified={d.profile.isEmailVerified} />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Total Orders",  value: d.stats.totalOrders,              color: "blue"   },
                  { label: "Total Spent",   value: fmt(d.stats.totalSpent),          color: "green"  },
                  { label: "Avg Order",     value: fmt(d.stats.avgOrder),            color: "purple" },
                  { label: "Cancelled",     value: d.stats.cancelled,                color: "orange" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl border p-3 text-center">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-bold mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" className="gap-1.5"
                  onClick={() => onAction("suspend", d.profile)}>
                  <UserX className="h-3.5 w-3.5" />
                  {d.profile.accountStatus === "deactivated" ? "Reactivate" : "Suspend"}
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5"
                  onClick={() => onAction("reset", d.profile)}>
                  <KeyRound className="h-3.5 w-3.5" />Reset Password
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5"
                  onClick={() => onAction("logout", d.profile)}>
                  <LogOut className="h-3.5 w-3.5" />Force Logout
                </Button>
                <Button size="sm" variant="destructive" className="gap-1.5"
                  onClick={() => onAction("delete", d.profile)}>
                  <Trash2 className="h-3.5 w-3.5" />Delete
                </Button>
              </div>
            </TabsContent>

            {/* ── Orders ── */}
            <TabsContent value="orders" className="mt-4">
              {d.orders?.length > 0 ? (
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.orders.map((o) => (
                        <TableRow key={o._id}>
                          <TableCell className="font-mono text-xs">#{o.orderId}</TableCell>
                          <TableCell className="text-sm">{fmtDate(o.orderDate)}</TableCell>
                          <TableCell className="text-sm">{o.itemCount}</TableCell>
                          <TableCell className="font-semibold text-sm">{fmt(o.totalAmount)}</TableCell>
                          <TableCell><PaymentBadge status={o.paymentStatus} /></TableCell>
                          <TableCell><OrderStatusBadge status={o.orderStatus} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
                  <ShoppingBag className="h-10 w-10 opacity-30" />
                  <p className="text-sm">No orders yet</p>
                </div>
              )}
            </TabsContent>

            {/* ── Addresses ── */}
            <TabsContent value="addresses" className="mt-4 space-y-3">
              {d.addresses?.length > 0 ? d.addresses.map((a) => (
                <div key={a._id} className="rounded-xl border p-4 flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">{a.address}</p>
                    <p className="text-muted-foreground">{[a.city, a.pincode].filter(Boolean).join(", ")}</p>
                    {a.phone && <p className="text-muted-foreground">{a.phone}</p>}
                    {a.notes && <p className="text-muted-foreground italic text-xs mt-1">{a.notes}</p>}
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
                  <MapPin className="h-10 w-10 opacity-30" />
                  <p className="text-sm">No saved addresses</p>
                </div>
              )}
            </TabsContent>

            {/* ── Reviews ── */}
            <TabsContent value="reviews" className="mt-4 space-y-3">
              {d.reviews?.length > 0 ? d.reviews.map((r) => (
                <div key={r._id} className="rounded-xl border p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {r.productImage && (
                        <img src={r.productImage} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      )}
                      <p className="text-sm font-medium truncate max-w-[200px]">{r.productName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`h-3.5 w-3.5 ${s <= r.reviewValue ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                        ))}
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 text-red-500 hover:text-red-600 hover:bg-red-50 gap-1"
                        onClick={() => onAction("deleteReview", { customerId: d.profile._id, reviewId: r._id })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.reviewMessage || "No comment"}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(r.createdAt)}</p>
                </div>
              )) : (
                <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
                  <Star className="h-10 w-10 opacity-30" />
                  <p className="text-sm">No reviews yet</p>
                </div>
              )}
            </TabsContent>

            {/* ── Wishlist ── */}
            <TabsContent value="wishlist" className="mt-4">
              {d.wishlist?.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {d.wishlist.map((item) => (
                    <div key={item._id} className="rounded-xl border p-3 flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                        {item.image
                          ? <img src={item.image} alt="" className="h-full w-full object-cover" />
                          : <Package className="h-5 w-5 m-auto text-muted-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.name || "Product"}</p>
                        <p className="text-xs text-muted-foreground">{fmt(item.price)}</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(item.addedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
                  <Heart className="h-10 w-10 opacity-30" />
                  <p className="text-sm">Empty wishlist</p>
                </div>
              )}
            </TabsContent>

            {/* ── Timeline ── */}
            <TabsContent value="timeline" className="mt-4">
              {d.timeline?.length > 0 ? (
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-100" />
                  {d.timeline.map((item, i) => (
                    <div key={i} className="relative flex items-start gap-3">
                      <div className="absolute -left-4 h-8 w-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                        {timelineIcon(item.type)}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.event}</p>
                        {item.meta && <p className="text-xs text-muted-foreground">{item.meta}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">{fmtDateTime(item.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
                  <Clock className="h-10 w-10 opacity-30" />
                  <p className="text-sm">No activity yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Confirmation Dialog ────────────────────────────────────────────────────
function ConfirmDialog({ open, onClose, title, description, confirmLabel, confirmVariant = "destructive", onConfirm, isLoading }) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />{title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant={confirmVariant} className="flex-1 gap-2" disabled={isLoading} onClick={onConfirm}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Reset Password Dialog ──────────────────────────────────────────────────
function ResetPasswordDialog({ open, onClose, customer, onConfirm, isLoading }) {
  const [pwd, setPwd] = useState("");
  useEffect(() => { if (!open) setPwd(""); }, [open]);
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />Reset Password
          </DialogTitle>
          <DialogDescription>
            Set a new password for <strong>{customer?.userName}</strong>. They will be required to change it on next login.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>New Password</Label>
            <Input type="text" className="mt-1" placeholder="At least 6 characters"
              value={pwd} onChange={(e) => setPwd(e.target.value)} />
            {pwd && pwd.length < 6 && <p className="text-xs text-red-500 mt-1">Minimum 6 characters</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 gap-2" disabled={isLoading || !pwd || pwd.length < 6}
            onClick={() => onConfirm(pwd)}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Reset Password
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AdminCustomers() {
  const dispatch  = useDispatch();
  const { toast } = useToast();
  const { customerList, isListLoading, isSubmitting, pagination, stats } =
    useSelector((s) => s.adminCustomers);

  // Filter state
  const [search,    setSearch]    = useState("");
  const [status,    setStatus]    = useState("all");
  const [verified,  setVerified]  = useState("all");
  const [activity,  setActivity]  = useState("all");
  const [sort,      setSort]      = useState("newest");
  const [page,      setPage]      = useState(1);

  // Dialog state
  const [detailsId,    setDetailsId]    = useState(null);
  const [confirmDlg,   setConfirmDlg]   = useState(null); // { type, customer }
  const [resetTarget,  setResetTarget]  = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const load = useCallback(() => {
    dispatch(fetchAllCustomers({ search, status, verified, activity, sort, page, limit: 20 }));
  }, [dispatch, search, status, verified, activity, sort, page]);

  useEffect(() => { load(); }, [load]);

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line

  // ── Action handler (from both table dropdown and details dialog) ──────────
  const handleAction = (type, customer) => {
    if (type === "view")    { setDetailsId(customer._id); return; }
    if (type === "reset")   { setResetTarget(customer); return; }
    if (type === "deleteReview") { setConfirmDlg({ type: "deleteReview", ...customer }); return; }
    setConfirmDlg({ type, customer });
  };

  const executeAction = (overridePwd) => {
    const { type, customer, customerId, reviewId } = confirmDlg || {};

    const done = (msg) => {
      toast({ title: msg });
      setConfirmDlg(null);
      setDetailsId(null);
      load();
    };
    const fail = (err) => toast({ title: err?.message || "Action failed", variant: "destructive" });

    if (type === "suspend") {
      const isSuspended = customer.accountStatus === "deactivated";
      const thunk = isSuspended ? activateCustomer : suspendCustomer;
      dispatch(thunk(customer._id)).unwrap()
        .then((d) => done(d.message)).catch(fail);
      return;
    }
    if (type === "delete") {
      dispatch(deleteCustomer(customer._id)).unwrap()
        .then((d) => done(d.message)).catch(fail);
      return;
    }
    if (type === "logout") {
      dispatch(forceLogoutCustomer(customer._id)).unwrap()
        .then((d) => done(d.message)).catch(fail);
      return;
    }
    if (type === "deleteReview") {
      dispatch(deleteCustomerReview({ customerId, reviewId })).unwrap()
        .then((d) => done(d.message)).catch(fail);
      return;
    }
  };

  const executeReset = (pwd) => {
    dispatch(resetCustomerPassword({ id: resetTarget._id, newPassword: pwd }))
      .unwrap()
      .then((d) => { toast({ title: d.message }); setResetTarget(null); })
      .catch((err) => toast({ title: err?.message || "Failed", variant: "destructive" }));
  };

  const confirmMeta = () => {
    if (!confirmDlg) return {};
    const { type, customer } = confirmDlg;
    const isSuspended = customer?.accountStatus === "deactivated";
    if (type === "suspend") return {
      title:   isSuspended ? "Reactivate Account" : "Suspend Account",
      desc:    isSuspended ? `Reactivate ${customer?.userName}?` : `Suspend ${customer?.userName}? They won't be able to log in.`,
      label:   isSuspended ? "Reactivate" : "Suspend",
      variant: isSuspended ? "default" : "destructive",
    };
    if (type === "delete")       return { title: "Delete Customer", desc: `Soft-delete ${customer?.userName}? PII will be anonymized.`, label: "Delete", variant: "destructive" };
    if (type === "logout")       return { title: "Force Logout",    desc: `Invalidate active sessions for ${customer?.userName}?`,          label: "Force Logout", variant: "default" };
    if (type === "deleteReview") return { title: "Delete Review",   desc: "Permanently delete this review?",                                label: "Delete",      variant: "destructive" };
    return {};
  };

  const meta = confirmMeta();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage customer accounts and monitor activity</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2 shrink-0">
          <RefreshCw className="h-3.5 w-3.5" />Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total"         value={stats?.totalCustomers ?? "—"} icon={Users}       color="blue"   />
        <StatCard label="New Today"     value={stats?.todayCount ?? "—"}      icon={Users}       color="green"  />
        <StatCard label="This Month"    value={stats?.monthCount ?? "—"}      icon={TrendingUp}  color="purple" />
        <StatCard label="Verified"      value={stats?.verifiedCount ?? "—"}   icon={CheckCircle2}color="teal"   />
        <StatCard label="With Orders"   value={stats?.withOrdersCount ?? "—"} icon={ShoppingBag} color="orange" />
        <StatCard label="Total Revenue"
          value={stats?.totalRevenue != null ? `ETB ${(stats.totalRevenue/1000).toFixed(1)}K` : "—"}
          icon={TrendingUp} color="rose"
          sub={stats?.totalRevenue != null ? `ETB ${stats.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : undefined}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email…" className="pl-10"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={verified} onValueChange={(v) => { setVerified(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Verified" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>
        <Select value={activity} onValueChange={(v) => { setActivity(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Activity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activity</SelectItem>
            <SelectItem value="with-orders">With Orders</SelectItem>
            <SelectItem value="without-orders">No Orders</SelectItem>
            <SelectItem value="new">New (30 days)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="most-spent">Highest Spending</SelectItem>
            <SelectItem value="least-spent">Lowest Spending</SelectItem>
            <SelectItem value="most-orders">Most Orders</SelectItem>
            <SelectItem value="least-orders">Least Orders</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Last Order</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead className="w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isListLoading ? (
              [...Array(8)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(9)].map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full rounded" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : customerList.length > 0 ? customerList.map((c) => (
              <TableRow key={c._id} className={c.accountStatus === "deactivated" ? "opacity-60" : ""}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-blue-600">{c.userName?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{c.userName}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{c.phone || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{fmtDate(c.createdAt)}</TableCell>
                <TableCell className="text-sm font-semibold">{c.totalOrders}</TableCell>
                <TableCell className="text-sm font-semibold">{fmt(c.totalSpent)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{fmtDate(c.lastOrderDate)}</TableCell>
                <TableCell><AccountBadge status={c.accountStatus} /></TableCell>
                <TableCell><VerifiedBadge verified={c.isEmailVerified} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleAction("view", c)} className="gap-2">
                        <Eye className="h-4 w-4" />View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleAction("suspend", c)} className="gap-2">
                        {c.accountStatus === "deactivated"
                          ? <><UserCheck className="h-4 w-4 text-green-600" />Reactivate</>
                          : <><UserX className="h-4 w-4 text-orange-500" />Suspend</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setResetTarget(c)} className="gap-2">
                        <KeyRound className="h-4 w-4" />Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction("logout", c)} className="gap-2">
                        <LogOut className="h-4 w-4" />Force Logout
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleAction("delete", c)} className="gap-2 text-red-600 focus:text-red-600">
                        <Trash2 className="h-4 w-4" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Users className="h-12 w-12 opacity-20" />
                    <p>No customers found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
      </div>

      {/* ── Dialogs ── */}
      <CustomerDetailsDialog
        open={!!detailsId} customerId={detailsId}
        onClose={() => setDetailsId(null)}
        onAction={handleAction}
      />

      <ConfirmDialog
        open={!!confirmDlg && confirmDlg.type !== "reset"}
        onClose={() => setConfirmDlg(null)}
        title={meta.title} description={meta.desc}
        confirmLabel={meta.label} confirmVariant={meta.variant}
        isLoading={isSubmitting} onConfirm={executeAction}
      />

      <ResetPasswordDialog
        open={!!resetTarget} customer={resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={executeReset} isLoading={isSubmitting}
      />
    </div>
  );
}
