import { Fragment, useEffect, useRef, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  MoreVertical,
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Zap,
  XCircle,
  Clock,
  Tag,
  Loader2,
} from "lucide-react";
import ProductImageUpload from "@/components/vendor-view/image-upload";
import MediaUpload from "@/components/vendor-view/media-upload";
import CommonForm from "@/components/common/form";
import { addProductFormElements } from "@/config";
import { useProductFormElements } from "@/hooks/useProductFormElements";
import {
  addNewProduct,
  deleteProduct,
  editProduct,
  fetchAllProducts,
  fetchProductsPage,
  resetProducts,
  setSuperDeal,
  cancelSuperDeal,
} from "@/store/vendor/products-slice";
import { currencyFormatter } from "@/utils";

const initialFormData = {
  name: "",
  description: "",
  category: "",
  brand: "",
  price: "",
  salePrice: "",
  stock: "",
  status: "active",
  condition: "new",
  hasWarranty: false,
  warrantyPeriod: "",
  warrantyDetails: "",
  hasSize: false,
  sizes: [],
  images: [],
  video: "",
};

// ── Countdown display ──────────────────────────────────────────────────────
function CountdownBadge({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function calc() {
      const diff = new Date(expiresAt) - new Date();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 24) {
        const d = Math.floor(h / 24);
        setTimeLeft(`${d}d ${h % 24}h`);
      } else {
        setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      }
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const expired = timeLeft === "Expired";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-full ${expired ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
      <Clock className="h-3 w-3" />
      {timeLeft}
    </span>
  );
}

// ── Status badges helper (reused in both table and card) ───────────────────
function StatusBadges({ product }) {
  return (
    <div className="flex flex-wrap gap-1">
      <Badge variant={product.status === "active" ? "default" : "secondary"}>
        {product.status}
      </Badge>
      {product.adminStatus === "unpublished" && (
        <Badge className="bg-orange-100 text-orange-800 border-0 text-[10px]">
          Admin hidden
        </Badge>
      )}
      {product.isDeleted && (
        <Badge className="bg-red-100 text-red-800 border-0 text-[10px]">
          Admin deleted
        </Badge>
      )}
    </div>
  );
}

// ── Action dropdown (reused in both table and card) ────────────────────────
function ProductActions({ product, dealLive, onEdit, onOpenDeal, onCancelDeal, onDelete }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(product)} className="gap-2">
          <Edit className="h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onOpenDeal(product)}
          className="gap-2 text-orange-600 focus:text-orange-600"
        >
          <Zap className="h-4 w-4" />
          {dealLive ? "Edit Super Deal" : "Create Super Deal"}
        </DropdownMenuItem>
        {dealLive && (
          <DropdownMenuItem
            onClick={() => onCancelDeal(product._id)}
            className="gap-2 text-muted-foreground"
          >
            <XCircle className="h-4 w-4" /> Cancel Deal
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => onDelete(product._id)}
          className="gap-2 text-red-600"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Mobile product card ────────────────────────────────────────────────────
function ProductCard({ product, onEdit, onOpenDeal, onCancelDeal, onDelete }) {
  const deal    = product.superDeal;
  const dealLive = deal?.isActive && deal?.expiresAt && new Date(deal.expiresAt) > new Date();
  const thumb   = product.images?.[0] || product.image;

  return (
    <div className="bg-background border rounded-xl p-3 space-y-3">
      {/* Top row: image + name + actions */}
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {thumb ? (
            <img src={thumb} alt={product.name || product.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Package className="h-7 w-7 text-muted-foreground" />
            </div>
          )}
          {dealLive && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-orange-500 rounded-full flex items-center justify-center">
              <Zap className="h-2.5 w-2.5 text-white" />
            </span>
          )}
        </div>

        {/* Name + category */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight line-clamp-2">
            {product.name || product.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
            {product.category}
          </p>
          {product.brand && (
            <p className="text-xs text-muted-foreground">{product.brand}</p>
          )}
        </div>

        {/* Actions menu — top-right */}
        <div className="flex-shrink-0 -mt-1 -mr-1">
          <ProductActions
            product={product}
            dealLive={dealLive}
            onEdit={onEdit}
            onOpenDeal={onOpenDeal}
            onCancelDeal={onCancelDeal}
            onDelete={onDelete}
          />
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <div>
          <span className="text-xs text-muted-foreground block">Price</span>
          <span className="font-semibold">ETB {currencyFormatter(product.price)}</span>
          {product.salePrice > 0 && (
            <span className="text-xs text-green-600 block">
              Sale: ETB {currencyFormatter(product.salePrice)}
            </span>
          )}
          {dealLive && (
            <span className="text-xs font-bold text-orange-600 block">
              ⚡ ETB {currencyFormatter(deal.dealPrice)}
            </span>
          )}
        </div>

        <div>
          <span className="text-xs text-muted-foreground block">Stock</span>
          <span className={`font-semibold ${
            product.stock === 0 ? "text-red-600" : product.stock < 10 ? "text-orange-600" : ""
          }`}>
            {product.stock} units
          </span>
        </div>

        <div>
          <span className="text-xs text-muted-foreground block">Condition</span>
          <span className="capitalize">{product.condition || "—"}</span>
        </div>

        <div>
          <span className="text-xs text-muted-foreground block">Status</span>
          <StatusBadges product={product} />
        </div>
      </div>

      {/* Super Deal row (shown only when active) */}
      {dealLive && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
          <span className="text-xs font-semibold text-orange-600 truncate mr-2">
            {deal.dealTitle || "⚡ Super Deal"}
          </span>
          <CountdownBadge expiresAt={deal.expiresAt} />
        </div>
      )}
    </div>
  );
}

// ── Mobile skeleton card ───────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-background border rounded-xl p-3 space-y-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 rounded-lg bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-8 bg-muted rounded" />
        <div className="h-8 bg-muted rounded" />
        <div className="h-8 bg-muted rounded" />
        <div className="h-8 bg-muted rounded" />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
function VendorProducts() {
  const [openDialog, setOpenDialog]           = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDealDialog, setOpenDealDialog]   = useState(false);
  const [dealTarget, setDealTarget]           = useState(null);
  const [dealForm, setDealForm]               = useState({ dealPrice: "", dealTitle: "", expiresAt: "" });
  const [formData, setFormData]               = useState(initialFormData);
  const [currentEditedId, setCurrentEditedId] = useState(null);
  const [deleteProductId, setDeleteProductId] = useState(null);
  const [searchTerm, setSearchTerm]           = useState("");
  const [filterStatus, setFilterStatus]       = useState("all");

  const { formElements: dynamicFormElements } = useProductFormElements();

  const {
    productList,
    isListLoading,
    isLoadingMore,
    isSubmitting,
    hasNextPage,
    currentPage,
  } = useSelector((state) => state.vendorProducts);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch  = useDispatch();
  const { toast } = useToast();

  // ── Sentinel ref for IntersectionObserver ─────────────────────────────
  const sentinelRef = useRef(null);

  // ── Current filter values as a stable ref for the observer callback ───
  const filtersRef = useRef({ searchTerm: "", filterStatus: "all" });
  useEffect(() => {
    filtersRef.current = { searchTerm, filterStatus };
  }, [searchTerm, filterStatus]);

  // ── Load a single page and append ─────────────────────────────────────
  const loadPage = useCallback(
    (page) => {
      if (!isAuthenticated || !user?.id) return;
      dispatch(
        fetchProductsPage({
          page,
          limit:    20,
          status:   filtersRef.current.filterStatus,
          search:   filtersRef.current.searchTerm,
        })
      );
    },
    [dispatch, isAuthenticated, user?.id]
  );

  // ── Initial load + filter/search change: reset then fetch page 1 ──────
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    dispatch(resetProducts());
    // Let the reset flush, then kick off page 1
    // (requestAnimationFrame ensures the reset action is processed first)
    const raf = requestAnimationFrame(() => {
      dispatch(
        fetchProductsPage({
          page:    1,
          limit:   20,
          status:  filterStatus,
          search:  searchTerm,
        })
      );
    });
    return () => cancelAnimationFrame(raf);
  }, [dispatch, isAuthenticated, user?.id, filterStatus, searchTerm]);

  // ── IntersectionObserver — fires when sentinel enters the viewport ─────
  // Store guard state in refs so the observer callback always reads fresh
  // values without needing to be re-created on every render.
  const hasNextPageRef  = useRef(true);
  const isLoadingRef    = useRef(false);
  const currentPageRef  = useRef(0);

  // Keep refs in sync with Redux state on every render
  hasNextPageRef.current = hasNextPage;
  isLoadingRef.current   = isListLoading || isLoadingMore;
  currentPageRef.current = currentPage;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        if (!hasNextPageRef.current || isLoadingRef.current) return;
        loadPage(currentPageRef.current + 1);
      },
      { rootMargin: "200px" } // start fetching 200px before sentinel is visible
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadPage]); // loadPage is stable (useCallback with no deps that change)

  // ── Post-mutation refresh (keeps the currently-loaded pages) ──────────
  const refreshAfterMutation = useCallback(() => {
    dispatch(fetchAllProducts({ status: filterStatus, search: searchTerm }));
  }, [dispatch, filterStatus, searchTerm]);

  const handleOpenDialog = () => {
    setFormData(initialFormData);
    setCurrentEditedId(null);
    setOpenDialog(true);
  };

  const handleEditProduct = (product) => {
    const standardPeriods = ["1 Month", "3 Months", "6 Months", "1 Year", "2 Years", "3 Years"];
    const savedPeriod     = product.warrantyPeriod || "";
    const isCustomPeriod  = savedPeriod && !standardPeriods.includes(savedPeriod);

    const knownSizes = [
      "XS","S","M","L","XL","XXL","XXXL",
      "28","30","32","34","36","38","40","42","44","46","48",
    ];
    const savedSizes    = product.sizes || [];
    const standardSizes = savedSizes.filter((s) => knownSizes.includes(s));
    const customSize    = savedSizes.find((s) => !knownSizes.includes(s)) || "";

    setFormData({
      name:                product.name || product.title || "",
      description:         product.description || "",
      category:            product.category || "",
      brand:               product.brand || "",
      price:               product.price || "",
      salePrice:           product.salePrice || "",
      stock:               product.stock || "",
      status:              product.status || "active",
      condition:           product.condition || "new",
      hasWarranty:         product.hasWarranty ?? false,
      warrantyPeriod:      isCustomPeriod ? "other" : savedPeriod,
      warrantyPeriodCustom: isCustomPeriod ? savedPeriod : "",
      warrantyDetails:     product.warrantyDetails || "",
      hasSize:             product.hasSize ?? false,
      sizes:               standardSizes,
      sizeCustom:          customSize,
      images:              product.images || (product.image ? [product.image] : []),
      video:               product.video  || "",
    });
    setCurrentEditedId(product._id);
    setOpenDialog(true);
  };

  const handleDeleteClick = (productId) => {
    setDeleteProductId(productId);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    dispatch(deleteProduct(deleteProductId)).then((data) => {
      if (data?.payload?.success) {
        refreshAfterMutation();
        toast({ title: "Product deleted successfully" });
      }
    });
    setOpenDeleteDialog(false);
    setDeleteProductId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const resolvedWarrantyPeriod =
      formData.warrantyPeriod === "other"
        ? (formData.warrantyPeriodCustom || "").trim()
        : formData.warrantyPeriod;

    const resolvedSizes = formData.hasSize
      ? [
          ...formData.sizes,
          ...(formData.sizeCustom?.trim() ? [formData.sizeCustom.trim()] : []),
        ]
      : [];

    const productData = { ...formData, warrantyPeriod: resolvedWarrantyPeriod, sizes: resolvedSizes };
    delete productData.warrantyPeriodCustom;
    delete productData.sizeCustom;

    if (currentEditedId) {
      dispatch(editProduct({ id: currentEditedId, formData: productData })).then((data) => {
        if (data?.payload?.success) {
          refreshAfterMutation();
          setOpenDialog(false);
          setFormData(initialFormData);
          toast({ title: "Product updated successfully" });
        }
      });
    } else {
      dispatch(addNewProduct(productData)).then((data) => {
        if (data?.payload?.success) {
          refreshAfterMutation();
          setOpenDialog(false);
          setFormData(initialFormData);
          toast({ title: "Product added successfully" });
        } else {
          toast({
            title: "Error adding product",
            description: data?.payload?.message || "Something went wrong",
            variant: "destructive",
          });
        }
      });
    }
  };

  // ── Super Deal handlers ────────────────────────────────────────────────
  const handleOpenDealDialog = (product) => {
    setDealTarget(product);
    const existing = product.superDeal;
    const isLive   = existing?.isActive && existing?.expiresAt && new Date(existing.expiresAt) > new Date();
    setDealForm({
      dealPrice: isLive ? existing.dealPrice : "",
      dealTitle: isLive ? existing.dealTitle : "",
      expiresAt: isLive ? new Date(existing.expiresAt).toISOString().slice(0, 16) : "",
    });
    setOpenDealDialog(true);
  };

  const handleSaveDeal = () => {
    if (!dealForm.dealPrice || !dealForm.expiresAt) {
      toast({ title: "Deal price and expiry are required", variant: "destructive" });
      return;
    }
    dispatch(setSuperDeal({
      id:        dealTarget._id,
      dealPrice: Number(dealForm.dealPrice),
      dealTitle: dealForm.dealTitle || "⚡ Super Deal",
      expiresAt: dealForm.expiresAt,
    })).then((data) => {
      if (data?.payload?.success) {
        refreshAfterMutation();
        setOpenDealDialog(false);
        toast({
          title: "⚡ Super Deal activated!",
          description: `Deal will end on ${new Date(dealForm.expiresAt).toLocaleString()}`,
        });
      } else {
        toast({ title: data?.payload?.message || "Failed to set deal", variant: "destructive" });
      }
    });
  };

  const handleCancelDeal = (productId) => {
    dispatch(cancelSuperDeal(productId)).then((data) => {
      if (data?.payload?.success) {
        refreshAfterMutation();
        toast({ title: "Super Deal cancelled" });
      }
    });
  };

  const isFormValid = () =>
    formData.name &&
    formData.description &&
    formData.category &&
    formData.price &&
    formData.stock !== "" &&
    formData.images.length > 0;

  const minDealDate = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);

  // Products come pre-filtered from the server — no client-side filter needed.
  const displayProducts = productList || [];

  return (
    <Fragment>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground text-sm">Manage your product inventory</p>
          </div>
          <Button onClick={handleOpenDialog} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative flex-1 min-w-0" style={{ minWidth: "160px" }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px] shrink-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE — card grid  (visible below md)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="md:hidden space-y-3">
        {isListLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : displayProducts.length > 0 ? (
          displayProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onEdit={handleEditProduct}
              onOpenDeal={handleOpenDealDialog}
              onCancelDeal={handleCancelDeal}
              onDelete={handleDeleteClick}
            />
          ))
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 border rounded-xl">
            <Package className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No products found</p>
            <Button onClick={handleOpenDialog} variant="outline">
              Add Your First Product
            </Button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TABLET — simplified table  (md → xl)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="hidden md:block xl:hidden border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[56px]">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isListLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Loading products…</TableCell>
              </TableRow>
            ) : displayProducts.length > 0 ? (
              displayProducts.map((product) => {
                const deal    = product.superDeal;
                const dealLive = deal?.isActive && deal?.expiresAt && new Date(deal.expiresAt) > new Date();
                const thumb   = product.images?.[0] || product.image;
                return (
                  <TableRow key={product._id}>
                    {/* Image */}
                    <TableCell>
                      <div className="relative h-10 w-10 rounded overflow-hidden bg-muted">
                        {thumb ? (
                          <img src={thumb} alt={product.name || product.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        {dealLive && (
                          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-orange-500 rounded-full flex items-center justify-center">
                            <Zap className="h-2 w-2 text-white" />
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Product name + category */}
                    <TableCell>
                      <p className="font-medium text-sm line-clamp-1">{product.name || product.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
                    </TableCell>

                    {/* Price */}
                    <TableCell>
                      <p className="font-medium text-sm">ETB {currencyFormatter(product.price)}</p>
                      {dealLive && (
                        <p className="text-xs font-bold text-orange-600">
                          ⚡ ETB {currencyFormatter(deal.dealPrice)}
                        </p>
                      )}
                    </TableCell>

                    {/* Stock */}
                    <TableCell>
                      <span className={`text-sm font-medium ${
                        product.stock === 0 ? "text-red-600" : product.stock < 10 ? "text-orange-600" : ""
                      }`}>
                        {product.stock}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusBadges product={product} />
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <ProductActions
                        product={product}
                        dealLive={dealLive}
                        onEdit={handleEditProduct}
                        onOpenDeal={handleOpenDealDialog}
                        onCancelDeal={handleCancelDeal}
                        onDelete={handleDeleteClick}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No products found</p>
                    <Button onClick={handleOpenDialog} variant="outline">Add Your First Product</Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          DESKTOP — full table  (xl+)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="hidden xl:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Super Deal</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isListLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">Loading products…</TableCell>
              </TableRow>
            ) : displayProducts.length > 0 ? (
              displayProducts.map((product) => {
                const deal    = product.superDeal;
                const dealLive = deal?.isActive && deal?.expiresAt && new Date(deal.expiresAt) > new Date();
                const thumb   = product.images?.[0] || product.image;
                return (
                  <TableRow key={product._id}>
                    <TableCell>
                      <div className="h-12 w-12 rounded overflow-hidden bg-muted relative">
                        {thumb ? (
                          <img src={thumb} alt={product.name || product.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        {dealLive && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 bg-orange-500 rounded-full flex items-center justify-center">
                            <Zap className="h-2.5 w-2.5 text-white" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name || product.title}</div>
                        <div className="text-sm text-muted-foreground">{product.brand || "No brand"}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{product._id?.slice(-8).toUpperCase()}
                    </TableCell>
                    <TableCell className="capitalize">{product.category}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">ETB {currencyFormatter(product.price)}</div>
                        {product.salePrice > 0 && (
                          <div className="text-sm text-green-600">Sale: ETB {currencyFormatter(product.salePrice)}</div>
                        )}
                        {dealLive && (
                          <div className="text-sm font-bold text-orange-600">
                            ⚡ ETB {currencyFormatter(deal.dealPrice)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={product.stock === 0 ? "text-red-600 font-medium" : product.stock < 10 ? "text-orange-600 font-medium" : ""}>
                        {product.stock} units
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadges product={product} />
                    </TableCell>
                    <TableCell>
                      {dealLive ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-orange-600 truncate max-w-[120px]">
                            {deal.dealTitle || "⚡ Super Deal"}
                          </span>
                          <CountdownBadge expiresAt={deal.expiresAt} />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ProductActions
                        product={product}
                        dealLive={dealLive}
                        onEdit={handleEditProduct}
                        onOpenDeal={handleOpenDealDialog}
                        onCancelDeal={handleCancelDeal}
                        onDelete={handleDeleteClick}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No products found</p>
                    <Button onClick={handleOpenDialog} variant="outline">Add Your First Product</Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Infinite scroll sentinel + "loading more" indicator ───────── */}
      {/* The sentinel is always rendered — IntersectionObserver watches it.
          The loading spinner only shows when isLoadingMore is true.          */}
      <div className="flex flex-col items-center gap-2 py-4">
        {isLoadingMore && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading more products…
          </div>
        )}
        {/* Invisible sentinel — 1px tall, observed by IntersectionObserver */}
        <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
      </div>

      {/* ── Add / Edit Product Dialog ──────────────────────────────────── */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentEditedId ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <MediaUpload
            images={formData.images}
            video={formData.video}
            onImagesChange={(imgs) => setFormData((p) => ({ ...p, images: imgs }))}
            onVideoChange={(vid)  => setFormData((p) => ({ ...p, video: vid }))}
          />
          <CommonForm
            formData={formData}
            setFormData={setFormData}
            buttonText={currentEditedId ? "Update Product" : "Add Product"}
            formControls={dynamicFormElements}
            isBtnDisabled={!isFormValid()}
            onSubmit={handleSubmit}
          />

          {/* Warranty Section */}
          <div className="border rounded-xl p-4 space-y-4 -mt-2">
            <p className="text-sm font-semibold text-foreground">Warranty</p>
            <div className="space-y-1.5">
              <Label className="text-sm">Warranty</Label>
              <Select
                value={formData.hasWarranty ? "yes" : "no"}
                onValueChange={(v) =>
                  setFormData((p) => ({
                    ...p,
                    hasWarranty:     v === "yes",
                    warrantyPeriod:  v === "no" ? "" : p.warrantyPeriod,
                    warrantyDetails: v === "no" ? "" : p.warrantyDetails,
                  }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No Warranty</SelectItem>
                  <SelectItem value="yes">Has Warranty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.hasWarranty && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm">Warranty Period</Label>
                  <Select
                    value={formData.warrantyPeriod}
                    onValueChange={(v) => setFormData((p) => ({ ...p, warrantyPeriod: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 Month">1 Month</SelectItem>
                      <SelectItem value="3 Months">3 Months</SelectItem>
                      <SelectItem value="6 Months">6 Months</SelectItem>
                      <SelectItem value="1 Year">1 Year</SelectItem>
                      <SelectItem value="2 Years">2 Years</SelectItem>
                      <SelectItem value="3 Years">3 Years</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.warrantyPeriod === "other" && (
                  <div className="space-y-1.5">
                    <Label className="text-sm">Custom Warranty Period</Label>
                    <Input
                      placeholder="e.g. 18 Months, Lifetime"
                      value={formData.warrantyPeriodCustom || ""}
                      onChange={(e) => setFormData((p) => ({ ...p, warrantyPeriodCustom: e.target.value }))}
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-sm">
                    Warranty Details{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input
                    placeholder="e.g. Official manufacturer warranty, covers manufacturing defects only"
                    value={formData.warrantyDetails}
                    onChange={(e) => setFormData((p) => ({ ...p, warrantyDetails: e.target.value }))}
                  />
                </div>
              </>
            )}
          </div>

          {/* Size Section */}
          <div className="border rounded-xl p-4 space-y-4 -mt-2">
            <p className="text-sm font-semibold text-foreground">Size</p>
            <div className="space-y-1.5">
              <Label className="text-sm">Size</Label>
              <Select
                value={formData.hasSize ? "yes" : "no"}
                onValueChange={(v) =>
                  setFormData((p) => ({
                    ...p,
                    hasSize:    v === "yes",
                    sizes:      v === "no" ? [] : p.sizes,
                    sizeCustom: v === "no" ? "" : p.sizeCustom,
                  }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No Size</SelectItem>
                  <SelectItem value="yes">Has Sizes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.hasSize && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm">Clothing Sizes</Label>
                  <div className="flex flex-wrap gap-2">
                    {["XS","S","M","L","XL","XXL","XXXL"].map((sz) => {
                      const selected = formData.sizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              sizes: selected
                                ? p.sizes.filter((s) => s !== sz)
                                : [...p.sizes, sz],
                            }))
                          }
                          className={`px-3 py-1 rounded-md text-sm font-medium border transition-colors ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-foreground border-border hover:border-primary"
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Numeric Sizes</Label>
                  <div className="flex flex-wrap gap-2">
                    {["28","30","32","34","36","38","40","42","44","46","48"].map((sz) => {
                      const selected = formData.sizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              sizes: selected
                                ? p.sizes.filter((s) => s !== sz)
                                : [...p.sizes, sz],
                            }))
                          }
                          className={`px-3 py-1 rounded-md text-sm font-medium border transition-colors ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-foreground border-border hover:border-primary"
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">
                    Other / Custom Size{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input
                    placeholder="e.g. Free Size, One Size, EU 42, US 10"
                    value={formData.sizeCustom || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, sizeCustom: e.target.value }))}
                  />
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ─────────────────────────────────── */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Product</DialogTitle></DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this product?</p>
            <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Super Deal Dialog ──────────────────────────────────────────── */}
      <Dialog open={openDealDialog} onOpenChange={setOpenDealDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Zap className="h-5 w-5" />
              Create Super Deal
            </DialogTitle>
          </DialogHeader>
          {dealTarget && (
            <div className="space-y-5 pt-1">
              {/* Product preview */}
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted shrink-0">
                  {(dealTarget.images?.[0] || dealTarget.image) ? (
                    <img src={dealTarget.images?.[0] || dealTarget.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-orange-100">
                      <Package className="h-6 w-6 text-orange-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{dealTarget.name || dealTarget.title}</p>
                  <p className="text-sm text-muted-foreground">Regular price: <span className="font-bold text-gray-800">ETB {dealTarget.price}</span></p>
                </div>
              </div>

              {/* Deal title */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Tag className="h-3.5 w-3.5" /> Deal Title
                </Label>
                <Input
                  placeholder='e.g. "Flash Sale" or "Weekend Special"'
                  value={dealForm.dealTitle}
                  onChange={(e) => setDealForm((p) => ({ ...p, dealTitle: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Shown to customers on the deals banner</p>
              </div>

              {/* Deal price */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Zap className="h-3.5 w-3.5 text-orange-500" /> Deal Price (ETB) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  max={dealTarget.price - 1}
                  placeholder={`Less than ETB ${dealTarget.price}`}
                  value={dealForm.dealPrice}
                  onChange={(e) => setDealForm((p) => ({ ...p, dealPrice: e.target.value }))}
                />
                {dealForm.dealPrice && Number(dealForm.dealPrice) < dealTarget.price && (
                  <p className="text-xs text-green-600 font-medium">
                    💰 {Math.round((1 - Number(dealForm.dealPrice) / dealTarget.price) * 100)}% off — customers save ETB {(dealTarget.price - Number(dealForm.dealPrice)).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Expiry */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Clock className="h-3.5 w-3.5 text-orange-500" /> Deal Ends At <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="datetime-local"
                  min={minDealDate}
                  value={dealForm.expiresAt}
                  onChange={(e) => setDealForm((p) => ({ ...p, expiresAt: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  After this time the deal is automatically removed from the storefront
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setOpenDealDialog(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white gap-2"
                  onClick={handleSaveDeal}
                  disabled={isSubmitting}
                >
                  <Zap className="h-4 w-4" />
                  {isSubmitting ? "Activating..." : "Activate Deal"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}

export default VendorProducts;
