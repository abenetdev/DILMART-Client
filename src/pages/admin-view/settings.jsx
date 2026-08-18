import { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Settings,
  Percent,
  Save,
  History,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import {
  fetchCommissionSettings,
  updateCommissionSettings,
  clearSettingsError,
} from "@/store/admin/settings-slice";

// ── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        year:   "numeric",
        month:  "short",
        day:    "numeric",
        hour:   "2-digit",
        minute: "2-digit",
      })
    : "—";

function HistoryRow({ entry, isLast }) {
  const direction = entry.newRate > entry.previousRate ? "increased" : "decreased";
  return (
    <div className={`flex gap-3 text-sm ${!isLast ? "pb-4 border-b" : ""}`}>
      <div className="mt-0.5 shrink-0">
        <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center">
          <History className="h-3.5 w-3.5 text-slate-500" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-700">
          Rate{" "}
          <span className={direction === "increased" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
            {direction}
          </span>{" "}
          from{" "}
          <span className="font-medium">{entry.previousRate}%</span> to{" "}
          <span className="font-medium">{entry.newRate}%</span>
        </p>
        {entry.note && (
          <p className="text-slate-500 text-xs mt-0.5 truncate">{entry.note}</p>
        )}
        <p className="text-slate-400 text-xs mt-0.5">
          {entry.changedByName && (
            <span className="mr-1">by {entry.changedByName} ·</span>
          )}
          {formatDate(entry.changedAt)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <Badge variant="outline" className="text-xs font-mono">
          {entry.newRate}%
        </Badge>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminSettings() {
  const dispatch = useDispatch();
  const { toast }  = useToast();

  const {
    isLoading,
    isSaving,
    commissionRate,
    commissionHistory,
    updatedAt,
    error,
  } = useSelector((s) => s.adminSettings);

  // Local form state
  const [inputRate, setInputRate]   = useState("");
  const [inputNote, setInputNote]   = useState("");
  const [fieldError, setFieldError] = useState("");

  // ── Load settings on mount ────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchCommissionSettings());
  }, [dispatch]);

  // ── Sync form when store loads ────────────────────────────────────────────
  useEffect(() => {
    if (commissionRate !== null) {
      setInputRate(String(commissionRate));
    }
  }, [commissionRate]);

  // ── Clear redux error on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => dispatch(clearSettingsError());
  }, [dispatch]);

  // ── Client-side validation ────────────────────────────────────────────────
  function validate(value) {
    if (value === "" || value === null || value === undefined) {
      return "Commission rate is required";
    }
    const n = parseFloat(value);
    if (isNaN(n)) return "Must be a valid number";
    if (n < 0)    return "Cannot be negative";
    if (n > 100)  return "Cannot exceed 100%";
    return "";
  }

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputRate(val);
    setFieldError(validate(val));
  };

  // ── Save handler ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    const err = validate(inputRate);
    if (err) {
      setFieldError(err);
      return;
    }

    const result = await dispatch(
      updateCommissionSettings({
        commissionRate: parseFloat(parseFloat(inputRate).toFixed(2)),
        note:           inputNote.trim(),
      })
    );

    if (result?.payload?.success) {
      toast({
        title: "Settings saved",
        description: result.payload.message,
      });
      setInputNote("");
    } else {
      toast({
        title:       "Failed to save",
        description: result?.payload?.message || "Something went wrong",
        variant:     "destructive",
      });
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const parsedInput      = parseFloat(inputRate);
  const hasChanged       = commissionRate !== null && !isNaN(parsedInput) && parsedInput !== commissionRate;
  const isInputInvalid   = fieldError !== "";
  const recentHistory    = [...(commissionHistory || [])].reverse().slice(0, 10);

  return (
    <Fragment>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-7 w-7 text-slate-600" />
          Platform Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage global platform configuration
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── Commission settings card (left, wider) ──────────────────── */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Percent className="h-4 w-4 text-blue-600" />
                Commission Rate
              </CardTitle>
              <CardDescription>
                This percentage is deducted from the vendor&apos;s eligible transaction
                amount as DilMart&apos;s platform commission. Changes apply to new
                transactions only — existing orders keep their original rate.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Loading skeleton */}
              {isLoading && (
                <div className="h-16 rounded-lg bg-slate-100 animate-pulse" />
              )}

              {!isLoading && (
                <>
                  {/* Current rate display */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div>
                      <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                        Current Commission Rate
                      </p>
                      <p className="text-3xl font-bold text-blue-700 mt-0.5">
                        {commissionRate !== null ? `${commissionRate}%` : "—"}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-600/10 flex items-center justify-center">
                      <Percent className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>

                  {/* Input */}
                  <div className="space-y-2">
                    <Label htmlFor="commissionRate" className="text-sm font-medium">
                      New Commission Rate
                    </Label>
                    <div className="relative flex items-center">
                      <Input
                        id="commissionRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={inputRate}
                        onChange={handleInputChange}
                        placeholder="e.g. 10"
                        className={`pr-10 font-mono text-lg ${
                          isInputInvalid
                            ? "border-red-400 focus-visible:ring-red-400"
                            : ""
                        }`}
                      />
                      <span className="absolute right-3 text-sm font-semibold text-slate-500 pointer-events-none">
                        %
                      </span>
                    </div>

                    {/* Inline validation */}
                    {isInputInvalid && (
                      <p className="flex items-center gap-1.5 text-xs text-red-600">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldError}
                      </p>
                    )}
                    {!isInputInvalid && hasChanged && (
                      <p className="flex items-center gap-1.5 text-xs text-amber-600">
                        <Info className="h-3.5 w-3.5 shrink-0" />
                        This will change the rate from {commissionRate}% to{" "}
                        {isNaN(parsedInput) ? "—" : parsedInput.toFixed(2)}%
                      </p>
                    )}
                    {!isInputInvalid && !hasChanged && commissionRate !== null && (
                      <p className="flex items-center gap-1.5 text-xs text-slate-400">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        Rate is currently set to {commissionRate}%
                      </p>
                    )}
                  </div>

                  {/* Optional note */}
                  <div className="space-y-2">
                    <Label htmlFor="changeNote" className="text-sm font-medium">
                      Change Note{" "}
                      <span className="text-slate-400 font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="changeNote"
                      type="text"
                      value={inputNote}
                      onChange={(e) => setInputNote(e.target.value)}
                      placeholder="e.g. Q3 rate adjustment"
                      maxLength={120}
                      className="text-sm"
                    />
                  </div>

                  {/* Redux error */}
                  {error && !isSaving && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Save button */}
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || isInputInvalid || inputRate === ""}
                    className="w-full gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving…" : "Save Changes"}
                  </Button>

                  {updatedAt && (
                    <p className="text-center text-xs text-slate-400">
                      Last updated: {formatDate(updatedAt)}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Example calculation card */}
          {commissionRate !== null && !isLoading && (
            <Card className="border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Example Calculation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order Amount</span>
                    <span className="font-mono font-medium">ETB 10,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      DilMart Commission ({commissionRate}%)
                    </span>
                    <span className="font-mono font-medium text-red-600">
                      − ETB {(10000 * commissionRate / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1.5 font-semibold">
                    <span>Vendor Receives</span>
                    <span className="font-mono text-green-700">
                      ETB {(10000 - 10000 * commissionRate / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Change history (right) ────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4 text-slate-500" />
                Change History
              </CardTitle>
              <CardDescription>
                Last 10 commission rate changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 rounded bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : recentHistory.length > 0 ? (
                <div className="space-y-4">
                  {recentHistory.map((entry, i) => (
                    <HistoryRow
                      key={i}
                      entry={entry}
                      isLast={i === recentHistory.length - 1}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <History className="h-10 w-10 text-slate-200" />
                  <p className="text-sm text-slate-400">No changes recorded yet</p>
                  <p className="text-xs text-slate-400">
                    Every commission rate update will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Fragment>
  );
}
