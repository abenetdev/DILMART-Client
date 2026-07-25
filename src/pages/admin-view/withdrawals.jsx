import { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  Search,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MoreVertical,
  Banknote,
} from "lucide-react";
import {
  fetchAllWithdrawals,
  getWithdrawalById,
  approveWithdrawal,
  rejectWithdrawal,
  clearWithdrawalDetails,
} from "@/store/admin/withdrawals-slice";

const fmt = (n) =>
  `ETB ${(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const PAYOUT_LABELS = {
  bank: "Bank Transfer",
  chapa: "Chapa",
  mobile_money: "Mobile Money",
};

function StatusBadge({ status }) {
  const map = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-blue-100 text-blue-800",
    PAID: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  return (
    <Badge className={map[status] || "bg-gray-100 text-gray-800"}>
      {status?.charAt(0) + status?.slice(1).toLowerCase()}
    </Badge>
  );
}

function PayoutDetails({ method, details }) {
  if (!details) return <p className="text-sm text-muted-foreground">No payout details</p>;

  if (method === "bank") {
    return (
      <div className="text-sm space-y-1">
        <p><span className="text-muted-foreground">Bank:</span> {details.bankName || "—"}</p>
        <p><span className="text-muted-foreground">Account:</span> {details.accountHolderName || "—"}</p>
        <p><span className="text-muted-foreground">Number:</span> {details.accountNumber || "—"}</p>
      </div>
    );
  }
  if (method === "chapa") {
    return (
      <div className="text-sm space-y-1">
        <p><span className="text-muted-foreground">Name:</span> {details.chapaAccountName || "—"}</p>
        <p><span className="text-muted-foreground">Account:</span> {details.chapaAccountNumber || "—"}</p>
      </div>
    );
  }
  return (
    <div className="text-sm">
      <p><span className="text-muted-foreground">Number:</span> {details.mobileMoneyNumber || "—"}</p>
    </div>
  );
}

export default function AdminWithdrawals() {
  const dispatch = useDispatch();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("PENDING");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const { withdrawalList, withdrawalDetails, isListLoading, isSubmitting } =
    useSelector((s) => s.adminWithdrawals);

  const loadWithdrawals = (search = searchTerm) => {
    dispatch(fetchAllWithdrawals({ search, status: filterStatus }));
  };

  useEffect(() => {
    loadWithdrawals("");
  }, [dispatch, filterStatus]);

  const handleSearch = () => loadWithdrawals(searchTerm);

  const handleViewDetails = (id) => {
    dispatch(getWithdrawalById(id));
    setSelectedId(id);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedId(null);
    dispatch(clearWithdrawalDetails());
  };

  const handleApprove = async (id) => {
    const result = await dispatch(approveWithdrawal({ id, adminNote: "Approved by admin" }));
    if (result?.payload?.success) {
      toast({ title: result.payload.message });
      loadWithdrawals();
      if (detailsOpen) dispatch(getWithdrawalById(id));
    } else {
      toast({
        title: "Approval failed",
        description: result?.payload?.message || "Could not approve withdrawal",
        variant: "destructive",
      });
    }
  };

  const openRejectDialog = (id) => {
    setSelectedId(id);
    setRejectNote("");
    setRejectOpen(true);
  };

  const handleReject = async () => {
    if (!rejectNote.trim()) {
      toast({ title: "Please enter a rejection reason", variant: "destructive" });
      return;
    }

    const result = await dispatch(
      rejectWithdrawal({ id: selectedId, adminNote: rejectNote.trim() })
    );

    if (result?.payload?.success) {
      toast({ title: result.payload.message });
      setRejectOpen(false);
      setRejectNote("");
      loadWithdrawals();
      if (detailsOpen) dispatch(getWithdrawalById(selectedId));
    } else {
      toast({
        title: "Rejection failed",
        description: result?.payload?.message || "Could not reject withdrawal",
        variant: "destructive",
      });
    }
  };

  const stats = {
    total: withdrawalList.length,
    pending: withdrawalList.filter((w) => w.status === "PENDING").length,
    paid: withdrawalList.filter((w) => w.status === "PAID").length,
    rejected: withdrawalList.filter((w) => w.status === "REJECTED").length,
    pendingAmount: withdrawalList
      .filter((w) => w.status === "PENDING")
      .reduce((s, w) => s + w.amount, 0),
  };

  return (
    <Fragment>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Withdrawal Approvals</h1>
        <p className="text-muted-foreground">
          Review and process vendor payout requests
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">{fmt(stats.pendingAmount)} awaiting</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In View</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendor or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>Search</Button>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isListLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : withdrawalList.length > 0 ? (
              withdrawalList.map((w) => (
                <TableRow key={w._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{w.vendorName}</div>
                      <div className="text-xs text-muted-foreground">{w.vendorEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{w.storeName}</TableCell>
                  <TableCell className="font-semibold">{fmt(w.amount)}</TableCell>
                  <TableCell className="text-sm capitalize">
                    {PAYOUT_LABELS[w.payoutMethod] || w.payoutMethod}
                  </TableCell>
                  <TableCell><StatusBadge status={w.status} /></TableCell>
                  <TableCell className="text-sm">{formatDate(w.requestedAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(w._id)} className="gap-2">
                          <Eye className="h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        {w.status === "PENDING" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleApprove(w._id)}
                              className="gap-2 text-green-600"
                            >
                              <CheckCircle className="h-4 w-4" /> Approve & Pay
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openRejectDialog(w._id)}
                              className="gap-2 text-red-600"
                            >
                              <XCircle className="h-4 w-4" /> Reject
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Banknote className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No withdrawal requests found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Details dialog */}
      <Dialog open={detailsOpen} onOpenChange={handleCloseDetails}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Withdrawal Request</DialogTitle>
          </DialogHeader>

          {isSubmitting && !withdrawalDetails ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : withdrawalDetails ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{fmt(withdrawalDetails.amount)}</span>
                <StatusBadge status={withdrawalDetails.status} />
              </div>

              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Vendor:</span> {withdrawalDetails.vendorName}</p>
                <p><span className="text-muted-foreground">Email:</span> {withdrawalDetails.vendorEmail}</p>
                <p><span className="text-muted-foreground">Store:</span> {withdrawalDetails.storeName}</p>
                <p><span className="text-muted-foreground">Requested:</span> {formatDate(withdrawalDetails.requestedAt)}</p>
                {withdrawalDetails.processedAt && (
                  <p><span className="text-muted-foreground">Processed:</span> {formatDate(withdrawalDetails.processedAt)}</p>
                )}
              </div>

              {withdrawalDetails.wallet && (
                <div className="rounded-lg border p-3 text-sm">
                  <p className="font-medium mb-1">Vendor Wallet</p>
                  <p>Available: <span className="text-green-600 font-semibold">{fmt(withdrawalDetails.wallet.availableBalance)}</span></p>
                  <p className="text-muted-foreground">Pending: {fmt(withdrawalDetails.wallet.pendingBalance)}</p>
                </div>
              )}

              <div className="rounded-lg border p-3">
                <p className="font-medium mb-2">
                  Payout — {PAYOUT_LABELS[withdrawalDetails.payoutMethod]}
                </p>
                <PayoutDetails
                  method={withdrawalDetails.payoutMethod}
                  details={withdrawalDetails.payoutDetails}
                />
              </div>

              {withdrawalDetails.adminNote && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="font-medium">Admin Note</p>
                  <p className="text-muted-foreground">{withdrawalDetails.adminNote}</p>
                </div>
              )}

              {withdrawalDetails.status === "PENDING" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => handleApprove(withdrawalDetails._id)}
                    disabled={isSubmitting}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve & Pay
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() => openRejectDialog(withdrawalDetails._id)}
                    disabled={isSubmitting}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              Provide a reason — the vendor will see this note.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Rejection Reason</Label>
            <Textarea
              placeholder="e.g. Invalid bank account details..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
                {isSubmitting ? "Rejecting..." : "Confirm Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}
