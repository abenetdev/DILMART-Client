import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminCategories, createAdminCategory, updateAdminCategory,
  deleteAdminCategory, toggleActiveAdminCategory, toggleFeaturedAdminCategory,
  clearCategoryError,
} from "@/store/admin/category-slice";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, Pencil, Trash2, Loader2, Tag, Star, CheckCircle, XCircle,
  Image as ImageIcon, GripVertical,
} from "lucide-react";

// ── Category Form Dialog ───────────────────────────────────────────────────
function CategoryFormDialog({ open, onClose, editItem, categories, isSubmitting, onSubmit }) {
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", color: "#f3f4f6",
    parentCategory: "", displayOrder: "0", isActive: true, isFeatured: false,
  });
  const [previewImage, setPreviewImage] = useState("");
  const [file, setFile] = useState(null);

  // Populate form when editing
  useEffect(() => {
    if (editItem) {
      setForm({
        name:           editItem.name || "",
        slug:           editItem.slug || "",
        description:    editItem.description || "",
        color:          editItem.color || "#f3f4f6",
        parentCategory: editItem.parentCategory?._id || editItem.parentCategory || "",
        displayOrder:   String(editItem.displayOrder ?? 0),
        isActive:       editItem.isActive !== false,
        isFeatured:     !!editItem.isFeatured,
      });
      setPreviewImage(editItem.image || "");
    } else {
      setForm({ name: "", slug: "", description: "", color: "#f3f4f6",
        parentCategory: "", displayOrder: "0", isActive: true, isFeatured: false });
      setPreviewImage("");
    }
    setFile(null);
  }, [editItem, open]);

  // Auto-generate slug from name (only when creating)
  useEffect(() => {
    if (!editItem && form.name) {
      const auto = form.name.toLowerCase().trim()
        .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").slice(0, 80);
      setForm((p) => ({ ...p, slug: auto }));
    }
  }, [form.name, editItem]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewImage(URL.createObjectURL(f));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name",         form.name.trim());
    fd.append("slug",         form.slug.trim());
    fd.append("description",  form.description);
    fd.append("color",        form.color);
    fd.append("parentCategory", form.parentCategory || "null");
    fd.append("displayOrder", form.displayOrder);
    fd.append("isActive",     String(form.isActive));
    fd.append("isFeatured",   String(form.isFeatured));
    if (file) fd.append("image", file);
    onSubmit(fd);
  };

  // Root categories only for parent selector (prevent deep nesting)
  const rootCats = categories.filter(
    (c) => !c.parentCategory && (!editItem || c._id !== editItem._id)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editItem ? "Edit Category" : "New Category"}</DialogTitle>
          <DialogDescription>
            {editItem ? "Update the category details below." : "Fill in the details to create a new category."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Name */}
          <div>
            <Label htmlFor="cat-name">Name <span className="text-red-500">*</span></Label>
            <Input id="cat-name" value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Mobile & Accessories" required className="mt-1" />
          </div>

          {/* Slug */}
          <div>
            <Label htmlFor="cat-slug">Slug <span className="text-red-500">*</span></Label>
            <Input id="cat-slug" value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              placeholder="mobile-accessories" required className="mt-1 font-mono text-sm" />
            <p className="text-xs text-muted-foreground mt-1">
              Used in product filters and URLs. Changing this on existing categories may affect existing products.
            </p>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="cat-desc">Description</Label>
            <Input id="cat-desc" value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Short description (optional)" className="mt-1" />
          </div>

          {/* Parent Category */}
          <div>
            <Label>Parent Category</Label>
            <Select value={form.parentCategory || "none"}
              onValueChange={(v) => setForm((p) => ({ ...p, parentCategory: v === "none" ? "" : v }))}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="None (root category)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (root category)</SelectItem>
                {rootCats.map((c) => (
                  <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Display Order + Color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cat-order">Display Order</Label>
              <Input id="cat-order" type="number" value={form.displayOrder}
                onChange={(e) => setForm((p) => ({ ...p, displayOrder: e.target.value }))}
                className="mt-1" min="0" />
            </div>
            <div>
              <Label htmlFor="cat-color">Background Color</Label>
              <div className="flex gap-2 mt-1 items-center">
                <input type="color" id="cat-color" value={form.color}
                  onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                  className="h-9 w-12 rounded border cursor-pointer" />
                <Input value={form.color}
                  onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                  className="font-mono text-sm flex-1" />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <Label>Category Image</Label>
            <div
              onClick={() => fileRef.current?.click()}
              className="mt-1 border-2 border-dashed rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              {previewImage ? (
                <img src={previewImage} alt="preview" className="h-16 w-16 rounded-lg object-cover border" />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-700">Click to upload image</p>
                <p className="text-xs text-gray-400">JPG, PNG, WebP · max 5MB</p>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {/* Flags */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={form.isActive}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: !!v }))} />
              <span className="text-sm">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={form.isFeatured}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isFeatured: !!v }))} />
              <span className="text-sm">Featured on Home</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1 gap-2" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editItem ? "Save Changes" : "Create Category"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Confirm Dialog ──────────────────────────────────────────────────
