import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Save, Building2, Smartphone, CheckCircle2, Loader2, ChevronRight } from "lucide-react";
import { getPayoutSettings, updatePayoutSettings } from "@/store/vendor/wallet-slice";

// ── Ethiopian banks list ───────────────────────────────────────────────────
const ETHIOPIAN_BANKS = [
  "Commercial Bank of Ethiopia (CBE)",
  "Dashen Bank",
  "Bank of Abyssinia",
  "Awash Bank",
  "Oromia Bank",
  "Cooperative Bank of Oromia",
  "United Bank",
  "Nib International Bank",
  "Lion International Bank",
  "Zemen Bank",
  "Berhan Bank",
  "Abay Bank",
  "Addis International Bank",
  "Debub Global Bank",
  "Enat Bank",
  "Gadaa Bank",
  "Goh Betoch Bank",
  "Hijra Bank",
  "Shabelle Bank",
  "Sidama Bank",
  "ZamZam Bank",
];

// ── Method config ──────────────────────────────────────────────────────────
const METHODS = [
  {
    id: "bank",
    label: "Bank Transfer",
    description: "Receive funds directly to your bank account",
    icon: Building2,
    color: "blue",
  },
  {
    id: "telebirr",
    label: "Telebirr",
    description: "Fast payout via Ethio Telecom's Telebirr wallet",
    icon: Smartphone,
    color: "green",
  },
];

const COLOR_MAP = {
  blue: {
    active: "border-blue-500 bg-blue-50 ring-2 ring-blue-200",
    icon: "bg-blue-100 text-blue-600",
    check: "text-blue-600",
  },
  green: {
    active: "border-green-500 bg-green-50 ring-2 ring-green-200",
    icon: "bg-green-100 text-green-600",
    check: "text-green-600",
  },
};

