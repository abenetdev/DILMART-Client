import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  applyToBecomeSeller,
  getSellerStatus,
  clearSellerError,
} from "@/store/shop/seller-slice";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Store, CheckCircle, Clock, XCircle, ArrowRight, Loader2,
  ShieldCheck, TrendingUp, Package, Wallet,
} from "lucide-react";

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
        <Button variant="outline" onClick={() => navigate("/shop/home")}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center space-y-6 px-4">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Application Not Approved</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            Unfortunately your previous application was not approved.
            {application?.adminNote && (
              <span> Reason: <em>{application.adminNote}</em></span>
            )}
          </p>
        </div>
        {/* Allow reapply — show form below by returning null */}
      </div>
    );
  }

  return null;
}

// ── Benefit cards ─────────────────────────────────────────────────────────
const benefits = [
  { icon: Store,      title: "Your Own Storefront",     desc: "Get a branded store page customers can visit" },
  { icon: Package,    title: "Product Management",       desc: "Add, edit and manage unlimited products" },
  { icon: TrendingUp, title: "Sales Analytics",          desc: "Track revenue, orders and customer insights" },
  { icon: Wallet,     title: "Secure Payouts",           desc: "Withdraw earnings with flexible payout options" },
];

// ── Main Component ─────────────────────────────────────────────────────────
export default function BecomeASeller() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { toast }  = useToast();

  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const { isLoading, sellerStatus, application, error } =
    useSelector((s) => s.shopSeller);

  const [form, setForm] = useState({
    storeName:        "",
    storeDescription: "",
    phone:            "",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Load current seller status on mount
  useEffect(() => {
    if (isAuthenticated) dispatch(getSellerStatus());
  }, [dispatch, isAuthenticated]);

  // If already a vendor redirect to dashboard
  useEffect(() => {
    if (user?.role === "vendor") navigate("/vendor/dashboard", { replace: true });
  }, [user, navigate]);

  // Show toast on error
  useEffect(() => {
    if (error) {
      toast({ title: error, variant: "destructive" });
      dispatch(clearSellerError());
    }
  }, [error, toast, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate("/auth/login"); return; }
    const result = await dispatch(applyToBecomeSeller(form));
    if (result?.payload?.success) {
      toast({ title: "Application submitted!", description: result.payload.message });
    }
  };

  // ── Redirect unauthenticated ──────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 px-4 text-center">
        <Store className="h-14 w-14 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Start Selling Today</h1>
        <p className="text-muted-foreground max-w-sm">
          Create an account or log in to apply as a seller on MarketPlace.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/auth/login")}>Log In</Button>
          <Button variant="outline" onClick={() => navigate("/auth/register")}>Register</Button>
        </div>
      </div>
    );
  }

  // ── Pending state ─────────────────────────────────────────────────────────
  if (sellerStatus === "pending") {
    return <StatusBanner status="pending" application={application} />;
  }

  // ── Rejected — show banner then fall through to form below ─────────────────
  const showRejectedBanner = sellerStatus === "rejected";

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-[80vh] py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Rejected banner (above form) */}
        {showRejectedBanner && (
          <StatusBanner status="rejected" application={application} />
        )}

        {/* Hero */}
        <div className="text-center mb-12 mt-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-4">
            <ShieldCheck className="h-4 w-4" />
            Verified Seller Program
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            {showRejectedBanner ? "Reapply to Become a Seller" : "Become a Seller"}
          </h1>
          <p className="text-gray-500 mt-3 max-w-lg mx-auto text-sm leading-relaxed">
            Join thousands of vendors on MarketPlace. Set up your store, list
            your products, and start earning today.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">

          {/* Left — Benefits */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Why sell on MarketPlace?
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
              Fill in your store details and we'll review your application.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Store Name */}
              <div>
                <Label htmlFor="storeName">
                  Store Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="storeName"
                  value={form.storeName}
                  onChange={(e) => set("storeName", e.target.value)}
                  placeholder="e.g. Abenet Electronics"
                  required
                  className="mt-1"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="storeDescription">Store Description</Label>
                <Textarea
                  id="storeDescription"
                  value={form.storeDescription}
                  onChange={(e) => set("storeDescription", e.target.value)}
                  placeholder="Tell us about your products and what makes your store unique..."
                  rows={4}
                  className="mt-1 resize-none"
                />
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+251 9XX XXX XXX"
                  className="mt-1"
                />
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-gray-400">
                By submitting, you agree to our Seller Terms of Service. Your
                application will be reviewed within 24–48 hours.
              </p>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={isLoading || !form.storeName.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {isLoading ? "Submitting…" : "Submit Application"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
