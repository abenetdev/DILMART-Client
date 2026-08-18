import { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Search, Store, MoreVertical, Eye, ExternalLink, Ban, CheckCircle,
  Package, ShoppingBag, Wallet, Trash2, KeyRound, UserX, UserCheck,
  AlertTriangle, Loader2, UserPlus,
} from "lucide-react";
import {
  fetchAllVendors, getVendorById, updateVendorStoreStatus,
  updateVendorAccountStatus, deleteVendor, resetVendorPassword,
  clearVendorDetails, registerVendor,
} from "@/store/admin/vendors-slice";
import { currencyFormatter } from "@/utils";

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

function StoreStatusBadge({ store }) {
  if (!store) return <Badge variant="secondary">No Store</Badge>;
  if (store.status === "active") return <Badge className="bg-green-100 text-green-800 border-0">Active</Badge>;
  return <Badge className="bg-orange-100 text-orange-800 border-0">Closed</Badge>;
}

function AccountStatusBadge({ status }) {
  if (status === "deactivated") return <Badge className="bg-orange-100 text-orange-800 border-0">Deactivated</Badge>;
  if (status === "deleted")     return <Badge className="bg-red-100 text-red-800 border-0">Deleted</Badge>;
  return <Badge className="bg-green-100 text-green-800 border-0">Active</Badge>;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AdminVendors() {
  const dispatch   = useDispatch();
  const { toast }  = useToast();

  const { vendorList, vendorDetails, isListLoading, isSubmitting } =
    useSelector((s) => s.adminVendors);

  // Filter state
  const [searchTerm,   setSearchTerm]   = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Dialog state
  const [detailsOpen,       setDetailsOpen]       = useState(false);
  const [deleteTarget,      setDeleteTarget]      = useState(null);
  const [deactivateTarget,  setDeactivateTarget]  = useState(null);
  const [resetPwdTarget,    setResetPwdTarget]    = useState(null);
  const [newPassword,       setNewPassword]       = useState("");
  const [registerOpen,      setRegisterOpen]      = useState(false);
  const [registerForm,      setRegisterForm]      = useState({
    userName: "", email: "", password: "", phone: "",
    storeName: "", businessCategory: "other", city: "", description: "",
  });

  useEffect(() => {
    dispatch(fetchAllVendors({ search: searchTerm, storeStatus: filterStatus }));
  }, [dispatch, filterStatus]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const refresh = () => dispatch(fetchAllVendors({ search: searchTerm, storeStatus: filterStatus }));

  const handleSearch = () => refresh();

  const handleViewDetails = (vendorId) => {
    dispatch(getVendorById(vendorId));
    setDetailsOpen(true);
  };

  const handleToggleStoreStatus = async (vendorId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "temporarily-closed" : "active";
    const result = await dispatch(updateVendorStoreStatus({ vendorId, status: newStatus }));
    if (result?.payload?.success) {
      toast({ title: result.payload.message });
      refresh();
      if (detailsOpen && vendorDetails?._id === vendorId) dispatch(getVendorById(vendorId));
    } else {
      toast({ title: result?.payload?.message || "Update failed", variant: "destructive" });
    }
  };

  const handleAccountStatus = async () => {
    if (!deactivateTarget) return;
    const newStatus = deactivateTarget.accountStatus === "deactivated" ? "active" : "deactivated";
    dispatch(updateVendorAccountStatus({ vendorId: deactivateTarget._id, status: newStatus }))
      .unwrap()
      .then((data) => {
        toast({ title: data.message });
        setDeactivateTarget(null);
        refresh();
      })
      .catch((err) => {
        toast({ title: err?.message || "Failed", variant: "destructive" });
      });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteVendor(deleteTarget._id));
    if (result?.payload?.success) {
      toast({ title: result.payload.message });
      setDeleteTarget(null);
      setDetailsOpen(false);
      dispatch(clearVendorDetails());
    } else {
      toast({ title: result?.payload?.message || "Delete failed", variant: "destructive" });
    }
  };

  const handleResetPassword = async () => {
    if (!resetPwdTarget || !newPassword) return;
    const result = await dispatch(resetVendorPassword({ vendorId: resetPwdTarget._id, newPassword }));
    if (result?.payload?.success) {
      toast({ title: result.payload.message });
      setResetPwdTarget(null);
      setNewPassword("");
    } else {
      toast({ title: result?.payload?.message || "Reset failed", variant: "destructive" });
    }
  };

  const setRF = (f, v) => setRegisterForm((p) => ({ ...p, [f]: v }));

  const handleRegister = async (e) => {
    e.preventDefault();
    const result = await dispatch(registerVendor(registerForm));
    if (result?.payload?.success) {
      toast({ title: result.payload.message });
      setRegisterOpen(false);
      setRegisterForm({ userName: "", email: "", password: "", phone: "", storeName: "", businessCategory: "other", city: "", description: "" });
      refresh();
    } else {
      toast({ title: result?.payload?.message || "Registration failed", variant: "destructive" });
    }
  };

  const registerValid =
    registerForm.userName.trim() &&
    registerForm.email.trim() &&
    registerForm.password.length >= 6 &&
    registerForm.storeName.trim();

  const stats = {
    total:    vendorList.length,
    active:   vendorList.filter((v) => v.store?.status === "active").length,
    closed:   vendorList.filter((v) => v.store?.status === "temporarily-closed").length,
    noStore:  vendorList.filter((v) => !v.store).length,
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <Fragment>
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Vendors</h1>
          <p className="text-muted-foreground">Manage marketplace sellers and their stores</p>
        </div>
        <Button onClick={() => setRegisterOpen(true)} className="gap-2 shrink-0">
          <UserPlus className="h-4 w-4" />
          Register Seller
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {[
          { label: "Total Vendors",      value: stats.total,   color: "" },
          { label: "Active Stores",       value: stats.active,  color: "text-green-600" },
          { label: "Temporarily Closed",  value: stats.closed,  color: "text-orange-600" },
          { label: "No Store Yet",        value: stats.noStore, color: "text-muted-foreground" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or store..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>Search</Button>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Store status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            <SelectItem value="active">Active Stores</SelectItem>
            <SelectItem value="temporarily-closed">Closed Stores</SelectItem>
            <SelectItem value="no-store">No Store</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Store Status</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isListLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : vendorList.length > 0 ? (
              vendorList.map((vendor) => (
                <TableRow key={vendor._id} className={vendor.accountStatus === "deactivated" ? "opacity-60" : ""}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{vendor.userName}</p>
                      <p className="text-xs text-muted-foreground">{vendor.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {vendor.store ? (
                      <div>
                        <p className="font-medium text-sm">{vendor.store.storeName}</p>
                        <p className="text-xs text-muted-foreground">/{vendor.store.slug}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell><StoreStatusBadge store={vendor.store} /></TableCell>
                  <TableCell><AccountStatusBadge status={vendor.accountStatus} /></TableCell>
                  <TableCell>{vendor.stats?.totalProducts ?? 0}</TableCell>
                  <TableCell>{vendor.stats?.totalOrders ?? 0}</TableCell>
                  <TableCell>{currencyFormatter(vendor.stats?.totalRevenue)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(vendor.joinedAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => handleViewDetails(vendor._id)} className="gap-2">
                          <Eye className="h-4 w-4" />View Details
                        </DropdownMenuItem>
                        {vendor.store?.slug && (
                          <DropdownMenuItem onClick={() => window.open(`/store/${vendor.store.slug}`, "_blank")} className="gap-2">
                            <ExternalLink className="h-4 w-4" />View Storefront
                          </DropdownMenuItem>
                        )}
                        {vendor.store && vendor.accountStatus !== "deactivated" && (
                          <DropdownMenuItem onClick={() => handleToggleStoreStatus(vendor._id, vendor.store.status)} className="gap-2">
                            {vendor.store.status === "active"
                              ? <><Ban className="h-4 w-4" />Close Store</>
                              : <><CheckCircle className="h-4 w-4" />Activate Store</>
                            }
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeactivateTarget(vendor)} className="gap-2">
                          {vendor.accountStatus === "deactivated"
                            ? <><UserCheck className="h-4 w-4 text-green-600" />Reactivate Account</>
                            : <><UserX className="h-4 w-4 text-orange-500" />Deactivate Account</>
                          }
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setResetPwdTarget(vendor); setNewPassword(""); }} className="gap-2">
                          <KeyRound className="h-4 w-4" />Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteTarget(vendor)} className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50">
                          <Trash2 className="h-4 w-4" />Delete Vendor
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <Store className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No vendors found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── VENDOR DETAILS DIALOG ───────────────────────────────────────────── */}
      <Dialog open={detailsOpen} onOpenChange={(v) => { if (!v) { setDetailsOpen(false); dispatch(clearVendorDetails()); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
          </DialogHeader>
          {!vendorDetails ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{vendorDetails.userName}</p>
                  <p className="text-sm text-muted-foreground">{vendorDetails.email}</p>
                  {vendorDetails.phone && (
                    <p className="text-sm text-muted-foreground">{vendorDetails.phone}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Joined {formatDate(vendorDetails.joinedAt)}</p>
                </div>
                <AccountStatusBadge status={vendorDetails.accountStatus} />
              </div>

              {vendorDetails.store ? (
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{vendorDetails.store.storeName}</p>
                    <StoreStatusBadge store={vendorDetails.store} />
                  </div>
                  <p className="text-sm text-muted-foreground">/{vendorDetails.store.slug}</p>
                  {vendorDetails.store.businessCategory && (
                    <p className="text-sm capitalize">Category: {vendorDetails.store.businessCategory.replace("-", " ")}</p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => window.open(`/store/${vendorDetails.store.slug}`, "_blank")} className="gap-1">
                      <ExternalLink className="h-3 w-3" />Storefront
                    </Button>
                    <Button
                      size="sm"
                      variant={vendorDetails.store.status === "active" ? "destructive" : "default"}
                      onClick={() => handleToggleStoreStatus(vendorDetails._id, vendorDetails.store.status)}
                      disabled={isSubmitting}
                    >
                      {vendorDetails.store.status === "active" ? "Close Store" : "Activate Store"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground rounded-lg border p-4">This vendor has not set up a store yet.</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Package className="h-4 w-4" />Products
                  </div>
                  <p className="text-xl font-bold">{vendorDetails.stats?.totalProducts ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{vendorDetails.stats?.activeProducts ?? 0} active</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <ShoppingBag className="h-4 w-4" />Orders
                  </div>
                  <p className="text-xl font-bold">{vendorDetails.stats?.totalOrders ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{currencyFormatter(vendorDetails.stats?.totalRevenue)} revenue</p>
                </div>
                <div className="rounded-lg border p-3 col-span-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Wallet className="h-4 w-4" />Wallet
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground">Available</p>
                      <p className="font-semibold text-green-600">{currencyFormatter(vendorDetails.stats?.availableBalance)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="font-semibold text-orange-600">{currencyFormatter(vendorDetails.stats?.pendingBalance)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {vendorDetails.recentOrders?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Recent Orders</p>
                  <div className="space-y-2">
                    {vendorDetails.recentOrders.map((order) => (
                      <div key={order._id} className="flex items-center justify-between text-sm rounded border px-3 py-2">
                        <span className="font-mono text-xs">{order.orderId}</span>
                        <span>{currencyFormatter(order.totalAmount)}</span>
                        <Badge variant="secondary">{order.orderStatus}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRMATION ──────────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />Delete Vendor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <p>Permanently delete <strong>{deleteTarget?.userName}</strong>? This will:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Delete all their products</li>
              <li>Remove their storefront</li>
              <li>Orphan their orders (customer records kept)</li>
              <li>Delete their wallet &amp; transactions</li>
            </ul>
            <p className="text-red-600 font-semibold">This action cannot be undone.</p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1 gap-2" disabled={isSubmitting} onClick={handleDelete}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete Permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── DEACTIVATE / REACTIVATE DIALOG ──────────────────────────────────── */}
      <Dialog open={!!deactivateTarget} onOpenChange={() => setDeactivateTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {deactivateTarget?.accountStatus === "deactivated"
                ? <><UserCheck className="h-5 w-5 text-green-600" />Reactivate Account</>
                : <><UserX className="h-5 w-5 text-orange-600" />Deactivate Account</>
              }
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground space-y-2">
            {deactivateTarget?.accountStatus === "deactivated" ? (
              <p>Reactivate <strong className="text-foreground">{deactivateTarget?.userName}</strong>? Their account will be restored and they can log in again.</p>
            ) : (
              <>
                <p>Deactivate <strong className="text-foreground">{deactivateTarget?.userName}</strong>?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>They cannot log in as a seller</li>
                  <li>All products hidden from marketplace</li>
                  <li>Store marked as temporarily closed</li>
                </ul>
              </>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeactivateTarget(null)}>Cancel</Button>
            <Button
              className={`flex-1 gap-2 text-white ${deactivateTarget?.accountStatus === "deactivated" ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}`}
              disabled={isSubmitting}
              onClick={handleAccountStatus}
            >
              {isSubmitting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : deactivateTarget?.accountStatus === "deactivated"
                  ? <UserCheck className="h-4 w-4" />
                  : <UserX className="h-4 w-4" />
              }
              {deactivateTarget?.accountStatus === "deactivated" ? "Reactivate" : "Deactivate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── RESET PASSWORD DIALOG ────────────────────────────────────────────── */}
      <Dialog open={!!resetPwdTarget} onOpenChange={() => { setResetPwdTarget(null); setNewPassword(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />Reset Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Set a new password for <strong className="text-foreground">{resetPwdTarget?.userName}</strong>.
              They will be required to change it on next login.
            </p>
            <div>
              <Label className="text-sm">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-1"
              />
              {newPassword && newPassword.length < 6 && (
                <p className="text-xs text-red-500 mt-1">Minimum 6 characters required</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => { setResetPwdTarget(null); setNewPassword(""); }}>Cancel</Button>
            <Button
              className="flex-1 gap-2"
              disabled={isSubmitting || !newPassword || newPassword.length < 6}
              onClick={handleResetPassword}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Reset Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── REGISTER SELLER DIALOG ──────────────────────────────────────────── */}
      <Dialog open={registerOpen} onOpenChange={(v) => {
        if (!v) {
          setRegisterOpen(false);
          setRegisterForm({ userName: "", email: "", password: "", phone: "", storeName: "", businessCategory: "other", city: "", description: "" });
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Register New Seller
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRegister} className="space-y-4 py-2">
            {/* Account details */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account Details</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-userName">Username <span className="text-red-500">*</span></Label>
                  <Input
                    id="reg-userName"
                    placeholder="johndoe"
                    value={registerForm.userName}
                    onChange={(e) => setRF("userName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="seller@example.com"
                    value={registerForm.email}
                    onChange={(e) => setRF("email", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-phone">Phone Number</Label>
                <Input
                  id="reg-phone"
                  type="tel"
                  placeholder="+251 9XX XXX XXXX"
                  value={registerForm.phone}
                  onChange={(e) => setRF("phone", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Temporary Password <span className="text-red-500">*</span></Label>
                <Input
                  id="reg-password"
                  type="text"
                  placeholder="At least 6 characters"
                  value={registerForm.password}
                  onChange={(e) => setRF("password", e.target.value)}
                  required
                  minLength={6}
                />
                {registerForm.password && registerForm.password.length < 6 && (
                  <p className="text-xs text-red-500">Minimum 6 characters</p>
                )}
                <p className="text-xs text-muted-foreground">
                  This password will be emailed to the seller. They'll be required to change it on first login.
                </p>
              </div>
            </div>

            {/* Store details */}
            <div className="space-y-3 pt-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Store Details</p>

              <div className="space-y-1.5">
                <Label htmlFor="reg-storeName">Store Name <span className="text-red-500">*</span></Label>
                <Input
                  id="reg-storeName"
                  placeholder="Awesome Store"
                  value={registerForm.storeName}
                  onChange={(e) => setRF("storeName", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-category">Category</Label>
                  <Select value={registerForm.businessCategory} onValueChange={(v) => setRF("businessCategory", v)}>
                    <SelectTrigger id="reg-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        ["other",          "Other"],
                        ["fashion",        "Fashion"],
                        ["electronics",    "Electronics"],
                        ["beauty",         "Beauty"],
                        ["home-living",    "Home & Living"],
                        ["automotive",     "Automotive"],
                        ["sports",         "Sports"],
                        ["food-beverage",  "Food & Beverage"],
                        ["health-wellness","Health & Wellness"],
                        ["books",          "Books"],
                      ].map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-city">City</Label>
                  <Input
                    id="reg-city"
                    placeholder="Addis Ababa"
                    value={registerForm.city}
                    onChange={(e) => setRF("city", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-description">Store Description</Label>
                <Input
                  id="reg-description"
                  placeholder="Brief description of the store (optional)"
                  value={registerForm.description}
                  onChange={(e) => setRF("description", e.target.value)}
                />
              </div>
            </div>

            {/* Notice */}
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700 space-y-1">
              <p className="font-semibold">What happens next:</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-600">
                <li>A vendor account and store are created instantly</li>
                <li>Login credentials are emailed to the seller</li>
                <li>The seller must change their password on first login</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setRegisterOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={isSubmitting || !registerValid}
              >
                {isSubmitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Creating…</>
                  : <><UserPlus className="h-4 w-4" />Create Seller Account</>
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}