function DeleteConfirmDialog({ open, onClose, onConfirm, category, isSubmitting }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Category?</DialogTitle>
          <DialogDescription>
            This will permanently delete <strong>{category?.name}</strong>. This action cannot be undone.
            Categories with subcategories or assigned products cannot be deleted.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 pt-2">
          <Button variant="destructive" className="flex-1" disabled={isSubmitting} onClick={onConfirm}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AdminCategories() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { categories, isLoading, isSubmitting, error } =
    useSelector((s) => s.adminCategory);

  const [formOpen, setFormOpen]     = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  useEffect(() => { dispatch(fetchAdminCategories()); }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ title: error, variant: "destructive" });
      dispatch(clearCategoryError());
    }
  }, [error, toast, dispatch]);

  const handleSubmit = async (fd) => {
    let result;
    if (editItem) {
      result = await dispatch(updateAdminCategory({ id: editItem._id, formData: fd }));
    } else {
      result = await dispatch(createAdminCategory(fd));
    }
    if (result?.payload?.success) {
      toast({ title: editItem ? "Category updated" : "Category created" });
      setFormOpen(false);
      setEditItem(null);
    }
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteAdminCategory(deleteItem._id));
    if (result?.payload?.success) {
      toast({ title: "Category deleted" });
      setDeleteItem(null);
    }
  };

  const handleToggleActive = async (id) => {
    const result = await dispatch(toggleActiveAdminCategory(id));
    if (result?.payload?.success) toast({ title: result.payload.message });
  };

  const handleToggleFeatured = async (id) => {
    const result = await dispatch(toggleFeaturedAdminCategory(id));
    if (result?.payload?.success) toast({ title: result.payload.message });
  };

  // Build flat list with indentation info for display
  const roots = categories.filter((c) => !c.parentCategory);
  const children = (parentId) => categories.filter(
    (c) => c.parentCategory?._id === parentId || c.parentCategory === parentId
  );

  const flatList = [];
  roots.forEach((r) => {
    flatList.push({ ...r, depth: 0 });
    children(r._id).forEach((child) => {
      flatList.push({ ...child, depth: 1 });
    });
  });
  // Any orphaned categories that aren't in the tree
  const inTree = new Set(flatList.map((c) => c._id));
  categories.filter((c) => !inTree.has(c._id)).forEach((c) => flatList.push({ ...c, depth: 0 }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage product categories shown to customers and vendors
          </p>
        </div>
        <Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          New Category
        </Button>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Total",    count: categories.length,                          color: "bg-gray-100 text-gray-700" },
          { label: "Active",   count: categories.filter((c) => c.isActive).length,    color: "bg-green-100 text-green-700" },
          { label: "Featured", count: categories.filter((c) => c.isFeatured).length,  color: "bg-blue-100 text-blue-700" },
          { label: "Inactive", count: categories.filter((c) => !c.isActive).length,   color: "bg-red-100 text-red-700" },
        ].map(({ label, count, color }) => (
          <div key={label} className={`px-3 py-1.5 rounded-full text-sm font-medium ${color}`}>
            {label}: {count}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Category</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : flatList.length > 0 ? (
              flatList.map((cat) => (
                <TableRow key={cat._id} className="hover:bg-muted/30">
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3" style={{ paddingLeft: cat.depth * 20 }}>
                      {cat.depth > 0 && (
                        <span className="text-muted-foreground/40 mr-1">└</span>
                      )}
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: cat.color || "#f3f4f6" }}
                      >
                        {cat.image
                          ? <img src={cat.image} alt="" className="h-full w-full object-cover rounded-lg" />
                          : <Tag className="h-4 w-4 text-gray-500" />
                        }
                      </div>
                      <span className="font-medium text-sm">{cat.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{cat.slug}</code>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {cat.parentCategory?.name || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-center">{cat.displayOrder}</TableCell>
                  <TableCell>
                    <button onClick={() => handleToggleActive(cat._id)}>
                      {cat.isActive
                        ? <Badge className="bg-green-100 text-green-700 border-0 gap-1 cursor-pointer hover:bg-green-200">
                            <CheckCircle className="h-3 w-3" />Active
                          </Badge>
                        : <Badge className="bg-gray-100 text-gray-500 border-0 gap-1 cursor-pointer hover:bg-gray-200">
                            <XCircle className="h-3 w-3" />Inactive
                          </Badge>
                      }
                    </button>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => handleToggleFeatured(cat._id)}>
                      <Star
                        className={`h-4 w-4 ${cat.isFeatured ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-400"}`}
                      />
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => { setEditItem(cat); setFormOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteItem(cat)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16">
                  <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No categories yet</p>
                  <Button variant="outline" size="sm" className="mt-3"
                    onClick={() => { setEditItem(null); setFormOpen(true); }}>
                    Create your first category
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <CategoryFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null); }}
        editItem={editItem}
        categories={categories}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
      <DeleteConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        category={deleteItem}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
