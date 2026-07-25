import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllApplications,
  approveApplication,
  rejectApplication,
} from "@/store/admin/seller-applications-slice";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle, XCircle, Clock, Store,
  Loader2, Eye, Users,
} from "lucide-react";

// ── Status badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:  { className: "bg-yellow-100 text-yellow-800", icon: Clock       },
    approved: { className: "bg-green-100  text-green-800",  icon: CheckCircle  },
    rejected: { className: "bg-red-100    text-red-800",    icon: XCircle      },
  };
  const { className, icon: Icon } = map[status] || map.pending;
  return (
    <Badge className={`${className} gap-1 border-0`}>
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// ── Review Dialog ───────────────────────────────────────────────────────────
function ReviewDialog({ app, onClose, onApprove, onReject, isLoading }) {
  const [note, setNote] = useState("");

  if (!app) return null;

  const isPending = app.status === "pending";

  return (
    <Dialog open={!!app} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Review Application
          </DialogTitle>
          <DialogDescription>
            Application from <strong>{app.userId?.userName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Applicant</p>
              <p className="font-medium">{app.userId?.userName}</p>
              <p className="text-xs text-muted-foreground">{app.userId?.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Applied</p>
              <p className="font-medium">
                {new Date(app.createdAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Store Name</p>
            <p className="font-semibold">{app.storeName}</p>
          </div>

          {app.storeDescription && (
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-gray-700 leading-relaxed">{app.storeDescription}</p>
            </div>
          )}

          {app.phone && (
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p>{app.phone}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Status:</p>
            <StatusBadge status={app.status} />
          </div>

          {app.adminNote && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Admin Note</p>
              <p className="text-sm italic">{app.adminNote}</p>
            </div>
          )}

          {/* Admin note input only for pending */}
          {isPending && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Note to applicant (optional)
              </p>
              <Textarea
                placeholder="Add a note visible to the applicant..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          )}
        </div>

        {isPending && (
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700"
              disabled={isLoading}
              onClick={() => onApprove(app._id, note)}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Approve
            </Button>
            <Button
              variant="destructive"
              className="flex-1 gap-1.5"
              disabled={isLoading}
              onClick={() => onReject(app._id, note)}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Reject
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSellerApplications() {
  const dispatch   = useDispatch();
  const { toast }  = useToast();
  const { applications, isLoading } = useSelector((s) => s.adminSellerApplications);

  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedApp,  setSelectedApp]  = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    dispatch(getAllApplications(filterStatus));
  }, [dispatch, filterStatus]);

  const handleApprove = async (id, adminNote) => {
    setActionLoading(true);
    const result = await dispatch(approveApplication({ id, adminNote }));
    setActionLoading(false);
    if (result?.payload?.success) {
      toast({ title: "✅ Application approved", description: result.payload.message });
      setSelectedApp(null);
      dispatch(getAllApplications(filterStatus));
    } else {
      toast({ title: "Failed to approve", variant: "destructive" });
    }
  };

  const handleReject = async (id, adminNote) => {
    setActionLoading(true);
    const result = await dispatch(rejectApplication({ id, adminNote }));
    setActionLoading(false);
    if (result?.payload?.success) {
      toast({ title: "Application rejected", description: result.payload.message });
      setSelectedApp(null);
      dispatch(getAllApplications(filterStatus));
    } else {
      toast({ title: "Failed to reject", variant: "destructive" });
    }
  };

  // Summary counts
  const counts = {
    all:      applications.length,
    pending:  applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Seller Applications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review and manage seller onboarding requests
          </p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({counts.all})</SelectItem>
            <SelectItem value="pending">Pending ({counts.pending})</SelectItem>
            <SelectItem value="approved">Approved ({counts.approved})</SelectItem>
            <SelectItem value="rejected">Rejected ({counts.rejected})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Store Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-7 w-7 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : applications.length > 0 ? (
              applications.map((app) => (
                <TableRow key={app._id} className="hover:bg-muted/30">
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{app.userId?.userName}</p>
                      <p className="text-xs text-muted-foreground">{app.userId?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{app.storeName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {app.phone || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(app.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={app.status} />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedApp(app)}
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No applications found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ReviewDialog
        app={selectedApp}
        onClose={() => setSelectedApp(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        isLoading={actionLoading}
      />
    </div>
  );
}
