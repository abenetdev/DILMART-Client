import { Fragment, useEffect, useState } from "react";
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
} from "lucide-react";
import ProductImageUpload from "@/components/vendor-view/image-upload";
import MediaUpload from "@/components/vendor-view/media-upload";
import CommonForm from "@/components/common/form";
import { addProductFormElements } from "@/config";
import {
  addNewProduct,
  deleteProduct,
  editProduct,
  fetchAllProducts,
  setSuperDeal,
  cancelSuperDeal,
} from "@/store/vendor/products-slice";

const initialFormData = {
  name: "",
  description: "",
  category: "",
  brand: "",
  price: "",
  salePrice: "",
  stock: "",
  status: "active",
  images: [],
  video: "",
};

// â”€â”€ Countdown display â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

function VendorProducts() {
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDealDialog, setOpenDealDialog] = useState(false);
  const [dealTarget, setDealTarget] = useState(null);
  const [dealForm, setDealForm] = useState({ dealPrice: "", dealTitle: "", expiresAt: "" });
  const [formData, setFormData] = useState(initialFormData);
  const [currentEditedId, setCurrentEditedId] = useState(null);
  const [deleteProductId, setDeleteProductId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const { productList, isListLoading, isSubmitting } = useSelector((state) => state.vendorProducts);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      dispatch(fetchAllProducts({}));
    }
  }, [dispatch, isAuthenticated, user?.id]);

  const handleOpenDialog = () => {
    setFormData(initialFormData);
    setCurrentEditedId(null);
    setOpenDialog(true);
  };

  const handleEditProduct = (product) => {
    setFormData({
      name:        product.name || product.title || "",
      description: product.description || "",
      category:    product.category || "",
      brand:       product.brand || "",
      price:       product.price || "",
      salePrice:   product.salePrice || "",
      stock:       product.stock || "",
      status:      product.status || "active",
      images:      product.images || (product.image ? [product.image] : []),
      video:       product.video  || "",
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
        dispatch(fetchAllProducts({}));
        toast({ title: "Product deleted successfully" });
      }
    });
    setOpenDeleteDialog(false);
    setDeleteProductId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const productData = { ...formData };

    if (currentEditedId) {
      dispatch(editProduct({ id: currentEditedId, formData: productData })).then((data) => {
        if (data?.payload?.success) {
          dispatch(fetchAllProducts({}));
          setOpenDialog(false);
          setFormData(initialFormData);
          toast({ title: "Product updated successfully" });
        }
      });
    } else {
      dispatch(addNewProduct(productData)).then((data) => {
        if (data?.payload?.success) {
          dispatch(fetchAllProducts({}));
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

  // â”€â”€ Super Deal handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleOpenDealDialog = (product) => {
    setDealTarget(product);
    const existing = product.superDeal;
    const isLive = existing?.isActive && existing?.expiresAt && new Date(existing.expiresAt) > new Date();
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
      id:         dealTarget._id,
      dealPrice:  Number(dealForm.dealPrice),
      dealTitle:  dealForm.dealTitle || "âš¡ Super Deal",
      expiresAt:  dealForm.expiresAt,
    })).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchAllProducts({}));
        setOpenDealDialog(false);
        toast({ title: "âš¡ Super Deal activated!", description: `Deal will end on ${new Date(dealForm.expiresAt).toLocaleString()}` });
      } else {
        toast({ title: data?.payload?.message || "Failed to set deal", variant: "destructive" });
      }
    });
  };

  const handleCancelDeal = (productId) => {
    dispatch(cancelSuperDeal(productId)).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchAllProducts({}));
        toast({ title: "Super Deal cancelled" });
      }
    });
  };

  const isFormValid = () => {
    return (
      formData.name &&
      formData.description &&
      formData.category &&
      formData.price &&
      formData.stock !== "" &&
      formData.images.length > 0
    );
  };

  // Filter products
  const filteredProducts = productList?.filter((product) => {
    const displayName = product.name || product.title || "";
    const sku = `#${product._id?.slice(-8).toUpperCase()}`;
    const matchesSearch =
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || product.status === filterStatus;
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Min datetime for deal expiry picker â€” now + 5 min
  const minDealDate = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <Fragment>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground">Manage your product inventory</p>
          </div>
          <Button onClick={handleOpenDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, SKU (#XXXXXXXX)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="men">Men</SelectItem>
              <SelectItem value="women">Women</SelectItem>
              <SelectItem value="kids">Kids</SelectItem>
              <SelectItem value="accessories">Accessories</SelectItem>
              <SelectItem value="footwear">Footwear</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="home">Home & Living</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Table */}
      <div className="border rounded-lg">
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
                <TableCell colSpan={9} className="text-center py-8">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : filteredProducts && filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                const deal = product.superDeal;
                const dealLive = deal?.isActive && deal?.expiresAt && new Date(deal.expiresAt) > new Date();
                return (
                  <TableRow key={product._id}>
                    <TableCell>
                      <div className="h-12 w-12 rounded overflow-hidden bg-muted relative">
                        {(product.images?.[0] || product.image) ? (
                          <img
                            src={product.images?.[0] || product.image}
                            alt={product.name || product.title}
                            className="h-full w-full object-cover"
                          />
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
                        <div className="font-medium">ETB {product.price}</div>
                        {product.salePrice > 0 && (
                          <div className="text-sm text-green-600">Sale: ETB {product.salePrice}</div>
                        )}
                        {dealLive && (
                          <div className="text-sm font-bold text-orange-600">
                            âš¡ ETB {deal.dealPrice}
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
                      <div className="flex flex-col gap-1">
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
                    </TableCell>
                    <TableCell>
                      {dealLive ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-orange-600 truncate max-w-[120px]">
                            {deal.dealTitle || "âš¡ Super Deal"}
                          </span>
                          <CountdownBadge expiresAt={deal.expiresAt} />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">â€”</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditProduct(product)} className="gap-2">
                            <Edit className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenDealDialog(product)}
                            className="gap-2 text-orange-600 focus:text-orange-600"
                          >
                            <Zap className="h-4 w-4" />
                            {dealLive ? "Edit Super Deal" : "Create Super Deal"}
                          </DropdownMenuItem>
                          {dealLive && (
                            <DropdownMenuItem
                              onClick={() => handleCancelDeal(product._id)}
                              className="gap-2 text-muted-foreground"
                            >
                              <XCircle className="h-4 w-4" /> Cancel Deal
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(product._id)}
                            className="gap-2 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                    <Button onClick={handleOpenDialog} variant="outline">
                      Add Your First Product
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* â”€â”€ Add/Edit Product Dialog â”€â”€ */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentEditedId ? "Edit Product" : "Add New Product"}
            </DialogTitle>
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
            formControls={addProductFormElements}
            isBtnDisabled={!isFormValid()}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>

      {/* â”€â”€ Delete Confirmation Dialog â”€â”€ */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
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

      {/* â”€â”€ Super Deal Dialog â”€â”€ */}
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
                    ðŸ’° {Math.round((1 - Number(dealForm.dealPrice) / dealTarget.price) * 100)}% off â€” customers save ETB {(dealTarget.price - Number(dealForm.dealPrice)).toFixed(2)}
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
