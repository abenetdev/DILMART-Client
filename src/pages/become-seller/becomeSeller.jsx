import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  applyToBecomeSeller,
  getSellerStatus,
  clearSellerError,
} from "@/store/shop/seller-slice";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Store, CheckCircle, Clock, XCircle, ArrowRight, Loader2,
  ShieldCheck, TrendingUp, Package, Wallet, Upload, FileText,
  X as XIcon,
} from "lucide-react";

import { fetchAllActiveCategories } from "@/store/shop/category-slice";

// ── Status Banner ──────────────────────────────────────────────────────────
function StatusBanner({ status, application }) {
  const navigate = useNavigate();

  if (status === "pending") {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center space-y-6 px-4">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-yellow-50 flex items-center justify-center">
            <Clock className="h-10 w-10 text-yellow-500" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Application Under Review</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            Your seller application for <strong>{application?.storeName}</strong> has been
            submitted and is waiting for admin approval. We'll notify you once reviewed.
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 text-left">
          <p className="font-semibold mb-1">What happens next?</p>
          <ul className="space-y-1 list-disc list-inside text-yellow-700">
            <li>Our team reviews your application (usually within 24–48 hours)</li>
            <li>You'll continue to have full customer access in the meantime</li>
            <li>Once approved, you'll be redirected to your seller dashboard</li>
          </ul>
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="max-w-xl mx-auto mt-8 text-center space-y-4 px-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Previous Application Not Approved</h2>
          <p className="text-gray-500 mt-1 text-sm">
            {application?.adminNote
              ? <>Reason: <em>{application.adminNote}</em>. You may reapply below.</>
              : "You may reapply with updated information below."}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

// ── Benefit cards ─────────────────────────────────────────────────────────
const benefits = [
  { icon: Store,      title: "Your Own Storefront",   desc: "Get a branded store page customers can visit" },
  { icon: Package,    title: "Product Management",     desc: "Add, edit and manage unlimited products" },
  { icon: TrendingUp, title: "Sales Analytics",        desc: "Track revenue, orders and customer insights" },
  { icon: Wallet,     title: "Secure Payouts",         desc: "Withdraw earnings with flexible payout options" },
];

// ── File Upload Input ──────────────────────────────────────────────────────
function LicenceUpload({ file, onChange, error }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const selected = e.target.files?.[0] || null;
    onChange(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0] || null;
    onChange(dropped);
  };

  const handleDragOver = (e) => e.preventDefault();

  return (
    <div>
      <Label>
        Business Licence &amp; Registration{" "}
        <span className="text-red-500">*</span>
      </Label>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`mt-1 border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors
          ${error ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-primary/60 bg-gray-50 hover:bg-primary/5"}`}
      >
        {file ? (
          <div className="flex items-center gap-3 w-full">
            <FileText className="h-8 w-8 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
              <p className="text-xs text-gray-400">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); inputRef.current.value = ""; }}
              className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 font-medium">
              Click or drag & drop to upload
            </p>
            <p className="text-xs text-gray-400 mt-1">
              JPEG, PNG, WebP or PDF · Max 10 MB
            </p>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

// ── Email Option ───────────────────────────────────────────────────────────
function EmailOption({ currentEmail, emailOption, onOptionChange, anotherEmail, onAnotherEmailChange, error }) {
  return (
    <div className="space-y-2">
      <Label>
        Vendor Email <span className="text-red-500">*</span>
      </Label>
      <p className="text-xs text-gray-400">
        This email will be associated with your seller account after approval.
      </p>

      {/* Current email option */}
      <label className="flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
        <input
          type="radio"
          name="emailOption"
          value="current"
          checked={emailOption === "current"}
          onChange={() => onOptionChange("current")}
          className="accent-primary"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">Use Current Email</p>
          <p className="text-xs text-gray-400 truncate">{currentEmail}</p>
        </div>
        {emailOption === "current" && (
          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
        )}
      </label>

      {/* Another email option */}
      <label className="flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
        <input
          type="radio"
          name="emailOption"
          value="another"
          checked={emailOption === "another"}
          onChange={() => onOptionChange("another")}
          className="accent-primary"
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">Use Another Email</p>
          <p className="text-xs text-gray-400">Provide a different email for your vendor account</p>
        </div>
        {emailOption === "another" && (
          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
        )}
      </label>

      {emailOption === "another" && (
        <div className="mt-2">
          <Input
            type="email"
            placeholder="Enter vendor email address"
            value={anotherEmail}
            onChange={(e) => onAnotherEmailChange(e.target.value)}
            className={error ? "border-red-400 focus-visible:ring-red-400" : ""}
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function BecomeASeller() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { toast } = useToast();

  const { user, isAuthenticated }                           = useSelector((s) => s.auth);
  const { isLoading, sellerStatus, application, error }    = useSelector((s) => s.shopSeller);
  const { all: dbCategories }                              = useSelector((s) => s.shopCategory);

  // Fetch categories for the form
  useEffect(() => {
    if (dbCategories.length === 0) dispatch(fetchAllActiveCategories());
  }, [dispatch, dbCategories.length]);

  const [form, setForm] = useState({
    storeName:     "",
    storeLocation: "",
    category:      "other",
    phone:         "",
  });

  const [emailOption,   setEmailOption]   = useState("current"); // "current" | "another"
  const [anotherEmail,  setAnotherEmail]  = useState("");
  const [licenceFile,   setLicenceFile]   = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Field-level validation errors
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Load current seller status on mount
  useEffect(() => {
    if (isAuthenticated) dispatch(getSellerStatus());
  }, [dispatch, isAuthenticated]);

  // If already a vendor redirect to dashboard
  useEffect(() => {
    if (user?.role === "vendor") navigate("/vendor/dashboard", { replace: true });
  }, [user, navigate]);

  // Show toast on server error
  useEffect(() => {
    if (error) {
      toast({ title: error, variant: "destructive" });
      dispatch(clearSellerError());
    }
  }, [error, toast, dispatch]);

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};

    if (!form.storeName.trim())     errs.storeName     = "Store name is required";
    if (!form.storeLocation.trim()) errs.storeLocation = "Physical location is required";
    if (!form.phone.trim())         errs.phone         = "Phone number is required";
    if (!form.category)             errs.category      = "Please select a category";

    if (emailOption === "another") {
      if (!anotherEmail.trim()) {
        errs.anotherEmail = "Please enter an email address";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(anotherEmail.trim())) {
        errs.anotherEmail = "Please enter a valid email address";
      }
    }

    if (!licenceFile) errs.licenceFile = "Please upload your business licence / registration document";

    if (!termsAccepted) errs.terms = "You must agree to the Seller Terms before submitting";

    return errs;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate("/auth/login"); return; }

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Scroll to first error
      const firstErrKey = Object.keys(errs)[0];
      document.getElementById(firstErrKey)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});

    // Build FormData
    const fd = new FormData();
    fd.append("storeName",     form.storeName.trim());
    fd.append("storeLocation", form.storeLocation.trim());
    fd.append("category",      form.category);
    fd.append("phone",         form.phone.trim());
    fd.append("vendorEmail",   emailOption === "another" ? anotherEmail.trim() : "current");
    if (licenceFile) fd.append("licenceDocument", licenceFile);

    const result = await dispatch(applyToBecomeSeller(fd));
    if (result?.payload?.success) {
      toast({ title: "Application submitted!", description: result.payload.message });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ── Redirect unauthenticated ──────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 px-4 text-center">
        <Store className="h-14 w-14 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Start Selling Today</h1>
        <p className="text-muted-foreground max-w-sm">
          Create an account or log in to apply as a seller on DilMart.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/auth/login")}>Log In</Button>
          <Button variant="outline" onClick={() => navigate("/auth/register")}>Register</Button>
        </div>
      </div>
    );
  }

  // ── Already approved — role not yet synced (needs re-login) ─────────────
  if (sellerStatus === "active" && user?.role !== "vendor") {
    return (
      <div className="max-w-xl mx-auto mt-16 mb-5 text-center space-y-6 px-4">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <div className="">
          <h1 className="text-2xl font-bold text-gray-900">Application Approved!</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            Your seller application has been approved. Please log out and log back in
            to activate your vendor account.
          </p>
           </div>
        <Button onClick={() => navigate("/auth/login")}>Log out & Re-login</Button>
       
        </div>
      </div>
    );
  }

  // ── Already approved (role is vendor) ────────────────────────────────────
  if (user?.role === "vendor") {
    return null; // redirect handled by useEffect above
  }

  // ── Pending state ─────────────────────────────────────────────────────────
  if (sellerStatus === "pending") {
    return <StatusBanner status="pending" application={application} />;
  }

  const showRejectedBanner = sellerStatus === "rejected";

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-[80vh] py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Rejected banner */}
        {showRejectedBanner && (
          <StatusBanner status="rejected" application={application} />
        )}

        {/* Hero */}
        <div className="text-center mb-10 mt-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-4">
            <ShieldCheck className="h-4 w-4" />
            Verified Seller Program
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            {showRejectedBanner ? "Reapply to Become a Seller" : "Become a Seller"}
          </h1>
          <p className="text-gray-500 mt-3 max-w-lg mx-auto text-sm leading-relaxed">
            Join thousands of vendors on DilMart. Set up your store, list
            your products, and start earning today.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">

          {/* Left — Benefits */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Why sell on DilMart?
            </h2>
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 items-start bg-white rounded-xl border p-4 shadow-sm">
                <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right — Application Form */}
          <div className="bg-white rounded-2xl border shadow-sm p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Seller Application
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Fill in your details and we'll review your application within 24–48 hours.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>

              {/* Store Name */}
              <div>
                <Label htmlFor="storeName">
                  Store Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="storeName"
                  value={form.storeName}
                  onChange={(e) => set("storeName", e.target.value)}
                  placeholder="e.g. Xy Electronics"
                  className={`mt-1 ${errors.storeName ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
                {errors.storeName && (
                  <p className="text-xs text-red-500 mt-1">{errors.storeName}</p>
                )}
              </div>

              {/* Store Physical Location */}
              <div>
                <Label htmlFor="storeLocation">
                  Store Physical Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="storeLocation"
                  value={form.storeLocation}
                  onChange={(e) => set("storeLocation", e.target.value)}
                  placeholder="e.g. Bole, Addis Ababa"
                  className={`mt-1 ${errors.storeLocation ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
                {errors.storeLocation && (
                  <p className="text-xs text-red-500 mt-1">{errors.storeLocation}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => set("category", v)}
                >
                  <SelectTrigger
                    id="category"
                    className={`mt-1 ${errors.category ? "border-red-400 focus:ring-red-400" : ""}`}
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(dbCategories.length > 0 ? dbCategories : []).map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-xs text-red-500 mt-1">{errors.category}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+251 9XX XXX XXX"
                  className={`mt-1 ${errors.phone ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Email Option */}
              <div id="anotherEmail">
                <EmailOption
                  currentEmail={user?.email}
                  emailOption={emailOption}
                  onOptionChange={setEmailOption}
                  anotherEmail={anotherEmail}
                  onAnotherEmailChange={setAnotherEmail}
                  error={errors.anotherEmail}
                />
              </div>

              {/* Licence Upload */}
              <div id="licenceFile">
                <LicenceUpload
                  file={licenceFile}
                  onChange={setLicenceFile}
                  error={errors.licenceFile}
                />
              </div>

              {/* Seller Terms Checkbox */}
              <div id="terms" className="flex items-start gap-3 pt-1">
                <Checkbox
                  id="termsCheckbox"
                  checked={termsAccepted}
                  onCheckedChange={(v) => {
                    setTermsAccepted(!!v);
                    if (v) setErrors((prev) => ({ ...prev, terms: undefined }));
                  }}
                  className={errors.terms ? "border-red-500" : ""}
                />
                <div className="flex-1">
                  <label
                    htmlFor="termsCheckbox"
                    className="text-sm text-gray-700 cursor-pointer leading-snug"
                  >
                    I have read and agree to the{" "}
                    <Link
                      to="/terms"
                      target="_blank"
                      className="text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      Seller Terms &amp; Conditions
                    </Link>
                    . I confirm that all information provided is accurate and that I am
                    authorised to submit this application.
                  </label>
                  {errors.terms && (
                    <p className="text-xs text-red-500 mt-1">{errors.terms}</p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full gap-2 mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                ) : (
                  <><ArrowRight className="h-4 w-4" /> Submit Application</>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
