import { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  Store,
  Palette,
  Phone,
  Globe,
  FileText,
  Search,
  Eye,
  Save,
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Facebook,
  Instagram,
  Youtube,
  Link,
  LocateIcon,
  MapPin,
} from "lucide-react";
import {
  getStore,
  saveStore,
  createStore,
  checkSlugAvailability,
  uploadStoreImage,
  clearFieldErrors,
  clearSlugStatus,
} from "@/store/vendor/store-slice";

// ── Initial form state ─────────────────────────────────────────────────────

const initialForm = {
  storeName: "",
  slug: "",
  description: "",
  businessCategory: "other",
  status: "active",
  logo: "",
  banner: "",
  primaryColor: "#2563EB",
  secondaryColor: "#1E40AF",
  alternativePhone: "",
  address: "",
  city: "",
  region: "",
  country: "",
  aboutUs: "",
  returnPolicy: "",
  shippingPolicy: "",
  privacyPolicy: "",
};

// ── Field Error component ──────────────────────────────────────────────────

function FieldError({ error }) {
  if (!error) return null;
  return (
    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3" />
      {error}
    </p>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

// ── Image Upload Button ────────────────────────────────────────────────────

function ImageUploader({ label, value, onUpload, hint, isLoading }) {
  const inputRef = useRef(null);

  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <div className="flex gap-3 items-start">
        {/* Preview */}
        <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted overflow-hidden flex items-center justify-center bg-muted flex-shrink-0">
          {value ? (
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => inputRef.current?.click()}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {value ? "Replace Image" : "Upload Image"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) onUpload(e.target.files[0]);
            }}
          />
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          {value && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Image uploaded
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function StoreSettings() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { store, isLoading, isSaving, fieldErrors, slugStatus } = useSelector(
    (state) => state.vendorStore
  );
  const { user } = useSelector((state) => state.auth);

  const [form, setForm] = useState(initialForm);
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);

  const slugTimerRef = useRef(null);
  const isNew = !store;

  // ── Load store on mount ──────────────────────────────────────────────────

  useEffect(() => {
    dispatch(getStore(user?._id || user?.id));
  }, [dispatch, user]);

  // ── Sync store data into form ────────────────────────────────────────────

  useEffect(() => {
    if (store) {
      setForm((prev) => ({ ...prev, ...store }));
    }
  }, [store]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const set = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) dispatch(clearFieldErrors());
  }, [fieldErrors, dispatch]);

  // ── Slug: auto-generate from store name ──────────────────────────────────

  const handleStoreNameChange = (value) => {
    set("storeName", value);
    if (isNew) {
      const autoSlug = value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-");
      set("slug", autoSlug);
    }
  };

  // ── Slug: debounced availability check ───────────────────────────────────

  const handleSlugChange = (value) => {
    set("slug", value);
    dispatch(clearSlugStatus());

    if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
    if (!value) return;

    setSlugChecking(true);
    slugTimerRef.current = setTimeout(() => {
      dispatch(
        checkSlugAvailability({
          slug: value,
          ownerId: user?._id || user?.id,
        })
      ).finally(() => setSlugChecking(false));
    }, 600);
  };

  // ── Image upload ─────────────────────────────────────────────────────────

  const handleLogoUpload = async (file) => {
    setLogoUploading(true);
    const result = await dispatch(uploadStoreImage(file));
    setLogoUploading(false);
    if (result?.payload?.success) {
      set("logo", result.payload.result.url);
    } else {
      toast({ title: "Logo upload failed", variant: "destructive" });
    }
  };

  const handleBannerUpload = async (file) => {
    setBannerUploading(true);
    const result = await dispatch(uploadStoreImage(file));
    setBannerUploading(false);
    if (result?.payload?.success) {
      set("banner", result.payload.result.url);
    } else {
      toast({ title: "Banner upload failed", variant: "destructive" });
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const payload = {
      ...form,
      ownerId: user?._id || user?.id,
    };

    const action = isNew ? createStore(payload) : saveStore(payload);
    const result = await dispatch(action);

    if (result?.payload?.success) {
      toast({
        title: isNew ? "Store created!" : "Settings saved!",
        description: isNew
          ? "Your store is live."
          : "All changes have been saved.",
      });
    } else {
      toast({
        title: "Save failed",
        description: result?.payload?.message || "Please check the errors below",
        variant: "destructive",
      });
    }
  };

  // ── Slug indicator ────────────────────────────────────────────────────────

  const SlugIndicator = () => {
    if (slugChecking) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (!form.slug) return null;
    if (!slugStatus) return null;
    if (slugStatus.available)
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  // ── Loading state ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading store settings...</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-6">
      {/* ── Left: Form Sections ─────────────────────────────────────────────── */}
      <div className="flex-1 space-y-6 min-w-0">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Store Settings</h1>
            <p className="text-muted-foreground">
              Manage your store profile, branding, and policies
            </p>
          </div>
          {/* <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? "Saving..." : isNew ? "Create Store" : "Save Changes"}
          </Button> */}
        </div>

        {/* ── 1. Store Information ──────────────────────────────────────────── */}
        <SectionCard
          icon={Store}
          title="Store Information"
          description="Basic information about your store that customers will see"
        >
          {/* Store Name */}
          <div>
            <Label>
              Store Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.storeName}
              onChange={(e) => handleStoreNameChange(e.target.value)}
              placeholder="e.g. Abenet Shop"
              maxLength={100}
              className="mt-1"
            />
            <div className="flex justify-between mt-1">
              <FieldError error={fieldErrors.storeName} />
              <span className="text-xs text-muted-foreground ml-auto">
                {form.storeName.length}/100
              </span>
            </div>
          </div>

          {/* Store Slug */}
          <div>
            <Label>
              Store Slug <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                /store/
              </span>
              <div className="relative flex-1">
                <Input
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value.toLowerCase())}
                  placeholder="my-store"
                  className="pr-8"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <SlugIndicator />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lowercase letters, numbers, hyphens only
            </p>
            {slugStatus && (
              <p
                className={`text-xs mt-1 flex items-center gap-1 ${
                  slugStatus.available ? "text-green-600" : "text-red-500"
                }`}
              >
                {slugStatus.available ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {slugStatus.message}
              </p>
            )}
            <FieldError error={fieldErrors.slug} />
          </div>

          {/* Description */}
          <div>
            <Label>Store Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Tell customers what your store is about..."
              rows={4}
              maxLength={1000}
              className="mt-1 resize-none"
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-muted-foreground">
                {form.description.length}/1000
              </span>
            </div>
          </div>

          {/* Business Category & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Business Category</Label>
              <Select
                value={form.businessCategory}
                onValueChange={(v) => set("businessCategory", v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fashion">Fashion</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="beauty">Beauty</SelectItem>
                  <SelectItem value="home-living">Home & Living</SelectItem>
                  <SelectItem value="automotive">Automotive</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="food-beverage">Food & Beverage</SelectItem>
                  <SelectItem value="health-wellness">Health & Wellness</SelectItem>
                  <SelectItem value="books">Books</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Store Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Active
                    </span>
                  </SelectItem>
                  <SelectItem value="temporarily-closed">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-yellow-500" />
                      Temporarily Closed
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SectionCard>

        {/* ── 2. Branding ───────────────────────────────────────────────────── */}
        <SectionCard
          icon={Palette}
          title="Branding"
          description="Customize your store's visual identity"
        >
          <div className="grid grid-cols-2 gap-6">
            <ImageUploader
              label="Store Logo"
              value={form.logo}
              onUpload={handleLogoUpload}
              isLoading={logoUploading}
              hint="Recommended: 200×200px, PNG or SVG"
            />
            <ImageUploader
              label="Store Banner"
              value={form.banner}
              onUpload={handleBannerUpload}
              isLoading={bannerUploading}
              hint="Recommended: 1200×400px, JPG or PNG"
            />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Primary Brand Color</Label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={form.primaryColor}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  placeholder="#2563EB"
                  maxLength={7}
                  className="font-mono uppercase"
                />
              </div>
              <FieldError error={fieldErrors.primaryColor} />
            </div>
            <div>
              <Label>Secondary Brand Color</Label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="color"
                  value={form.secondaryColor}
                  onChange={(e) => set("secondaryColor", e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={form.secondaryColor}
                  onChange={(e) => set("secondaryColor", e.target.value)}
                  placeholder="#1E40AF"
                  maxLength={7}
                  className="font-mono uppercase"
                />
              </div>
              <FieldError error={fieldErrors.secondaryColor} />
            </div>
          </div>
        </SectionCard>

        {/* ── 3. Contact Information ────────────────────────────────────────── */}
        <SectionCard
          icon={MapPin}
          title="Address Information"
          description="Where your customer's can get you"
        >
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="New York"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Region / State</Label>
              <Input
                value={form.region}
                onChange={(e) => set("region", e.target.value)}
                placeholder="NY"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Country</Label>
              <Input
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                placeholder="United States"
                className="mt-1"
              />
            </div>
          </div>
        </SectionCard>

        {/* ── 4. Social Media ───────────────────────────────────────────────── */}
        {/* <SectionCard
          icon={Globe}
          title="Social Media"
          description="Connect your social media accounts to your store"
        >
          {[
            { field: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage", Icon: Facebook },
            { field: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourhandle", Icon: Instagram },
            { field: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yourhandle", Icon: Link },
            { field: "telegram", label: "Telegram", placeholder: "https://t.me/yourchannel", Icon: Link },
            { field: "youtube", label: "YouTube", placeholder: "https://youtube.com/yourchannel", Icon: Youtube },
            { field: "website", label: "Website", placeholder: "https://yourwebsite.com", Icon: Globe },
          ].map(({ field, label, placeholder, Icon: IconComp }) => (
            <div key={field}>
              <Label>{label}</Label>
              <div className="relative mt-1">
                <IconComp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={form[field]}
                  onChange={(e) => set(field, e.target.value)}
                  placeholder={placeholder}
                  className="pl-10"
                />
              </div>
              <FieldError error={fieldErrors[field]} />
            </div>
          ))}
        </SectionCard> */}

        {/* ── 5. Store Policies ─────────────────────────────────────────────── */}
        <SectionCard
          icon={FileText}
          title="Store Policies"
          description="Important policies that protect you and your customers"
        >
          {[
            {
              field: "aboutUs",
              label: "About Us",
              placeholder: "Tell the story of your store...",
            },
            {
              field: "returnPolicy",
              label: "Return Policy",
              placeholder: "Describe your return and refund policy...",
            },
            {
              field: "shippingPolicy",
              label: "Shipping Policy",
              placeholder: "Describe your shipping methods and timelines...",
            },
            {
              field: "privacyPolicy",
              label: "Privacy Policy",
              placeholder: "Describe how you handle customer data...",
            },
          ].map(({ field, label, placeholder }) => (
            <div key={field}>
              <Label>{label}</Label>
              <Textarea
                value={form[field]}
                onChange={(e) => set(field, e.target.value)}
                placeholder={placeholder}
                rows={5}
                className="mt-1 resize-none"
              />
            </div>
          ))}
        </SectionCard>

        {/* ── 6. SEO Settings ───────────────────────────────────────────────── */}
        {/* <SectionCard
          icon={Search}
          title="SEO Settings"
          description="Optimize your store for search engines"
        >
          <div>
            <Label>SEO Title</Label>
            <Input
              value={form.seoTitle}
              onChange={(e) => set("seoTitle", e.target.value)}
              placeholder="My Store – Best Products Online"
              maxLength={70}
              className="mt-1"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                Appears in browser tabs and search results
              </p>
              <span
                className={`text-xs ${form.seoTitle.length > 60 ? "text-orange-500" : "text-muted-foreground"}`}
              >
                {form.seoTitle.length}/70
              </span>
            </div>
            <FieldError error={fieldErrors.seoTitle} />
          </div>

          <div>
            <Label>Meta Description</Label>
            <Textarea
              value={form.seoDescription}
              onChange={(e) => set("seoDescription", e.target.value)}
              placeholder="A short description that appears in search results..."
              rows={3}
              maxLength={160}
              className="mt-1 resize-none"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                Recommended: 120–160 characters
              </p>
              <span
                className={`text-xs ${form.seoDescription.length > 140 ? "text-orange-500" : "text-muted-foreground"}`}
              >
                {form.seoDescription.length}/160
              </span>
            </div>
            <FieldError error={fieldErrors.seoDescription} />
          </div>

          <div>
            <Label>Keywords</Label>
            <Input
              value={form.seoKeywords}
              onChange={(e) => set("seoKeywords", e.target.value)}
              placeholder="fashion, clothing, shoes, accessories"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Comma-separated keywords
            </p>
          </div>
        </SectionCard> */}

        {/* Bottom Save Button */}
        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} disabled={isSaving} size="lg" className="gap-2">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? "Saving..." : isNew ? "Create Store" : "Save All Changes"}
          </Button>
        </div>
      </div>

      {/* ── Right: Live Preview ──────────────────────────────────────────────── */}
      <div className="w-80 flex-shrink-0">
        <div className="sticky top-6">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4" />
                Live Preview
              </CardTitle>
              <CardDescription className="text-xs">
                Updates as you type
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Banner */}
              <div
                className="h-24 w-full flex items-center justify-center relative overflow-hidden"
                style={{
                  background: form.banner
                    ? undefined
                    : `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})`,
                }}
              >
                {form.banner ? (
                  <img
                    src={form.banner}
                    alt="Banner"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xs opacity-60">Store Banner</span>
                )}
              </div>

              {/* Store Info */}
              <div className="p-4 space-y-3">
                {/* Logo + Name Row */}
                <div className="flex items-center gap-3 -mt-3">
                  <div
                    className="h-14 w-14 rounded-xl border-4 border-white shadow overflow-hidden flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: form.primaryColor }}
                  >
                    {form.logo ? (
                      <img
                        src={form.logo}
                        alt="Logo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-lg">
                        {form.storeName?.[0]?.toUpperCase() || "S"}
                      </span>
                    )}
                  </div>
                  <div className="mt-8">
                    <h3 className="font-bold text-sm leading-tight">
                      {form.storeName || "Your Store Name"}
                    </h3>
                    {form.status === "temporarily-closed" && (
                      <Badge variant="secondary" className="text-xs mt-0.5">
                        Temporarily Closed
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Category + Status */}
                <div className="flex items-center gap-2 flex-wrap">
                  {form.businessCategory && (
                    <Badge
                      variant="outline"
                      className="text-xs capitalize"
                      style={{ borderColor: form.primaryColor, color: form.primaryColor }}
                    >
                      {form.businessCategory.replace("-", " ")}
                    </Badge>
                  )}
                  <Badge
                    className="text-xs"
                    style={{ backgroundColor: form.status === "active" ? "#22c55e" : "#f59e0b" }}
                  >
                    {form.status === "active" ? "Active" : "Closed"}
                  </Badge>
                </div>

                {/* Description */}
                {form.description && (
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {form.description}
                  </p>
                )}

                <Separator />

                {/* Contact */}
                  <div className="space-y-1">
                    {form.city && (
                      <p className="text-xs text-muted-foreground">
                        📍 {[form.city, form.region, form.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                {/* Brand Colors */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Brand Colors</p>
                  <div className="flex gap-2">
                    <div
                      className="h-6 w-14 rounded"
                      style={{ backgroundColor: form.primaryColor }}
                      title={form.primaryColor}
                    />
                    <div
                      className="h-6 w-14 rounded"
                      style={{ backgroundColor: form.secondaryColor }}
                      title={form.secondaryColor}
                    />
                  </div>
                </div>

                {/* Social links */}

                {/* Store URL */}
                {form.slug && (
                  <div
                    className="rounded-lg p-2 text-xs font-mono"
                    style={{ backgroundColor: form.primaryColor + "15", color: form.primaryColor }}
                  >
                    /store/{form.slug}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
