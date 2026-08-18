import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminBanners,
  createAdminBanner,
  updateAdminBanner,
  deleteAdminBanner,
  toggleAdminBanner,
  clearBannerError,
} from "@/store/admin/banner-slice";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Monitor,
  Smartphone,
  Eye,
  EyeOff,
  LayoutDashboard,
} from "lucide-react";

// ── Empty form default ────────────────────────────────────────────────────
const EMPTY_FORM = {
  title:      "",
  subtitle:   "",
  badge:      "",
  buttonText: "",
  buttonLink: "",
  order:      "0",
  isActive:   true,
};

// ── Image upload field ────────────────────────────────────────────────────
function ImageField({ label, icon: Icon, previewUrl, onChange, hint }) {
  const ref = useRef(null);
  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      <div
        onClick={() => ref.current?.click()}
        className="border-2 border-dashed rounded-xl p-3 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="preview"
            className="h-16 w-28 rounded-lg object-cover border shrink-0"
          />
        ) : (
          <div className="h-16 w-28 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <Icon className="h-6 w-6 text-gray-400" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-700">
            {previewUrl ? "Click to replace" : "Click to upload"}
          </p>
          {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
        </div>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
}

// ── Live preview ──────────────────────────────────────────────────────────
function BannerPreview({ form, desktopPreview, mobilePreview }) {
  const [viewMode, setViewMode] = useState("desktop");
  const imgSrc = viewMode === "mobile" && mobilePreview ? mobilePreview : desktopPreview;
  const hasContent = form.title || form.subtitle || form.badge || form.buttonText;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Live Preview</Label>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setViewMode("desktop")}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
              viewMode === "desktop"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Monitor className="h-3 w-3" /> Desktop
          </button>
          <button
            type="button"
            onClick={() => setViewMode("mobile")}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
              viewMode === "mobile"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Smartphone className="h-3 w-3" /> Mobile
          </button>
        </div>
      </div>

      <div
        className={`relative overflow-hidden rounded-xl bg-slate-800 ${
          viewMode === "mobile" ? "max-w-[240px] mx-auto" : "w-full"
        }`}
        style={{ aspectRatio: viewMode === "mobile" ? "9/16" : "16/5" }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
            <ImageIcon className="h-10 w-10 text-slate-500" />
          </div>
        )}

        {hasContent && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex items-center px-4 sm:px-6">
              <div className="max-w-xs">
                {form.badge && (
                  <span className="inline-block mb-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white border border-white/30">
                    {form.badge}
                  </span>
                )}
                {form.title && (
                  <p className="text-white font-bold text-sm sm:text-base leading-snug drop-shadow">
                    {form.title}
                  </p>
                )}
                {form.subtitle && (
                  <p className="text-white/80 text-[10px] sm:text-xs mt-1 leading-snug line-clamp-2">
                    {form.subtitle}
                  </p>
                )}
                {form.buttonText && (
                  <div className="mt-2">
                    <span className="inline-block bg-white text-gray-900 text-[10px] sm:text-xs font-semibold px-3 py-1 rounded-lg shadow">
                      {form.buttonText}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Banner Form Dialog ────────────────────────────────────────────────────
function BannerFormDialog({ open, onClose, editItem, isSubmitting, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [desktopFile, setDesktopFile]       = useState(null);
  const [mobileFile, setMobileFile]         = useState(null);
  const [desktopPreview, setDesktopPreview] = useState("");
  const [mobilePreview, setMobilePreview]   = useState("");

  // Populate when editing
  useEffect(() => {
    if (editItem) {
      setForm({
        title:      editItem.title      || "",
        subtitle:   editItem.subtitle   || "",
        badge:      editItem.badge      || "",
        buttonText: editItem.buttonText || "",
        buttonLink: editItem.buttonLink || "",
        order:      String(editItem.order ?? 0),
        isActive:   editItem.isActive !== false,
      });
      setDesktopPreview(editItem.desktopImage || "");
      setMobilePreview(editItem.mobileImage   || "");
    } else {
      setForm(EMPTY_FORM);
      setDesktopPreview("");
      setMobilePreview("");
    }
    setDesktopFile(null);
    setMobileFile(null);
  }, [editItem, open]);

  function handleDesktopFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setDesktopFile(f);
    setDesktopPreview(URL.createObjectURL(f));
  }

  function handleMobileFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setMobileFile(f);
    setMobilePreview(URL.createObjectURL(f));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Require desktop image when creating
    if (!editItem && !desktopFile) {
      alert("Please upload a desktop image.");
      return;
    }
    const fd = new FormData();
    fd.append("title",      form.title);
    fd.append("subtitle",   form.subtitle);
    fd.append("badge",      form.badge);
    fd.append("buttonText", form.buttonText);
    fd.append("buttonLink", form.buttonLink);
    fd.append("order",      form.order);
    fd.append("isActive",   String(form.isActive));
    if (desktopFile) fd.append("desktopImage", desktopFile);
    if (mobileFile)  fd.append("mobileImage",  mobileFile);
    onSubmit(fd);
  }

  const set = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editItem ? "Edit Banner" : "New Banner"}</DialogTitle>
          <DialogDescription>
            {editItem
              ? "Update the banner details below."
              : "Upload images and fill in the content to create a new banner."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* ── Images ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImageField
              label={
                <span>
                  Desktop Image{" "}
                  {!editItem && <span className="text-red-500">*</span>}
                </span>
              }
              icon={Monitor}
              previewUrl={desktopPreview}
              onChange={handleDesktopFile}
              hint="Recommended: 1440×500px · JPG/PNG/WebP"
            />
            <ImageField
              label="Mobile Image (optional)"
              icon={Smartphone}
              previewUrl={mobilePreview}
              onChange={handleMobileFile}
              hint="Recommended: 768×500px · Falls back to desktop"
            />
          </div>

          {/* ── Live Preview ─────────────────────────────────────── */}
          <BannerPreview
            form={form}
            desktopPreview={desktopPreview}
            mobilePreview={mobilePreview}
          />

          {/* ── Text Content ─────────────────────────────────────── */}
          <div className="border rounded-xl p-4 space-y-3 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Text Content (all optional)
            </p>

            <div>
              <Label htmlFor="bn-badge">Badge / Label</Label>
              <Input
                id="bn-badge"
                value={form.badge}
                onChange={set("badge")}
                placeholder="e.g. New Collection"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="bn-title">Title</Label>
              <Input
                id="bn-title"
                value={form.title}
                onChange={set("title")}
                placeholder="e.g. Summer Sale — Up to 50% Off"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="bn-subtitle">Subtitle / Description</Label>
              <Input
                id="bn-subtitle"
                value={form.subtitle}
                onChange={set("subtitle")}
                placeholder="e.g. Shop the latest trends from top brands"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="bn-btntext">Button Text</Label>
                <Input
                  id="bn-btntext"
                  value={form.buttonText}
                  onChange={set("buttonText")}
                  placeholder="e.g. Shop Now"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bn-btnlink">Button Link</Label>
                <Input
                  id="bn-btnlink"
                  value={form.buttonLink}
                  onChange={set("buttonLink")}
                  placeholder="e.g. /listing or /super-deals"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* ── Settings ─────────────────────────────────────────── */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Label htmlFor="bn-order" className="whitespace-nowrap">
                Display Order
              </Label>
              <Input
                id="bn-order"
                type="number"
                min="0"
                value={form.order}
                onChange={set("order")}
                className="w-20"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={form.isActive}
                onCheckedChange={(v) =>
                  setForm((p) => ({ ...p, isActive: !!v }))
                }
              />
              <span className="text-sm">Active (visible on homepage)</span>
            </label>
          </div>

          {/* ── Actions ──────────────────────────────────────────── */}
          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              className="flex-1 gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {editItem ? "Save Changes" : "Create Banner"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete confirm ────────────────────────────────────────────────────────
function DeleteConfirmDialog({ open, onClose, onConfirm, banner, isSubmitting }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Banner?</DialogTitle>
          <DialogDescription>
            This will permanently delete{" "}
            <strong>{banner?.title || "this banner"}</strong> and remove its
            images from storage. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 pt-2">
          <Button
            variant="destructive"
            className="flex-1"
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Delete"
            )}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function AdminBanners() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { banners, isLoading, isSubmitting, error } = useSelector(
    (s) => s.adminBanner
  );

  const [formOpen, setFormOpen]     = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminBanners());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ title: error, variant: "destructive" });
      dispatch(clearBannerError());
    }
  }, [error, toast, dispatch]);

  const openCreate = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const openEdit = (banner) => {
    setEditItem(banner);
    setFormOpen(true);
  };

  const handleSubmit = async (fd) => {
    let result;
    if (editItem) {
      result = await dispatch(
        updateAdminBanner({ id: editItem._id, formData: fd })
      );
    } else {
      result = await dispatch(createAdminBanner(fd));
    }
    if (result?.payload?.success) {
      toast({ title: editItem ? "Banner updated" : "Banner created" });
      setFormOpen(false);
      setEditItem(null);
    }
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteAdminBanner(deleteItem._id));
    if (result?.payload?.success) {
      toast({ title: "Banner deleted" });
      setDeleteItem(null);
    }
  };

  const handleToggle = async (id) => {
    const result = await dispatch(toggleAdminBanner(id));
    if (result?.payload?.success) {
      toast({ title: result.payload.data.isActive ? "Banner enabled" : "Banner disabled" });
    }
  };

  const activeCount   = banners.filter((b) => b.isActive).length;
  const inactiveCount = banners.length - activeCount;

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            Banner Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and manage homepage carousel banners
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Banner
        </Button>
      </div>

      {/* ── Summary chips ────────────────────────────────────────────── */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Total",    count: banners.length,  color: "bg-gray-100 text-gray-700" },
          { label: "Active",   count: activeCount,     color: "bg-green-100 text-green-700" },
          { label: "Inactive", count: inactiveCount,   color: "bg-red-100 text-red-700" },
        ].map(({ label, count, color }) => (
          <div
            key={label}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${color}`}
          >
            {label}: {count}
          </div>
        ))}
      </div>

      {/* ── Banner Table ─────────────────────────────────────────────── */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Preview</TableHead>
              <TableHead>Title / Content</TableHead>
              <TableHead className="w-[80px] text-center">Order</TableHead>
              <TableHead className="w-[100px] text-center">Status</TableHead>
              <TableHead className="w-[110px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : banners.length > 0 ? (
              banners.map((banner) => (
                <TableRow key={banner._id} className="hover:bg-muted/30">
                  {/* Preview thumbnail */}
                  <TableCell>
                    <div className="h-14 w-[100px] rounded-lg overflow-hidden bg-slate-100 border shrink-0">
                      {banner.desktopImage ? (
                        <img
                          src={banner.desktopImage}
                          alt={banner.title || "Banner"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Title / content summary */}
                  <TableCell>
                    <div className="space-y-0.5">
                      {banner.title ? (
                        <p className="font-medium text-sm text-gray-900 line-clamp-1">
                          {banner.title}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          Image-only banner
                        </p>
                      )}
                      {banner.subtitle && (
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {banner.subtitle}
                        </p>
                      )}
                      <div className="flex gap-1.5 flex-wrap pt-0.5">
                        {banner.badge && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full font-medium">
                            {banner.badge}
                          </span>
                        )}
                        {banner.buttonText && (
                          <span className="text-[10px] bg-gray-50 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded-full font-medium">
                            btn: {banner.buttonText}
                          </span>
                        )}
                        {banner.mobileImage && (
                          <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                            <Smartphone className="h-2.5 w-2.5" /> mobile img
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Order */}
                  <TableCell className="text-center text-sm font-mono text-gray-600">
                    {banner.order}
                  </TableCell>

                  {/* Status toggle */}
                  <TableCell className="text-center">
                    <button onClick={() => handleToggle(banner._id)}>
                      {banner.isActive ? (
                        <Badge className="bg-green-100 text-green-700 border-0 gap-1 cursor-pointer hover:bg-green-200">
                          <Eye className="h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-500 border-0 gap-1 cursor-pointer hover:bg-gray-200">
                          <EyeOff className="h-3 w-3" /> Hidden
                        </Badge>
                      )}
                    </button>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEdit(banner)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteItem(banner)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">
                    No banners yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create your first banner to get it showing on the homepage.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-2"
                    onClick={openCreate}
                  >
                    <Plus className="h-4 w-4" />
                    Create first banner
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Tip ──────────────────────────────────────────────────────── */}
      {banners.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Tip: Lower order number = shown first in the carousel. Toggle the
          status badge to instantly show or hide a banner without deleting it.
        </p>
      )}

      {/* ── Dialogs ──────────────────────────────────────────────────── */}
      <BannerFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditItem(null);
        }}
        editItem={editItem}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
      <DeleteConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        banner={deleteItem}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
