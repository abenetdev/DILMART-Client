import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminBrands, createAdminBrand, updateAdminBrand,
  deleteAdminBrand, toggleActiveAdminBrand, clearBrandError,
} from "@/store/admin/brand-slice";
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, Pencil, Trash2, Loader2, Tag, CheckCircle, XCircle,
  Image as ImageIcon, GripVertical,
} from "lucide-react";

// ── Brand Form Dialog ──────────────────────────────────────────────────────
function BrandFormDialog({ open, onClose, editItem, isSubmitting, onSubmit }) {
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", displayOrder: "0", isActive: true,
  });
  const [previewImage, setPreviewImage] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (editItem) {
      setForm({
        name:         editItem.name || "",
        slug:         editItem.slug || "",
        description:  editItem.description || "",
        displayOrder: String(editItem.displayOrder ?? 0),
        isActive:     editItem.isActive !== false,
      });
      setPreviewImage(editItem.image || "");
    } else {
      setForm({ name: "", slug: "", description: "", displayOrder: "0", isActive: true });
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
    fd.append("name",        form.name.trim());
    fd.append("slug",        form.slug.trim());
    fd.append("description", form.description);
    fd.append("displayOrder", form.displayOrder);
    fd.append("isActive",    String(form.isActive));
    if (file) fd.append("image", file);
    onSubmit(fd);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editItem ? "Edit Brand" : "New Brand"}</DialogTitle>
          <DialogDescription>
            {editItem ? "Update the brand details below." : "Fill in the details to create a new brand."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Name */}
          <div>
            <Label htmlFor="brand-name">Name <span className="text-red-500">*</span></Label>
            <Input id="brand-name" value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Samsung, Apple, Nike" required className="mt-1" />
          </div>

          {/* Slug */}
          <div>
            <Label htmlFor="brand-slug">Slug <span className="text-red-500">*</span></Label>
            <Input id="brand-slug" value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              placeholder="samsung" required className="mt-1 font-mono text-sm" />
            <p className="text-xs text-muted-foreground mt-1">
              Used in product filters. Changing this on existing brands may affect existing products.
            </p>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="brand-desc">Description</Label>
            <Input id="brand-desc" value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Short description (optional)" className="mt-1" />
          </div>

          {/* Display Order */}
          <div>
            <Label htmlFor="brand-order">Display Order</Label>
            <Input id="brand-order" type="number" value={form.displayOrder}
              onChange={(e) => setForm((p) => ({ ...p, displayOrder: e.target.value }))}
              className="mt-1" min="0" />
            <p className="text-xs text-muted-foreground mt-1">
              Lower numbers appear first in lists
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <Label>Brand Logo / Image</Label>
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

          {/* Active Flag */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={form.isActive}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: !!v }))} />
              <span className="text-sm">Active</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1 gap-2" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editItem ? "Save Changes" : "Create Brand"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Confirm Dialog ──────────────────────────────────────────────────
function DeleteConfirmDialog({ open, onClose, onConfirm, brand, isSubmitting }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Brand?</DialogTitle>
          <DialogDescription>
            This will permanently delete <strong>{brand?.name}</strong>. This action cannot be undone.
            Brands assigned to products cannot be deleted.
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
export default function AdminBrands() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { brands, isLoading, isSubmitting, error } = useSelector((s) => s.adminBrand);

  const [formOpen, setFormOpen]     = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  useEffect(() => { dispatch(fetchAdminBrands()); }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ title: error, variant: "destructive" });
      dispatch(clearBrandError());
    }
  }, [error, toast, dispatch]);

  const handleSubmit = async (fd) => {
    let result;
    if (editItem) {
      result = await dispatch(updateAdminBrand({ id: editItem._id, formData: fd }));
    } else {
      result = await dispatch(createAdminBrand(fd));
    }
    if (result?.payload?.success) {
      toast({ title: editItem ? "Brand updated" : "Brand created" });
      setFormOpen(false);
      setEditItem(null);
    }
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteAdminBrand(deleteItem._id));
    if (result?.payload?.success) {
      toast({ title: "Brand deleted" });
      setDeleteItem(null);
    }
  };

  const handleToggleActive = async (id) => {
    const result = await dispatch(toggleActiveAdminBrand(id));
    if (result?.payload?.success) toast({ title: result.payload.message });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brands</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage product brands shown to customers and vendors
          </p>
        </div>
        <Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          New Brand
        </Button>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Total",    count: brands.length,                        color: "bg-gray-100 text-gray-700" },
          { label: "Active",   count: brands.filter((b) => b.isActive).length,  color: "bg-green-100 text-green-700" },
          { label: "Inactive", count: brands.filter((b) => !b.isActive).length, color: "bg-red-100 text-red-700" },
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
              <TableHead>Brand</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : brands.length > 0 ? (
              brands.map((brand) => (
                <TableRow key={brand._id} className="hover:bg-muted/30">
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border">
                        {brand.image
                          ? <img src={brand.image} alt="" className="h-full w-full object-contain rounded-lg p-1" />
                          : <Tag className="h-5 w-5 text-gray-400" />
                        }
                      </div>
                      <span className="font-medium text-sm">{brand.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{brand.slug}</code>
                  </TableCell>
                  <TableCell className="text-sm text-center">{brand.displayOrder}</TableCell>
                  <TableCell>
                    <button onClick={() => handleToggleActive(brand._id)}>
                      {brand.isActive
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
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => { setEditItem(brand); setFormOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteItem(brand)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No brands yet</p>
                  <Button variant="outline" size="sm" className="mt-3"
                    onClick={() => { setEditItem(null); setFormOpen(true); }}>
                    Create your first brand
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <BrandFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null); }}
        editItem={editItem}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
      <DeleteConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        brand={deleteItem}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
