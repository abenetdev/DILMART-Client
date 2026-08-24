import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchVendorReturns, fetchVendorReturnById,
  approveVendorReturn, rejectVendorReturn,
  confirmReturnReceived, submitInspectionResult,
  clearReturnDetail,
} from "@/store/vendor/return-slice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Eye, RotateCcw } from "lucide-react";
import ReturnStatusBadge from "@/components/common/return-status-badge";
import ReturnTimeline from "@/components/common/return-timeline";
import { currencyFormatter } from "@/utils";

const STATUS_FILTERS = [
  { value: "all",              label: "All" },
  { value: "vendor_reviewing", label: "Needs Review" },
  { value: "approved",         label: "Approved" },
  { value: "return_shipped",   label: "Return Shipped" },
  { value: "under_inspection", label: "Under Inspection" },
  { value: "rejected",         label: "Rejected" },
  { value: "refunded",         label: "Refunded" },
  { value: "completed",        label: "Completed" },
];

// ── Order ID resolution helper ─────────────────────────────────────────────
// The backend injects `orderId.isMultiVendor = true` only when the sub-order
// belongs to a checkout with 2+ vendors. We use that flag — not the mere
// presence of parentOrderId — to decide whether to show the Group ID.
function resolveOrderDisplay(orderId) {
  if (!orderId) return { primary: "—", group: null };
  const primary = orderId.vendorOrderId || `ORD-${orderId._id?.toString().slice(-8).toUpperCase()}`;
  const group   = orderId.isMultiVendor ? (orderId.parentOrderId || null) : null;
  return { primary, group };
}

