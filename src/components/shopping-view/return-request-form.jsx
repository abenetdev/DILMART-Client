import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createReturnRequest, checkReturnEligibility } from "@/store/shop/return-slice";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, UploadCloud, X, AlertCircle } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const REASONS = [
  { value: "wrong_product",      label: "Wrong product received" },
  { value: "damaged_product",    label: "Product arrived damaged" },
  { value: "defective_product",  label: "Product is defective" },
  { value: "not_as_described",   label: "Not as described" },
  { value: "missing_parts",      label: "Missing parts or accessories" },
  { value: "not_delivered",      label: "Product not delivered" },
  { value: "other",              label: "Other" },
];

export default function ReturnRequestForm({ order, onSuccess }) {
  const dispatch   = useDispatch();
  const { toast }  = useToast();
  const { isSubmitting, eligibility } = useSelector((s) => s.shopReturn);

  const [reason,      setReason]      = useState("");
  const [description, setDescription] = useState("");
  const [resolution,  setResolution]  = useState("refund");
  const [files,       setFiles]       = useState([]);
  const [eligErr,     setEligErr]     = useState(null);
  const fileRef = useRef(null);

  // Check eligibility when reason changes
  async function handleReasonChange(val) {
    setReason(val);
    setEligErr(null);
    if (!val) return;
    const result = await dispatch(checkReturnEligibility(order._id));
    if (result?.payload?.data?.eligibility) {
      const match = result.payload.data.eligibility.find((e) => e.reason === val);
      if (match && !match.eligible) setEligErr(match.message);
    }
    if (result?.payload?.data?.existingRequest) {
      setEligErr("A return request already exists for this order.");
    }
  }

  function handleFiles(e) {
    const picked = Array.from(e.target.files || []);
    if (files.length + picked.length > 5) {
      toast({ title: "Maximum 5 files allowed.", variant: "destructive" }); return;
    }
    setFiles((prev) => [...prev, ...picked]);
  }

  function removeFile(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason)      { toast({ title: "Select a reason.",      variant: "destructive" }); return; }
    if (!description.trim()) { toast({ title: "Add a description.", variant: "destructive" }); return; }
    if (eligErr)      { toast({ title: eligErr,                  variant: "destructive" }); return; }

    const fd = new FormData();
    fd.append("orderId",             order._id);
    fd.append("reason",              reason);
    fd.append("description",         description.trim());
    fd.append("requestedResolution", resolution);
    files.forEach((f) => fd.append("files", f));

    const result = await dispatch(createReturnRequest(fd));
    if (result?.payload?.success) {
      toast({ title: "Return request submitted." });
      onSuccess?.();
    } else {
      toast({
        title:       "Could not submit return request.",
        description: result?.payload?.message || "Please try again.",
        variant:     "destructive",
      });
    }
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Request Return / Refund</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {/* Reason */}
        <div className="space-y-1.5">
          <Label>Reason *</Label>
          <Select value={reason} onValueChange={handleReasonChange}>
            <SelectTrigger><SelectValue placeholder="Select a reason…" /></SelectTrigger>
            <SelectContent>
              {REASONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {eligErr && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {eligErr}
            </div>
          )}
        </div>

        {/* Resolution */}
        <div className="space-y-1.5">
          <Label>Requested Resolution *</Label>
          <Select value={resolution} onValueChange={setResolution}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="refund">Refund</SelectItem>
              <SelectItem value="replacement">Replacement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label>Description *</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail…"
            rows={3}
            maxLength={2000}
          />
          <p className="text-[11px] text-muted-foreground text-right">{description.length}/2000</p>
        </div>

        {/* Evidence */}
        <div className="space-y-1.5">
          <Label>Evidence (photos/video — up to 5 files)</Label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <UploadCloud className="h-4 w-4" />
            Click to upload
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFiles} />
          {files.length > 0 && (
            <ul className="space-y-1">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded bg-slate-50 px-3 py-1.5 text-xs">
                  <span className="truncate max-w-[80%]">{f.name}</span>
                  <button type="button" onClick={() => removeFile(i)}>
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting || !!eligErr} className="w-full">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Submit Return Request
        </Button>
      </form>
    </DialogContent>
  );
}
