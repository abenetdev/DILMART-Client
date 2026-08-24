import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllReturns, fetchAdminReturnById,
  adminApproveReturn, adminRejectReturn,
  adminApproveRefund, adminProcessRefund,
  clearAdminReturnDetail,
} from "@/store/admin/return-slice";
import { Button }    from "@/components/ui/button";
import { Input }     from "@/components/ui/input";
import { Textarea }  from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label }     from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast }          from "@/components/ui/use-toast";
import { Loader2, Eye, RotateCcw } from "lucide-react";
import ReturnStatusBadge  from "@/components/common/return-status-badge";
import ReturnTimeline     from "@/components/common/return-timeline";
import { currencyFormatter } from "@/utils";

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

const STATUS_FILTERS = [
  "all","requested","vendor_reviewing","approved","rejected","escalated",
  "return_pending","return_shipped","under_inspection",
  "refund_processing","replacement_processing","refunded","completed","cancelled",
];

export default function AdminReturnRequestsTab() {
  const dispatch   = useDispatch();
  const { toast }  = useToast();
  const { list, current, isLoading, isSubmitting, error } =
    useSelector((s) => s.adminReturn);

  const [statusFilter,   setStatusFilter]   = useState("all");
  const [search,         setSearch]         = useState("");
  const [openDetail,     setOpenDetail]     = useState(false);

  // Action form state
  const [rejectReason,   setRejectReason]   = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [changeOfMind,   setChangeOfMind]   = useState(false);
  const [activeAction,   setActiveAction]   = useState(null); // "reject"|"refund"|null

  useEffect(() => {
    const params = statusFilter !== "all" ? { status: statusFilter } : {};
    if (search) params.search = search;
    dispatch(fetchAllReturns(params));
  }, [dispatch, statusFilter]);

  function openReturnDetail(id) {
    dispatch(fetchAdminReturnById(id));
    setOpenDetail(true);
    setActiveAction(null);
    setRejectReason("");
    setApprovedAmount("");
    setChangeOfMind(false);
  }

  function closeDetail() {
    setOpenDetail(false);
    dispatch(clearAdminReturnDetail());
  }

  async function act(thunk, args, successMsg) {
    const result = await dispatch(thunk({ id: current._id, ...args }));
    if (result?.payload?.success) {
      toast({ title: successMsg });
      setActiveAction(null);
    } else {
      toast({ title: result?.payload?.message || error || "Action failed.", variant: "destructive" });
    }
  }

  function getActions() {
    if (!current) return [];
    const s = current.status;
    const actions = [];
    if (["vendor_reviewing","escalated"].includes(s)) {
      actions.push({ label: "Approve Return", color: "bg-green-600 text-white hover:bg-green-700", fn: () => act(adminApproveReturn, { note: "" }, "Return approved.") });
      actions.push({ label: "Reject Return",  color: "bg-red-600 text-white hover:bg-red-700",   fn: () => setActiveAction("reject") });
    }
    if (["under_inspection","escalated","approved"].includes(s)) {
      actions.push({ label: "Approve Refund", color: "bg-blue-600 text-white hover:bg-blue-700",  fn: () => setActiveAction("refund") });
    }
    if (s === "refund_processing" && current.approvedAmount > 0) {
      actions.push({ label: "Process Refund Now", color: "bg-primary text-white", fn: () => act(adminProcessRefund, {}, "Refund processed successfully!") });
    }
    return actions;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search order ID / customer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            dispatch(fetchAllReturns({
              status: statusFilter !== "all" ? statusFilter : undefined,
              search,
            }))
          }
          className="h-9 text-sm max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] h-9 text-sm capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <RotateCcw className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No return requests found.</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                {["Order ID","Customer","Vendor","Reason","Requested","Approved","Status","Date",""].map((h) => (
                  <th key={h} className="text-left px-3 py-3 font-semibold text-slate-700 text-xs whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((r) => {
                const { primary, group } = resolveOrderDisplay(r.orderId);
                return (
                  <tr key={r._id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                    {/* Order ID */}
                    <td className="px-3 py-3">
                      <p className="font-mono text-xs font-semibold">{primary}</p>
                      {group && (
                        <p className="font-mono text-[10px] text-muted-foreground">{group}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs">{r.customerId?.userName || "—"}</td>
                    <td className="px-3 py-3 text-xs">{r.vendorId?.userName || "—"}</td>
                    <td className="px-3 py-3 text-xs capitalize">{r.reason?.replace(/_/g, " ")}</td>
                    <td className="px-3 py-3 text-xs font-medium">{currencyFormatter(r.requestedAmount)}</td>
                    <td className="px-3 py-3 text-xs">
                      {r.approvedAmount != null ? currencyFormatter(r.approvedAmount) : "—"}
                    </td>
                    <td className="px-3 py-3"><ReturnStatusBadge status={r.status} /></td>
                    <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3">
                      <Button size="sm" variant="ghost" onClick={() => openReturnDetail(r._id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={openDetail} onOpenChange={(o) => { if (!o) closeDetail(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Return Request — Admin View</DialogTitle>
          </DialogHeader>

          {!current ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (() => {
            const { primary, group } = resolveOrderDisplay(current.orderId);
            return (
              <div className="space-y-4 mt-2">

                {/* Header: Order ID + status */}
                <div className="flex flex-wrap gap-3 items-start justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Order ID</p>
                    <p className="font-mono font-semibold text-sm">{primary}</p>
                    {group && (
                      <p className="font-mono text-xs text-muted-foreground mt-0.5">
                        Group: {group}
                      </p>
                    )}
                  </div>
                  <ReturnStatusBadge status={current.status} />
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Customer</p>
                    <p>{current.customerId?.userName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Vendor</p>
                    <p>{current.vendorId?.userName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Reason</p>
                    <p className="capitalize">{current.reason?.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Requested</p>
                    <p className="font-semibold">{currencyFormatter(current.requestedAmount)}</p>
                  </div>
                  {current.approvedAmount != null && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Approved</p>
                      <p className="font-semibold text-green-700">{currencyFormatter(current.approvedAmount)}</p>
                    </div>
                  )}
                  {current.refundedAmount > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Refunded</p>
                      <p className="font-semibold text-blue-700">{currencyFormatter(current.refundedAmount)}</p>
                    </div>
                  )}
                </div>

                {current.changeOfMindDeduction && (
                  <div className="rounded bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                    ⚠ 20% change-of-mind deduction applied to this refund.
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Customer Description</p>
                  <p className="text-sm rounded bg-slate-50 border px-3 py-2">{current.description}</p>
                </div>

                {current.vendorDecisionReason && (
                  <div className="rounded bg-slate-50 border px-3 py-2 text-xs space-y-0.5">
                    <p className="font-semibold text-slate-700">
                      Vendor Decision: <span className="capitalize">{current.vendorDecision}</span>
                    </p>
                    <p className="text-muted-foreground">{current.vendorDecisionReason}</p>
                  </div>
                )}

                {/* Evidence */}
                {current.evidence?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Evidence ({current.evidence.length} file{current.evidence.length !== 1 ? "s" : ""})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {current.evidence.map((e, i) => (
                        <a key={i} href={e.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="block h-20 w-20 rounded-lg overflow-hidden border bg-slate-100 hover:opacity-80">
                          {!e.fileType || e.fileType === "image"
                            ? <img src={e.fileUrl} alt="" className="h-full w-full object-cover" />
                            : <div className="h-full flex items-center justify-center text-xs text-muted-foreground p-1 text-center">video</div>}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shipment */}
                {current.shipment?.trackingNumber && (
                  <div className="rounded bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800 space-y-0.5">
                    <p>Courier: <strong>{current.shipment.courier || "—"}</strong></p>
                    <p>Tracking: <strong>{current.shipment.trackingNumber}</strong></p>
                  </div>
                )}

                <Separator />

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {getActions().map((a) => (
                    <Button key={a.label} size="sm" className={a.color} onClick={a.fn} disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                      {a.label}
                    </Button>
                  ))}
                </div>

                {/* Reject form */}
                {activeAction === "reject" && (
                  <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
                    <Label className="text-sm text-red-800">Rejection Reason *</Label>
                    <Textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={2}
                      placeholder="Provide a clear reason for the customer…"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" disabled={isSubmitting}
                        onClick={() => act(adminRejectReturn, { reason: rejectReason }, "Return rejected.")}>
                        Confirm Reject
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setActiveAction(null)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {/* Refund approval form */}
                {activeAction === "refund" && (
                  <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <Label className="text-sm font-semibold">Approve Refund Amount</Label>
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-muted-foreground">ETB</span>
                      <Input
                        type="number" min="0" max={current.requestedAmount}
                        value={approvedAmount}
                        onChange={(e) => setApprovedAmount(e.target.value)}
                        placeholder={String(current.requestedAmount)}
                        className="w-36 h-9 bg-white text-sm"
                      />
                      <Button size="sm" variant="ghost" className="text-xs"
                        onClick={() => setApprovedAmount(String(current.requestedAmount))}>
                        Full amount
                      </Button>
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={changeOfMind}
                        onChange={(e) => setChangeOfMind(e.target.checked)} className="rounded" />
                      Apply 20% change-of-mind deduction
                    </label>
                    {changeOfMind && approvedAmount && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                        Customer receives: ETB {(parseFloat(approvedAmount) * 0.80).toFixed(2)}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700"
                        disabled={isSubmitting || !approvedAmount}
                        onClick={() => act(adminApproveRefund,
                          { approvedAmount: parseFloat(approvedAmount), changeOfMind },
                          "Refund approved. Use 'Process Refund Now' to execute."
                        )}>
                        Approve Refund
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setActiveAction(null)}>Cancel</Button>
                    </div>
                  </div>
                )}

                <Separator />
                <div>
                  <p className="font-semibold text-sm mb-3">Full Timeline</p>
                  <ReturnTimeline timeline={current.timeline} />
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
