import { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Package, Search, MoreVertical, Eye, EyeOff, Trash2, RefreshCw,
  AlertTriangle, Loader2, ChevronLeft, ChevronRight as ChevronRightIcon,
  Star, ShoppingBag, RotateCcw, Edit3, CheckSquare, ExternalLink,
  Tag, Filter, X, BarChart3, History, FileText, Store,
} from "lucide-react";
import {
  fetchAdminProducts, fetchAdminProductStats, fetchAdminProductById,
  editAdminProduct, unpublishAdminProduct, publishAdminProduct,
  softDeleteAdminProduct, restoreAdminProduct, bulkAdminProductAction,
  fetchAdminProductOrders, clearProductDetails,
} from "@/store/admin/products-slice";

// ── Helpers ─────────────────────────────────────────────────────────────────
const fmt     = (n) => `ETB ${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
const fmtDT   = (d) => d ? new Date(d).toLocaleString("en-US",  { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
// SKU uses # prefix to distinguish from Order IDs (which use ORD- prefix)
const toSKU    = (id) => id ? `#${String(id).slice(-8).toUpperCase()}` : "—";
const shortId  = toSKU; // alias used in detail view

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ product }) {
  if (product.isDeleted || product.effectiveStatus === "DELETED")
    return <Badge className="bg-red-100 text-red-800 border-0 gap-1"><Trash2 className="h-3 w-3" />Deleted</Badge>;
  if (product.adminStatus === "unpublished" || product.effectiveStatus === "UNPUBLISHED")
    return <Badge className="bg-orange-100 text-orange-800 border-0 gap-1"><EyeOff className="h-3 w-3" />Unpublished</Badge>;
  if (product.stock === 0)
    return <Badge className="bg-gray-100 text-gray-700 border-0">Out of Stock</Badge>;
  if (product.stock <= 5)
    return <Badge className="bg-yellow-100 text-yellow-800 border-0">Low Stock</Badge>;
  return <Badge className="bg-green-100 text-green-800 border-0 gap-1"><Eye className="h-3 w-3" />Published</Badge>;
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color = "blue", clickable, onClick }) {
  const colors = {
    blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   border: "border-blue-100"   },
    green:  { bg: "bg-green-50",  icon: "text-green-600",  border: "border-green-100"  },
    orange: { bg: "bg-orange-50", icon: "text-orange-600", border: "border-orange-100" },
    red:    { bg: "bg-red-50",    icon: "text-red-600",    border: "border-red-100"    },
    yellow: { bg: "bg-yellow-50", icon: "text-yellow-600", border: "border-yellow-100" },
    gray:   { bg: "bg-gray-50",   icon: "text-gray-600",   border: "border-gray-100"   },
  };
  const c = colors[color] || colors.blue;
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border ${c.border} p-4 flex items-start justify-between gap-3 shadow-sm
        ${clickable ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
    >
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? "—"}</p>
      </div>
      <div className={`p-2.5 rounded-xl ${c.bg} shrink-0`}>
        <Icon className={`h-5 w-5 ${c.icon}`} />
      </div>
    </div>
  );
}

// ── Inline Pagination ────────────────────────────────────────────────────────
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

