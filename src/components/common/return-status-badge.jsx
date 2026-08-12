import { Badge } from "@/components/ui/badge";

const STATUS_MAP = {
  requested:              { label: "Requested",             cls: "bg-blue-100 text-blue-800" },
  vendor_reviewing:       { label: "Vendor Reviewing",      cls: "bg-yellow-100 text-yellow-800" },
  approved:               { label: "Approved",              cls: "bg-green-100 text-green-800" },
  rejected:               { label: "Rejected",              cls: "bg-red-100 text-red-800" },
  escalated:              { label: "Escalated to Admin",    cls: "bg-purple-100 text-purple-800" },
  return_pending:         { label: "Return Pending",        cls: "bg-orange-100 text-orange-800" },
  return_shipped:         { label: "Return Shipped",        cls: "bg-indigo-100 text-indigo-800" },
  return_received:        { label: "Return Received",       cls: "bg-cyan-100 text-cyan-800" },
  under_inspection:       { label: "Under Inspection",      cls: "bg-yellow-100 text-yellow-900" },
  refund_processing:      { label: "Refund Processing",     cls: "bg-blue-100 text-blue-900" },
  replacement_processing: { label: "Replacement Processing", cls: "bg-teal-100 text-teal-800" },
  refunded:               { label: "Refunded",              cls: "bg-green-100 text-green-900" },
  completed:              { label: "Completed",             cls: "bg-green-100 text-green-900" },
  cancelled:              { label: "Cancelled",             cls: "bg-gray-100 text-gray-600" },
};

export default function ReturnStatusBadge({ status }) {
  const cfg = STATUS_MAP[status] || { label: status, cls: "bg-gray-100 text-gray-700" };
  return <Badge className={`${cfg.cls} border-0 font-medium text-xs`}>{cfg.label}</Badge>;
}