// ── Mobile return card ─────────────────────────────────────────────────────
function ReturnCard({ r, onView }) {
  const { primary, group } = resolveOrderDisplay(r.orderId);
  return (
    <div className="bg-background border rounded-xl p-3 space-y-3">
      {/* Top row: order ID + status + view button */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold">{primary}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {r.customerId?.userName || "—"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ReturnStatusBadge status={r.status} />
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => onView(r._id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <div>
          <span className="text-xs text-muted-foreground block">Reason</span>
          <span className="capitalize">{r.reason?.replace(/_/g, " ") || "—"}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block">Amount</span>
          <span className="font-semibold">{currencyFormatter(r.requestedAmount)}</span>
        </div>
        <div className="col-span-2">
          <span className="text-xs text-muted-foreground block">Date</span>
          <span className="text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

// ── Mobile skeleton ────────────────────────────────────────────────────────
function ReturnCardSkeleton() {
  return (
    <div className="bg-background border rounded-xl p-3 space-y-3 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
        <div className="h-6 w-24 bg-muted rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-8 bg-muted rounded" />
        <div className="h-8 bg-muted rounded" />
        <div className="col-span-2 h-6 bg-muted rounded" />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function VendorReturnRequestsTab() {
  const dispatch   = useDispatch();
  const { toast }  = useToast();
  const { list, current, isLoading, isSubmitting } = useSelector((s) => s.vendorReturn);

  const [statusFilter,   setStatusFilter]   = useState("all");
  const [search,         setSearch]         = useState("");
  const [openDetail,     setOpenDetail]     = useState(false);
  const [rejectReason,   setRejectReason]   = useState("");
  const [rejectOpen,     setRejectOpen]     = useState(false);
  const [inspectResult,  setInspectResult]  = useState("");
  const [inspectNote,    setInspectNote]    = useState("");
  const [inspectOpen,    setInspectOpen]    = useState(false);

  useEffect(() => {
    dispatch(fetchVendorReturns(statusFilter !== "all" ? { status: statusFilter } : {}));
  }, [dispatch, statusFilter]);

  function openRequestDetail(id) {
    dispatch(fetchVendorReturnById(id));
    setOpenDetail(true);
  }

  function closeDetail() {
    setOpenDetail(false);
    dispatch(clearReturnDetail());
    setRejectReason("");
    setInspectResult("");
    setInspectNote("");
  }

  async function handleApprove() {
    const result = await dispatch(approveVendorReturn({ id: current._id }));
    if (result?.payload?.success) toast({ title: "Return request approved." });
    else toast({ title: result?.payload?.message || "Error", variant: "destructive" });
  }

  async function handleReject() {
    if (!rejectReason.trim()) { toast({ title: "Reason required.", variant: "destructive" }); return; }
    const result = await dispatch(rejectVendorReturn({ id: current._id, reason: rejectReason }));
    if (result?.payload?.success) { toast({ title: "Return request rejected." }); setRejectOpen(false); }
    else toast({ title: result?.payload?.message || "Error", variant: "destructive" });
  }

  async function handleConfirmReceived() {
    const result = await dispatch(confirmReturnReceived({ id: current._id }));
    if (result?.payload?.success) toast({ title: "Return marked as received & under inspection." });
    else toast({ title: result?.payload?.message || "Error", variant: "destructive" });
  }

  async function handleInspection() {
    if (!inspectResult) { toast({ title: "Select a result.", variant: "destructive" }); return; }
    const result = await dispatch(submitInspectionResult({ id: current._id, result: inspectResult, note: inspectNote }));
    if (result?.payload?.success) { toast({ title: "Inspection result submitted." }); setInspectOpen(false); }
    else toast({ title: result?.payload?.message || "Error", variant: "destructive" });
  }

  const filtered = list.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.orderId?._id?.toString().includes(s) ||
      r.customerId?.userName?.toLowerCase().includes(s) ||
      r.reason?.includes(s)
    );
  });

  return (
    <div className="space-y-4">
      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Input
            placeholder="Search by order / customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Loading / empty ───────────────────────────────────────────── */}
      {isLoading ? (
        <>
          {/* Mobile skeletons */}
          <div className="md:hidden space-y-3">
            <ReturnCardSkeleton />
            <ReturnCardSkeleton />
            <ReturnCardSkeleton />
          </div>
          {/* Tablet / Desktop spinner */}
          <div className="hidden md:flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 border rounded-xl">
          <RotateCcw className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No return requests found.</p>
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════════
              MOBILE — return cards  (below md)
          ═══════════════════════════════════════════════════════════ */}
          <div className="md:hidden space-y-3">
            {filtered.map((r) => (
              <ReturnCard key={r._id} r={r} onView={openRequestDetail} />
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════════════
              TABLET — simplified table  (md → xl)
          ═══════════════════════════════════════════════════════════ */}
          <div className="hidden md:block xl:hidden rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {["Order", "Customer", "Amount", "Status", "Date", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-slate-700 text-xs">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                    const { primary, group } = resolveOrderDisplay(r.orderId);
                    return (
                  <tr key={r._id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-semibold">{primary}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {r.reason?.replace(/_/g, " ")}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm">{r.customerId?.userName || "—"}</td>
                    <td className="px-4 py-3 font-medium text-sm">
                      {currencyFormatter(r.requestedAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <ReturnStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" onClick={() => openRequestDetail(r._id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              DESKTOP — full table  (xl+)
          ═══════════════════════════════════════════════════════════ */}
          <div className="hidden xl:block rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {["Order", "Customer", "Reason", "Amount", "Status", "Date", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-slate-700 text-xs">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                    const { primary, group } = resolveOrderDisplay(r.orderId);
                    return (
                  <tr key={r._id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-semibold">{primary}</p>
                    </td>
                    <td className="px-4 py-3">{r.customerId?.userName || "—"}</td>
                    <td className="px-4 py-3 capitalize text-xs">{r.reason?.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">{currencyFormatter(r.requestedAmount)}</td>
                    <td className="px-4 py-3"><ReturnStatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" onClick={() => openRequestDetail(r._id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Detail Dialog (unchanged) ──────────────────────────────────── */}
      <Dialog open={openDetail} onOpenChange={(o) => { if (!o) closeDetail(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Return Request Detail</DialogTitle>
          </DialogHeader>
          {!current ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              {/* Header row */}
              <div className="flex flex-wrap gap-3 items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Order ID</p>
                  <p className="font-mono font-semibold">
                    {current.orderId?.vendorOrderId
                      || `ORD-${current.orderId?._id?.toString().slice(-8).toUpperCase()}`}
                  </p>
                  {current.orderId?.isMultiVendor && current.orderId?.parentOrderId && (
                    <p className="font-mono text-xs text-muted-foreground mt-0.5">
                      Group: {current.orderId.parentOrderId}
                    </p>
                  )}
                </div>
                <ReturnStatusBadge status={current.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium">{current.customerId?.userName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reason</p>
                  <p className="font-medium capitalize">{current.reason?.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-medium">{currencyFormatter(current.requestedAmount)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Customer Description</p>
                <p className="text-sm rounded bg-slate-50 border px-3 py-2">{current.description}</p>
              </div>

              {/* Evidence */}
              {current.evidence?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Evidence</p>
                  <div className="flex flex-wrap gap-2">
                    {current.evidence.map((e, i) => (
                      <a
                        key={i}
                        href={e.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-20 w-20 rounded-lg overflow-hidden border bg-slate-100 hover:opacity-80"
                      >
                        {e.fileType === "image" || !e.fileType
                          ? <img src={e.fileUrl} alt="" className="h-full w-full object-cover" />
                          : <div className="h-full flex items-center justify-center text-xs text-muted-foreground">video</div>
                        }
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Vendor deadline */}
              {current.vendorResponseDeadline && current.status === "vendor_reviewing" && (
                <div className="rounded bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                  Respond by: <strong>{new Date(current.vendorResponseDeadline).toLocaleString()}</strong>
                </div>
              )}

              {/* Shipment info */}
              {current.shipment?.trackingNumber && (
                <div className="rounded bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800 space-y-0.5">
                  <p>Courier: <strong>{current.shipment.courier || "—"}</strong></p>
                  <p>Tracking: <strong>{current.shipment.trackingNumber}</strong></p>
                  {current.shipment.shippedAt && (
                    <p>Shipped: {new Date(current.shipment.shippedAt).toLocaleDateString()}</p>
                  )}
                </div>
              )}

              <Separator />

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {current.status === "vendor_reviewing" && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Approve"}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)} disabled={isSubmitting}>
                      Reject
                    </Button>
                  </>
                )}
                {current.status === "return_shipped" && (
                  <Button size="sm" onClick={handleConfirmReceived} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm Return Received"}
                  </Button>
                )}
                {current.status === "under_inspection" && (
                  <Button size="sm" onClick={() => setInspectOpen(true)} disabled={isSubmitting}>
                    Submit Inspection Result
                  </Button>
                )}
              </div>

              {/* Reject reason input (inline) */}
              {rejectOpen && (
                <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <Label className="text-sm text-red-800">Rejection Reason *</Label>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    placeholder="Explain why you are rejecting this request…"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" onClick={handleReject} disabled={isSubmitting}>
                      Confirm Reject
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              {/* Inspection result */}
              {inspectOpen && (
                <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <Label className="text-sm">Inspection Result *</Label>
                  <Select value={inspectResult} onValueChange={setInspectResult}>
                    <SelectTrigger className="h-9 text-sm bg-white">
                      <SelectValue placeholder="Select outcome…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="refund">Approve Refund</SelectItem>
                      <SelectItem value="rejected">Reject (item condition not acceptable)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={inspectNote}
                    onChange={(e) => setInspectNote(e.target.value)}
                    rows={2}
                    placeholder="Notes (optional)…"
                    className="bg-white"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleInspection} disabled={isSubmitting}>Submit</Button>
                    <Button size="sm" variant="ghost" onClick={() => setInspectOpen(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              <Separator />
              <div>
                <p className="font-semibold text-sm mb-3">Timeline</p>
                <ReturnTimeline timeline={current.timeline} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