export default function PayoutSettings() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { user } = useSelector((state) => state.auth);
  const { payoutSettings, isLoading } = useSelector((state) => state.vendorWallet);

  const [form, setForm] = useState({
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    telebirrName: "",
    telebirrNumber: "",
    preferredMethod: "bank",
  });

  const vendorId = user?._id || user?.id;

  // ── Load settings ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (vendorId) dispatch(getPayoutSettings(vendorId));
  }, [dispatch, vendorId]);

  // ── Sync settings into form ───────────────────────────────────────────────
  useEffect(() => {
    if (payoutSettings) {
      setForm((prev) => ({
        ...prev,
        ...payoutSettings,
        // map legacy "mobile_money" or "chapa" to our new values
        preferredMethod:
          payoutSettings.preferredMethod === "mobile_money" ||
          payoutSettings.preferredMethod === "chapa"
            ? "telebirr"
            : payoutSettings.preferredMethod || "bank",
        // map legacy telebirr fields from mobileMoneyNumber / chapaAccountName
        telebirrName:
          payoutSettings.telebirrName ||
          payoutSettings.chapaAccountName ||
          "",
        telebirrNumber:
          payoutSettings.telebirrNumber ||
          payoutSettings.mobileMoneyNumber ||
          payoutSettings.chapaAccountNumber ||
          "",
      }));
    }
  }, [payoutSettings]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = () => {
    dispatch(updatePayoutSettings({ ...form, vendorId }))
      .unwrap()
      .then(() => {
        toast({
          title: "Settings Saved!",
          description: "Your payout settings have been updated.",
        });
      })
      .catch((err) => {
        toast({
          title: "Save Failed",
          description: err?.message || "Something went wrong",
          variant: "destructive",
        });
      });
  };

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const isFormFilled = () => {
    if (form.preferredMethod === "bank") {
      return form.bankName && form.accountHolderName && form.accountNumber;
    }
    if (form.preferredMethod === "telebirr") {
      return form.telebirrName && form.telebirrNumber?.length === 10;
    }
    return false;
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading && !payoutSettings) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-2xl">

      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-bold">Payout Settings</h1>
        <p className="text-muted-foreground mt-0.5">
          Configure where you want to receive your earnings
        </p>
      </div>

      {/* ── Step 1: Choose method ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              1
            </span>
            <CardTitle className="text-base">Withdrawal Method</CardTitle>
          </div>
          <CardDescription>Select how you want to receive your payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {METHODS.map((method) => {
              const Icon = method.icon;
              const isActive = form.preferredMethod === method.id;
              const c = COLOR_MAP[method.color];
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => set("preferredMethod", method.id)}
                  className={`relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200 focus:outline-none ${
                    isActive ? c.active : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {/* Icon */}
                  <div className={`p-2 rounded-lg shrink-0 ${isActive ? c.icon : "bg-gray-100 text-gray-500"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold text-sm ${isActive ? "text-gray-900" : "text-gray-700"}`}>
                      {method.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {method.description}
                    </p>
                  </div>
                  {/* Check */}
                  {isActive && (
                    <CheckCircle2 className={`h-5 w-5 shrink-0 ${c.check}`} />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Step 2: Method-specific form ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              2
            </span>
            <CardTitle className="text-base">
              {form.preferredMethod === "bank" ? "Bank Account Details" : "Telebirr Account Details"}
            </CardTitle>
          </div>
          <CardDescription>
            {form.preferredMethod === "bank"
              ? "Enter your bank account information for receiving transfers"
              : "Enter your Telebirr wallet details"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">

          {/* ── Bank Transfer form ── */}
          {form.preferredMethod === "bank" && (
            <>
              {/* Bank name dropdown */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Bank Name <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.bankName}
                  onValueChange={(v) => set("bankName", v)}
                >
                  <SelectTrigger className="mt-0.5">
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {ETHIOPIAN_BANKS.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Account holder name */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Account Holder Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.accountHolderName}
                  onChange={(e) => set("accountHolderName", e.target.value)}
                  placeholder="Full name exactly as registered at the bank"
                  className="mt-0.5"
                />
              </div>

              {/* Account number */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Account Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.accountNumber}
                  onChange={(e) => set("accountNumber", e.target.value)}
                  placeholder="e.g. 1000123456789"
                  className="mt-0.5 font-mono tracking-wide"
                />
                <p className="text-xs text-muted-foreground">
                  Double-check your account number — incorrect details may delay payouts.
                </p>
              </div>

              {/* Preview */}
              {form.bankName && form.accountHolderName && form.accountNumber && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-2">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Summary</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="font-medium text-gray-800">{form.bankName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium text-gray-800">{form.accountHolderName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Account</span>
                    <span className="font-mono font-semibold text-gray-800 tracking-wide">
                      {"•".repeat(Math.max(0, form.accountNumber.length - 4)) +
                        form.accountNumber.slice(-4)}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Telebirr form ── */}
          {form.preferredMethod === "telebirr" && (
            <>
              {/* Telebirr name */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Your Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.telebirrName}
                  onChange={(e) => set("telebirrName", e.target.value)}
                  placeholder="alemu kebede"
                  className="mt-0.5"
                />
              </div>

              {/* Telebirr phone */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.telebirrNumber}
                  onChange={(e) => {
                    // Only digits, max 10, must start with 0
                    let val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    if (val.length > 0 && val[0] !== "0") val = "0" + val.slice(0, 9);
                    set("telebirrNumber", val);
                  }}
                  placeholder="09XXXXXXXX"
                  className="font-mono tracking-wide"
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your 10-digit Telebirr phone number (e.g. 0912345678)
                </p>
              </div>

              {/* Preview */}
              {form.telebirrName && form.telebirrNumber && (
                <div className="rounded-xl border border-green-100 bg-green-50 p-4 space-y-2">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Summary</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium text-gray-800">{form.telebirrName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-mono font-semibold text-gray-800">
                      {form.telebirrNumber}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

        </CardContent>
      </Card>

      {/* ── Bottom save ── */}
      <div className="flex items-center justify-between pb-8">
        <p className="text-xs text-muted-foreground">
          <span className="text-red-500">*</span> Required fields
        </p>
        <Button
          onClick={handleSave}
          size="lg"
          className="gap-2"
          disabled={!isFormFilled()}
        >
          <Save className="h-4 w-4" />
          Save Payout Settings
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