// ── Stars ────────────────────────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} className={`h-3 w-3 ${s <= Math.round(rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{(rating || 0).toFixed(1)}</span>
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ open, onClose, title, description, confirmLabel, confirmVariant = "destructive", onConfirm, isLoading, children }) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />{title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant={confirmVariant} className="flex-1 gap-2" disabled={isLoading} onClick={onConfirm}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Unpublish Reason Dialog ──────────────────────────────────────────────────
const UNPUBLISH_REASONS = [
  "Policy violation",
  "Duplicate listing",
  "Incorrect information",
  "Under investigation",
  "Vendor request",
  "Other",
];

function UnpublishDialog({ open, onClose, product, onConfirm, isLoading }) {
  const [reason, setReason] = useState("");
  const [custom, setCustom] = useState("");
  useEffect(() => { if (!open) { setReason(""); setCustom(""); } }, [open]);
  const finalReason = reason === "Other" ? custom.trim() : reason;
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-orange-500" />Unpublish Product
          </DialogTitle>
          <DialogDescription>
            Hide <strong>{product?.name || product?.title}</strong> from customers. Select a reason.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="grid grid-cols-1 gap-2">
            {UNPUBLISH_REASONS.map((r) => (
              <button key={r} onClick={() => setReason(r)}
                className={`text-left text-sm px-3 py-2 rounded-lg border transition-colors
                  ${reason === r ? "border-orange-400 bg-orange-50 text-orange-800 font-medium" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                {r}
              </button>
            ))}
          </div>
          {reason === "Other" && (
            <Input placeholder="Describe the reason…" value={custom} onChange={(e) => setCustom(e.target.value)} autoFocus />
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="destructive" className="flex-1 gap-2"
            disabled={isLoading || !finalReason}
            onClick={() => onConfirm(finalReason)}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Unpublish
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Product Dialog (platform fields only) ───────────────────────────────
function EditProductDialog({ open, onClose, product, onConfirm, isLoading }) {
  const [adminCategory, setAdminCategory] = useState("");
  const [adminBrand,    setAdminBrand]    = useState("");
  const [tagsInput,     setTagsInput]     = useState("");

  useEffect(() => {
    if (open && product) {
      setAdminCategory(product.adminCategory || "");
      setAdminBrand(product.adminBrand || "");
      setTagsInput((product.adminTags || []).join(", "));
    }
    if (!open) { setAdminCategory(""); setAdminBrand(""); setTagsInput(""); }
  }, [open, product]);

  const handleSubmit = () => {
    const adminTags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    onConfirm({ adminCategory, adminBrand, adminTags });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-blue-600" />Edit Platform Fields
          </DialogTitle>
          <DialogDescription>
            Override category, brand, and tags for platform governance. Vendor's original data is preserved.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="p-3 rounded-xl bg-muted/40 border">
            <p className="text-xs font-medium text-muted-foreground mb-1">Product</p>
            <p className="text-sm font-semibold truncate">{product?.name || product?.title}</p>
            <p className="text-xs text-muted-foreground">Vendor category: {product?.category || "—"} · Brand: {product?.brand || "—"}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Platform Category Override</Label>
            <Input placeholder={product?.category || "e.g. Electronics"} value={adminCategory}
              onChange={(e) => setAdminCategory(e.target.value)} />
            <p className="text-xs text-muted-foreground">Leave blank to use vendor's category.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Platform Brand Override</Label>
            <Input placeholder={product?.brand || "e.g. Samsung"} value={adminBrand}
              onChange={(e) => setAdminBrand(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Platform Tags</Label>
            <Input placeholder="featured, sale, trending (comma separated)" value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)} />
            <p className="text-xs text-muted-foreground">Comma-separated tags for platform categorization.</p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button className="flex-1 gap-2" disabled={isLoading} onClick={handleSubmit}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Bulk Action Bar ──────────────────────────────────────────────────────────
function BulkActionBar({ selectedIds, onAction, onClear, isLoading }) {
  if (!selectedIds.length) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
      <CheckSquare className="h-4 w-4 text-blue-600 shrink-0" />
      <span className="text-sm font-medium text-blue-800">{selectedIds.length} selected</span>
      <div className="flex items-center gap-2 ml-auto flex-wrap">
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs border-blue-200 hover:bg-blue-100"
          onClick={() => onAction("publish")} disabled={isLoading}>
          <Eye className="h-3 w-3" />Republish
        </Button>
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
          onClick={() => onAction("unpublish")} disabled={isLoading}>
          <EyeOff className="h-3 w-3" />Unpublish
        </Button>
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs border-green-200 text-green-700 hover:bg-green-50"
          onClick={() => onAction("restore")} disabled={isLoading}>
          <RotateCcw className="h-3 w-3" />Restore
        </Button>
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs border-red-200 text-red-700 hover:bg-red-50"
          onClick={() => onAction("delete")} disabled={isLoading}>
          <Trash2 className="h-3 w-3" />Delete
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClear}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Product Details Dialog ─────────────────────────────────────────────────────
function ProductDetailsDialog({ open, onClose, productId, onAction }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { productDetails, productOrders, isDetailLoading } = useSelector((s) => s.adminProducts);

  useEffect(() => {
    if (open && productId) {
      dispatch(fetchAdminProductById(productId));
      dispatch(fetchAdminProductOrders(productId));
    }
    if (!open) dispatch(clearProductDetails());
  }, [open, productId, dispatch]);

  const p = productDetails;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
        </DialogHeader>

        {isDetailLoading || !p ? (
          <div className="space-y-3 py-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
          </div>
        ) : (
          <Tabs defaultValue="overview" className="mt-2">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="vendor">Vendor</TabsTrigger>
              <TabsTrigger value="orders">Orders ({productOrders?.length || 0})</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({p.reviews?.length || 0})</TabsTrigger>
              <TabsTrigger value="audit">Audit Log ({p.auditLogs?.length || 0})</TabsTrigger>
            </TabsList>

            {/* ── Overview ── */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl border bg-gray-50">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt="" className="h-20 w-20 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="h-20 w-20 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-lg truncate">{p.name || p.title}</p>
                    <p className="text-sm text-muted-foreground">SKU: {shortId(p._id)}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description || "No description"}</p>
                  </div>
                </div>
                <StatusBadge product={p} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="text-lg font-bold mt-0.5">{fmt(p.price)}</p>
                  {p.salePrice > 0 && p.salePrice < p.price && (
                    <p className="text-xs text-green-600 font-medium">Sale: {fmt(p.salePrice)}</p>
                  )}
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Stock</p>
                  <p className="text-lg font-bold mt-0.5">{p.stock}</p>
                  <p className="text-xs text-muted-foreground">Sales: {p.salesCount || 0}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="text-sm font-semibold mt-0.5 truncate">{p.category}</p>
                  {p.adminCategory && (
                    <p className="text-xs text-blue-600 font-medium truncate">Override: {p.adminCategory}</p>
                  )}
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Brand</p>
                  <p className="text-sm font-semibold mt-0.5 truncate">{p.brand || "—"}</p>
                  {p.adminBrand && (
                    <p className="text-xs text-blue-600 font-medium truncate">Override: {p.adminBrand}</p>
                  )}
                </div>
              </div>

              {p.adminTags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <p className="text-xs text-muted-foreground w-full">Platform Tags:</p>
                  {p.adminTags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
                      <Tag className="h-3 w-3" />{tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Created:</span> {fmtDate(p.createdAt)}</p>
                <p><span className="text-muted-foreground">Last Updated:</span> {fmtDate(p.updatedAt)}</p>
                {p.unpublishedAt && (
                  <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 space-y-1">
                    <p className="text-xs font-semibold text-orange-800">Unpublished</p>
                    <p className="text-xs text-orange-700">{fmtDT(p.unpublishedAt)}</p>
                    {p.unpublishedReason && <p className="text-xs text-orange-600">Reason: {p.unpublishedReason}</p>}
                  </div>
                )}
                {p.isDeleted && p.deletedAt && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-xs font-semibold text-red-800">Deleted on {fmtDT(p.deletedAt)}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => onAction("edit", p)} className="gap-1.5">
                  <Edit3 className="h-3.5 w-3.5" />Edit Platform Fields
                </Button>
                {p.effectiveStatus === "PUBLISHED" && (
                  <Button size="sm" variant="outline" className="gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50"
                    onClick={() => onAction("unpublish", p)}>
                    <EyeOff className="h-3.5 w-3.5" />Unpublish
                  </Button>
                )}
                {p.effectiveStatus === "UNPUBLISHED" && (
                  <Button size="sm" variant="outline" className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
                    onClick={() => onAction("publish", p)}>
                    <Eye className="h-3.5 w-3.5" />Republish
                  </Button>
                )}
                {!p.isDeleted && (
                  <Button size="sm" variant="destructive" className="gap-1.5"
                    onClick={() => onAction("delete", p)}>
                    <Trash2 className="h-3.5 w-3.5" />Soft Delete
                  </Button>
                )}
                {p.isDeleted && (
                  <Button size="sm" variant="outline" className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50"
                    onClick={() => onAction("restore", p)}>
                    <RotateCcw className="h-3.5 w-3.5" />Restore
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* ── Performance ── */}
            <TabsContent value="performance" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Total Orders",  value: p.performance?.totalOrders || 0,   icon: ShoppingBag },
                  { label: "Total Revenue", value: fmt(p.performance?.totalRevenue), icon: BarChart3   },
                  { label: "Rating",        value: <Stars rating={p.performance?.rating || 0} />, icon: Star },
                  { label: "Views",         value: p.performance?.viewCount || 0,     icon: Eye },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-xl border p-3 flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-blue-50 shrink-0`}>
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <div className="text-lg font-bold mt-0.5">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* ── Vendor ── */}
            <TabsContent value="vendor" className="space-y-3 mt-4">
              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{p.vendorName}</p>
                    <p className="text-sm text-muted-foreground">{p.vendorEmail}</p>
                  </div>
                  <Badge variant="secondary">{p.vendorStatus || "unknown"}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Store className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">{p.storeName}</span>
                  {p.storeSlug && (
                    <button onClick={() => window.open(`/store/${p.storeSlug}`, "_blank")}
                      className="text-blue-600 hover:underline inline-flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />View Storefront
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/admin/vendors`)}>
                    View All Vendors
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ── Orders ── */}
            <TabsContent value="orders" className="mt-4">
              {productOrders?.length > 0 ? (
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productOrders.slice(0, 20).map((o) => (
                        <TableRow key={o._id}>
                          <TableCell className="font-mono text-xs">#{o.orderId}</TableCell>
                          <TableCell className="text-sm">{o.customerName}</TableCell>
                          <TableCell className="text-sm">{fmtDate(o.orderDate)}</TableCell>
                          <TableCell className="text-sm">{o.item?.quantity || 0}</TableCell>
                          <TableCell className="font-semibold text-sm">{fmt(o.item?.price * o.item?.quantity)}</TableCell>
                          <TableCell><Badge variant="secondary" className="capitalize">{o.orderStatus}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
                  <ShoppingBag className="h-10 w-10 opacity-20" />
                  <p className="text-sm">No orders yet</p>
                </div>
              )}
            </TabsContent>

            {/* ── Reviews ── */}
            <TabsContent value="reviews" className="mt-4 space-y-3">
              {p.reviews?.length > 0 ? p.reviews.slice(0, 20).map((r) => (
                <div key={r._id} className="rounded-xl border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Stars rating={r.reviewValue || 0} />
                    <span className="text-xs text-muted-foreground">{fmtDate(r.createdAt)}</span>
                  </div>
                  <p className="text-sm">{r.reviewMessage || "No comment"}</p>
                  <p className="text-xs text-muted-foreground">by {r.userName || "Anonymous"}</p>
                </div>
              )) : (
                <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
                  <Star className="h-10 w-10 opacity-20" />
                  <p className="text-sm">No reviews yet</p>
                </div>
              )}
            </TabsContent>

            {/* ── Audit Log ── */}
            <TabsContent value="audit" className="mt-4 space-y-3">
              {p.auditLogs?.length > 0 ? p.auditLogs.map((log) => (
                <div key={log._id} className="rounded-xl border p-3 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    <History className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium capitalize">{log.action.replace(/_/g, " ").toLowerCase()}</p>
                    <p className="text-xs text-muted-foreground">{log.adminName} · {fmtDT(log.createdAt)}</p>
                    {log.reason && <p className="text-xs text-muted-foreground mt-1">Reason: {log.reason}</p>}
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
                  <FileText className="h-10 w-10 opacity-20" />
                  <p className="text-sm">No audit logs</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminProducts() {
  const dispatch  = useDispatch();
  const { toast } = useToast();

  const { productList, isListLoading, isSubmitting, pagination, stats } =
    useSelector((s) => s.adminProducts);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search,    setSearch]    = useState("");
  const [status,    setStatus]    = useState("all");
  const [category,  setCategory]  = useState("");
  const [sort,      setSort]      = useState("newest");
  const [page,      setPage]      = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minPrice,  setMinPrice]  = useState("");
  const [maxPrice,  setMaxPrice]  = useState("");

  // ── Selection state ───────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState([]);

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [detailId,        setDetailId]        = useState(null);
  const [editTarget,      setEditTarget]      = useState(null);
  const [unpublishTarget, setUnpublishTarget] = useState(null);
  const [confirmDlg,      setConfirmDlg]      = useState(null); // { type, product }
  const [bulkDlg,         setBulkDlg]         = useState(null); // { action, ids, reason? }
  const [bulkUnpubOpen,   setBulkUnpubOpen]   = useState(false);
  const [bulkUnpubIds,    setBulkUnpubIds]    = useState([]);

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  const load = useCallback(() => {
    dispatch(fetchAdminProducts({ search, status, category, sort, page, limit: 20, minPrice, maxPrice }));
  }, [dispatch, search, status, category, sort, page, minPrice, maxPrice]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { dispatch(fetchAdminProductStats()); }, [dispatch]);

  // Debounced search
  const searchTimer = useRef(null);
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); }, 400);
  };

  // ── Selection helpers ─────────────────────────────────────────────────────
  const allIds   = productList.map((p) => p._id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
  const toggleAll  = () => setSelectedIds(allSelected ? [] : allIds);
  const toggleOne  = (id) => setSelectedIds((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  // ── Single action handler ─────────────────────────────────────────────────
  const handleAction = (type, product) => {
    if (type === "view")      { setDetailId(product._id); return; }
    if (type === "edit")      { setEditTarget(product);   return; }
    if (type === "unpublish") { setUnpublishTarget(product); return; }
    setConfirmDlg({ type, product });
  };

  const done = (msg) => {
    toast({ title: msg });
    load();
    dispatch(fetchAdminProductStats());
    setConfirmDlg(null);
    setUnpublishTarget(null);
    setEditTarget(null);
    setDetailId(null);
  };

  const fail = (err) => {
    toast({ title: err?.message || "Action failed", variant: "destructive" });
    // Close dialogs on error too so user isn't stuck
    setConfirmDlg(null);
    setUnpublishTarget(null);
    setBulkDlg(null);
    setBulkUnpubOpen(false);
  };

  const executeConfirm = () => {
    const { type, product } = confirmDlg || {};
    if (type === "publish") {
      dispatch(publishAdminProduct(product._id)).unwrap()
        .then((d) => done(d.message)).catch(fail);
    } else if (type === "delete") {
      dispatch(softDeleteAdminProduct(product._id)).unwrap()
        .then((d) => done(d.message)).catch(fail);
    } else if (type === "restore") {
      dispatch(restoreAdminProduct(product._id)).unwrap()
        .then((d) => done(d.message)).catch(fail);
    }
  };

  const executeUnpublish = (reason) => {
    dispatch(unpublishAdminProduct({ id: unpublishTarget._id, reason }))
      .unwrap()
      .then((d) => done(d.message))
      .catch(fail);
  };

  const executeEdit = (fields) => {
    dispatch(editAdminProduct({ id: editTarget._id, ...fields }))
      .unwrap()
      .then((d) => done(d.message))
      .catch(fail);
  };

  // ── Bulk action handler ───────────────────────────────────────────────────
  const handleBulkAction = (action) => {
    if (action === "unpublish") {
      setBulkUnpubIds([...selectedIds]);
      setBulkUnpubOpen(true);
      return;
    }
    setBulkDlg({ action, ids: [...selectedIds] });
  };

  const executeBulkUnpublish = (reason) => {
    dispatch(bulkAdminProductAction({ action: "unpublish", productIds: bulkUnpubIds, reason }))
      .unwrap()
      .then((d) => {
        setSelectedIds([]);
        done(d.message);
      })
      .catch(fail);
  };

  const executeBulk = () => {
    const { action, ids } = bulkDlg;
    dispatch(bulkAdminProductAction({ action, productIds: ids }))
      .unwrap()
      .then((d) => {
        setSelectedIds([]);
        done(d.message);
      })
      .catch(fail);
  };

  // Confirm dialog meta
  const confirmMeta = () => {
    if (!confirmDlg) return {};
    const { type, product } = confirmDlg;
    const name = product?.name || product?.title || "this product";
    if (type === "publish")  return { title: "Republish Product", desc: `Make "${name}" visible on storefront?`, label: "Republish", variant: "default" };
    if (type === "delete")   return { title: "Soft Delete Product", desc: `Hide "${name}" from customers and vendors? Data is preserved.`, label: "Delete", variant: "destructive" };
    if (type === "restore")  return { title: "Restore Product", desc: `Restore "${name}" and make it published again?`, label: "Restore", variant: "default" };
    return {};
  };
  const meta = confirmMeta();

  const bulkMeta = () => {
    if (!bulkDlg) return {};
    const n = bulkDlg.ids?.length || 0;
    if (bulkDlg.action === "publish")  return { title: "Republish Products", desc: `Republish ${n} selected product(s)?`, label: "Republish", variant: "default" };
    if (bulkDlg.action === "delete")   return { title: "Delete Products", desc: `Soft-delete ${n} selected product(s)? Data is preserved.`, label: "Delete", variant: "destructive" };
    if (bulkDlg.action === "restore")  return { title: "Restore Products", desc: `Restore ${n} selected product(s)?`, label: "Restore", variant: "default" };
    return {};
  };
  const bmeta = bulkMeta();

  // ── Active filter count for badge ─────────────────────────────────────────
  const activeFilterCount = [status !== "all", category, minPrice, maxPrice].filter(Boolean).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage, moderate, and monitor vendor products</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { load(); dispatch(fetchAdminProductStats()); }} className="gap-2 shrink-0">
          <RefreshCw className="h-3.5 w-3.5" />Refresh
        </Button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total"       value={stats?.total       ?? "—"} icon={Package}  color="blue"   clickable onClick={() => { setStatus("all");         setPage(1); }} />
        <StatCard label="Published"   value={stats?.published   ?? "—"} icon={Eye}      color="green"  clickable onClick={() => { setStatus("published");   setPage(1); }} />
        <StatCard label="Unpublished" value={stats?.unpublished ?? "—"} icon={EyeOff}   color="orange" clickable onClick={() => { setStatus("unpublished"); setPage(1); }} />
        <StatCard label="Deleted"     value={stats?.deleted     ?? "—"} icon={Trash2}   color="red"    clickable onClick={() => { setStatus("deleted");     setPage(1); }} />
        <StatCard label="Out of Stock"value={stats?.outOfStock  ?? "—"} icon={Package}  color="gray"   clickable onClick={() => { setStatus("out-of-stock"); setPage(1); }} />
        <StatCard label="Low Stock"   value={stats?.lowStock    ?? "—"} icon={AlertTriangle} color="yellow" clickable onClick={() => { setStatus("low-stock"); setPage(1); }} />
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, SKU, vendor…" className="pl-10"
            value={search} onChange={(e) => { handleSearchChange(e.target.value); setPage(1); }} />
        </div>

        {/* Status quick filter */}
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); setSelectedIds([]); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="unpublished">Unpublished</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            <SelectItem value="low-stock">Low Stock</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="best-selling">Best Selling</SelectItem>
            <SelectItem value="highest-price">Highest Price</SelectItem>
            <SelectItem value="lowest-price">Lowest Price</SelectItem>
            <SelectItem value="highest-rated">Highest Rated</SelectItem>
            <SelectItem value="lowest-stock">Lowest Stock</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced filters toggle */}
        <Button variant="outline" size="sm" onClick={() => setFiltersOpen(!filtersOpen)}
          className={`gap-1.5 ${activeFilterCount > 0 ? "border-blue-400 text-blue-700 bg-blue-50" : ""}`}>
          <Filter className="h-3.5 w-3.5" />
          Filters {activeFilterCount > 0 && <Badge className="bg-blue-600 text-white text-[10px] h-4 px-1.5 ml-0.5">{activeFilterCount}</Badge>}
        </Button>
      </div>

      {/* ── Advanced Filters Panel ── */}
      {filtersOpen && (
        <div className="flex flex-wrap gap-3 p-4 rounded-xl border bg-gray-50 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Input className="w-36 h-8 text-sm" placeholder="e.g. electronics" value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Min Price</Label>
            <Input className="w-28 h-8 text-sm" type="number" min="0" placeholder="0"
              value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Max Price</Label>
            <Input className="w-28 h-8 text-sm" type="number" min="0" placeholder="∞"
              value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} />
          </div>
          <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-muted-foreground"
            onClick={() => { setCategory(""); setMinPrice(""); setMaxPrice(""); setPage(1); }}>
            <X className="h-3.5 w-3.5" />Clear
          </Button>
        </div>
      )}

      {/* ── Bulk Action Bar ── */}
      <BulkActionBar
        selectedIds={selectedIds}
        onAction={handleBulkAction}
        onClear={() => setSelectedIds([])}
        isLoading={isSubmitting}
      />

      {/* ── Products Table ── */}
      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[44px]">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll}
                  aria-label="Select all" />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="hidden md:table-cell">SKU</TableHead>
              <TableHead className="hidden lg:table-cell">Vendor</TableHead>
              <TableHead className="hidden lg:table-cell">Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="hidden xl:table-cell">Sales</TableHead>
              <TableHead className="hidden xl:table-cell">Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead className="w-[56px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isListLoading ? (
              [...Array(8)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(12)].map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full rounded" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : productList.length > 0 ? productList.map((product) => (
              <TableRow key={product._id}
                className={`${product.isDeleted ? "opacity-50" : ""} ${selectedIds.includes(product._id) ? "bg-blue-50/60" : ""}`}>
                <TableCell>
                  <Checkbox checked={selectedIds.includes(product._id)}
                    onCheckedChange={() => toggleOne(product._id)} aria-label="Select row" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5 min-w-0">
                    {product.images?.[0] || product.image ? (
                      <img src={product.images?.[0] || product.image} alt=""
                        className="h-9 w-9 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-sm font-medium truncate max-w-[140px]">
                      {product.name || product.title || "Unnamed"}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                  {shortId(product._id)}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm">
                  <p className="truncate max-w-[100px]">{product.vendorName}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[100px]">{product.storeName}</p>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm capitalize">
                  {product.adminCategory || product.category}
                </TableCell>
                <TableCell className="text-sm font-semibold">
                  {product.salePrice > 0 && product.salePrice < product.price
                    ? <span className="text-green-600">{fmt(product.salePrice)}</span>
                    : fmt(product.price)}
                </TableCell>
                <TableCell>
                  <span className={`text-sm font-medium ${product.stock === 0 ? "text-red-600" : product.stock <= 5 ? "text-yellow-600" : "text-gray-900"}`}>
                    {product.stock}
                  </span>
                </TableCell>
                <TableCell className="hidden xl:table-cell text-sm">{product.salesCount || 0}</TableCell>
                <TableCell className="hidden xl:table-cell">
                  <Stars rating={product.averageReview || 0} />
                </TableCell>
                <TableCell><StatusBadge product={product} /></TableCell>
                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                  {fmtDate(product.createdAt)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => handleAction("view", product)} className="gap-2">
                        <Eye className="h-4 w-4" />View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction("edit", product)} className="gap-2">
                        <Edit3 className="h-4 w-4" />Edit Platform Fields
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {!product.isDeleted && product.adminStatus === "published" && (
                        <DropdownMenuItem onClick={() => handleAction("unpublish", product)} className="gap-2 text-orange-600">
                          <EyeOff className="h-4 w-4" />Unpublish
                        </DropdownMenuItem>
                      )}
                      {!product.isDeleted && product.adminStatus === "unpublished" && (
                        <DropdownMenuItem onClick={() => handleAction("publish", product)} className="gap-2 text-green-600">
                          <Eye className="h-4 w-4" />Republish
                        </DropdownMenuItem>
                      )}
                      {!product.isDeleted && (
                        <DropdownMenuItem onClick={() => handleAction("delete", product)} className="gap-2 text-red-600 focus:text-red-600">
                          <Trash2 className="h-4 w-4" />Soft Delete
                        </DropdownMenuItem>
                      )}
                      {product.isDeleted && (
                        <DropdownMenuItem onClick={() => handleAction("restore", product)} className="gap-2 text-blue-600">
                          <RotateCcw className="h-4 w-4" />Restore
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={12} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Package className="h-12 w-12 opacity-20" />
                    <p>No products found</p>
                    {(search || status !== "all") && (
                      <Button size="sm" variant="outline" onClick={() => { setSearch(""); setStatus("all"); setPage(1); }}>
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Pagination pagination={pagination} onPageChange={(p) => { setPage(p); setSelectedIds([]); }} />
      </div>

      {/* ── Dialogs ── */}

      {/* Product Details */}
      <ProductDetailsDialog
        open={!!detailId} productId={detailId}
        onClose={() => setDetailId(null)}
        onAction={handleAction}
      />

      {/* Edit Platform Fields */}
      <EditProductDialog
        open={!!editTarget} product={editTarget}
        onClose={() => setEditTarget(null)}
        onConfirm={executeEdit} isLoading={isSubmitting}
      />

      {/* Unpublish (single) */}
      <UnpublishDialog
        open={!!unpublishTarget} product={unpublishTarget}
        onClose={() => setUnpublishTarget(null)}
        onConfirm={executeUnpublish} isLoading={isSubmitting}
      />

      {/* Generic Confirm (publish / delete / restore) */}
      <ConfirmDialog
        open={!!confirmDlg} onClose={() => setConfirmDlg(null)}
        title={meta.title} description={meta.desc}
        confirmLabel={meta.label} confirmVariant={meta.variant}
        onConfirm={executeConfirm} isLoading={isSubmitting}
      />

      {/* Bulk Unpublish (needs reason) */}
      <UnpublishDialog
        open={bulkUnpubOpen}
        product={{ name: `${bulkUnpubIds.length} products` }}
        onClose={() => setBulkUnpubOpen(false)}
        onConfirm={executeBulkUnpublish} isLoading={isSubmitting}
      />

      {/* Bulk Confirm (publish / delete / restore) */}
      <ConfirmDialog
        open={!!bulkDlg} onClose={() => setBulkDlg(null)}
        title={bmeta.title} description={bmeta.desc}
        confirmLabel={bmeta.label} confirmVariant={bmeta.variant}
        onConfirm={executeBulk} isLoading={isSubmitting}
      />
    </div>
  );
}
