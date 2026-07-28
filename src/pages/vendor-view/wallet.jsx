import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Wallet as WalletIcon,
  DollarSign,
  TrendingUp,
  Download,
  Clock,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  Building2,
  Smartphone,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import {
  getWallet,
  getTransactions,
  getWithdrawals,
  requestWithdrawal,
  getEarningsBreakdown,
  getPayoutSettings,
} from "@/store/vendor/wallet-slice";
import { currencyFormatter } from "@/utils";

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

// ── Status badge ───────────────────────────────────────────────────────────
const STATUS_CFG = {
  PENDING:   { color: "bg-yellow-100 text-yellow-800",  label: "Pending"   },
  COMPLETED: { color: "bg-green-100 text-green-800",    label: "Completed" },
  FAILED:    { color: "bg-red-100 text-red-800",        label: "Failed"    },
  CANCELLED: { color: "bg-gray-100 text-gray-800",      label: "Cancelled" },
  APPROVED:  { color: "bg-blue-100 text-blue-800",      label: "Approved"  },
  REJECTED:  { color: "bg-red-100 text-red-800",        label: "Rejected"  },
  PAID:      { color: "bg-green-100 text-green-800",    label: "Paid"      },
};

const StatusBadge = ({ status }) => {
  const { color, label } = STATUS_CFG[status] || STATUS_CFG.PENDING;
  return <Badge className={color}>{label}</Badge>;
};

const TypeBadge = ({ type }) => {
  const cfg = {
    SALE:       { color: "bg-green-100 text-green-800",   icon: ArrowUpRight   },
    COMMISSION: { color: "bg-orange-100 text-orange-800", icon: ArrowDownRight },
    REFUND:     { color: "bg-red-100 text-red-800",       icon: ArrowDownRight },
    WITHDRAWAL: { color: "bg-blue-100 text-blue-800",     icon: Download       },
    ADJUSTMENT: { color: "bg-purple-100 text-purple-800", icon: null           },
  };
  const { color, icon: Icon } = cfg[type] || {};
  return (
    <Badge className={`${color} gap-1`}>
      {Icon && <Icon className="h-3 w-3" />}
      {type}
    </Badge>
  );
};

// ── Method display helper ──────────────────────────────────────────────────
function PayoutMethodCard({ settings }) {
  if (!settings) return null;
  const method = settings.preferredMethod;

  if (method === "bank") {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50">
        <div className="p-2 rounded-lg bg-blue-100 text-blue-600 shrink-0">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Bank Transfer</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{settings.bankName || "—"}</p>
          <p className="text-sm text-gray-700">{settings.accountHolderName || "—"}</p>
          <p className="text-sm font-mono text-gray-600">
            {"•".repeat(Math.max(0, (settings.accountNumber || "").length - 4))}
            {(settings.accountNumber || "").slice(-4)}
          </p>
        </div>
        <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
      </div>
    );
  }

  if (method === "telebirr") {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl border border-green-100 bg-green-50">
        <div className="p-2 rounded-lg bg-green-100 text-green-600 shrink-0">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Telebirr</p>
          <p className="text-sm font-semibold text-gray-900">{settings.telebirrName || "—"}</p>
          <p className="text-sm font-mono text-gray-600">{settings.telebirrNumber || "—"}</p>
        </div>
        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
      </div>
    );
  }

  return null;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function VendorWallet() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { toast } = useToast();
  const { user }  = useSelector((s) => s.auth);
  const { wallet, transactions, withdrawals, isLoading, payoutSettings } =
    useSelector((s) => s.vendorWallet);

  // Dialog state — 2 steps: "method" → "amount"
  const [dialogOpen,     setDialogOpen]     = useState(false);
  const [dialogStep,     setDialogStep]      = useState("method"); // "method" | "amount"
  const [withdrawAmount, setWithdrawAmount]  = useState("");
  const [filterStatus,   setFilterStatus]   = useState("all");
  const [isSubmitting,   setIsSubmitting]   = useState(false);

  const vendorId = user?._id || user?.id;

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!vendorId) return;
    dispatch(getWallet(vendorId));
    dispatch(getTransactions({ vendorId }));
    dispatch(getWithdrawals({ vendorId }));
    dispatch(getEarningsBreakdown(vendorId));
    dispatch(getPayoutSettings(vendorId));
  }, [dispatch, vendorId]);

  // ── Open dialog ────────────────────────────────────────────────────────────
  const openDialog = () => {
    setWithdrawAmount("");
    setDialogStep("method");
    setDialogOpen(true);
  };

  // ── Submit withdrawal ──────────────────────────────────────────────────────
  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Invalid amount", description: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (amount < 100) {
      toast({ title: "Too low", description: "Minimum withdrawal is ETB 100", variant: "destructive" });
      return;
    }
    if (amount > (wallet?.availableBalance || 0)) {
      toast({ title: "Insufficient balance", description: `Max available: ${currencyFormatter(wallet?.availableBalance)}`, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    dispatch(requestWithdrawal({ vendorId, amount }))
      .unwrap()
      .then((data) => {
        toast({ title: "Withdrawal Requested!", description: data?.message || "Pending admin approval." });
        setDialogOpen(false);
        setWithdrawAmount("");
        dispatch(getWallet(vendorId));
        dispatch(getWithdrawals({ vendorId }));
        dispatch(getTransactions({ vendorId }));
      })
      .catch((err) => {
        toast({
          title: "Withdrawal Failed",
          description: err?.message || "Something went wrong",
          variant: "destructive",
        });
      })
      .finally(() => setIsSubmitting(false));
  };

  // ── Payout settings validity ───────────────────────────────────────────────
  const payoutConfigured = (() => {
    if (!payoutSettings) return false;
    const m = payoutSettings.preferredMethod;
    if (m === "bank") {
      return !!(payoutSettings.bankName && payoutSettings.accountHolderName && payoutSettings.accountNumber);
    }
    if (m === "telebirr") {
      return !!(payoutSettings.telebirrName && payoutSettings.telebirrNumber);
    }
    return false;
  })();

  // ── Filter transactions ────────────────────────────────────────────────────
  const filteredTransactions =
    filterStatus === "all"
      ? transactions
      : transactions?.filter((t) => t.status === filterStatus.toUpperCase());

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading && !wallet) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wallet & Earnings</h1>
          <p className="text-muted-foreground">Track your revenue and manage withdrawals</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/vendor/payout-settings")}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Payout Settings
          </Button>
          <Button
            onClick={openDialog}
            className="gap-2"
            disabled={!wallet || wallet.availableBalance <= 0}
          >
            <Download className="h-4 w-4" />
            Request Withdrawal
          </Button>
        </div>
      </div>

      {/* ── Overview cards ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencyFormatter(wallet?.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">All completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{currencyFormatter(wallet?.availableBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for withdrawal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{currencyFormatter(wallet?.pendingBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Released after delivery is confirmed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Withdrawn</CardTitle>
            <WalletIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencyFormatter(wallet?.withdrawnAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">{wallet?.totalOrders || 0} orders</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 5).map((txn) => (
                      <TableRow key={txn._id}>
                        <TableCell className="text-sm">{formatDate(txn.createdAt)}</TableCell>
                        <TableCell><TypeBadge type={txn.type} /></TableCell>
                        <TableCell className={`font-medium ${txn.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {txn.amount >= 0 ? "+" : ""}{currencyFormatter(txn.amount)}
                        </TableCell>
                        <TableCell><StatusBadge status={txn.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No transactions yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions?.length > 0 ? (
                    filteredTransactions.map((txn) => (
                      <TableRow key={txn._id}>
                        <TableCell className="font-mono text-xs">
                          {txn._id?.slice(-8).toUpperCase()}
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(txn.createdAt)}</TableCell>
                        <TableCell><TypeBadge type={txn.type} /></TableCell>
                        <TableCell className={`font-medium ${txn.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {txn.amount >= 0 ? "+" : ""}{currencyFormatter(txn.amount)}
                        </TableCell>
                        <TableCell><StatusBadge status={txn.status} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[220px]">
                          {txn.description || txn.reference || "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdrawals */}
        <TabsContent value="withdrawals" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Processed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals?.length > 0 ? (
                    withdrawals.map((w) => (
                      <TableRow key={w._id}>
                        <TableCell className="font-mono text-xs">
                          WD-{w._id?.slice(-6).toUpperCase()}
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(w.requestedAt)}</TableCell>
                        <TableCell className="font-medium">{currencyFormatter(w.amount)}</TableCell>
                        <TableCell className="text-sm capitalize">
                          {w.payoutMethod === "telebirr" ? "Telebirr" :
                           w.payoutMethod === "bank"     ? "Bank Transfer" :
                           w.payoutMethod || "—"}
                        </TableCell>
                        <TableCell><StatusBadge status={w.status} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                          {w.status === "REJECTED" && w.adminNote
                            ? <span className="text-red-600">{w.adminNote}</span>
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {w.processedAt ? formatDate(w.processedAt) : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No withdrawal requests yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Withdrawal Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              {dialogStep === "method"
                ? "Confirm your payout method before entering the amount"
                : "Enter the amount you want to withdraw"}
            </DialogDescription>
          </DialogHeader>

          {/* ── Step indicator ── */}
          <div className="flex items-center gap-2 py-1">
            {["method", "amount"].map((step, i) => {
              const active  = dialogStep === step;
              const done    = (dialogStep === "amount" && step === "method");
              return (
                <div key={step} className="flex items-center gap-2">
                  <span className={`h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                    done    ? "bg-green-500 text-white" :
                    active  ? "bg-primary text-primary-foreground" :
                              "bg-muted text-muted-foreground"
                  }`}>
                    {done ? "✓" : i + 1}
                  </span>
                  <span className={`text-xs font-medium ${active ? "text-gray-900" : "text-muted-foreground"}`}>
                    {step === "method" ? "Payout Method" : "Amount"}
                  </span>
                  {i === 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              );
            })}
          </div>

          {/* ── Step 1: Payout method ── */}
          {dialogStep === "method" && (
            <div className="space-y-4 py-2">
              {payoutConfigured ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Your withdrawal will be sent to:
                  </p>
                  <PayoutMethodCard settings={payoutSettings} />
                  <p className="text-xs text-muted-foreground">
                    Need to change this?{" "}
                    <button
                      className="text-primary underline underline-offset-2"
                      onClick={() => { setDialogOpen(false); navigate("/vendor/payout-settings"); }}
                    >
                      Update payout settings
                    </button>
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => setDialogStep("amount")}
                    >
                      Continue <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Payout not configured</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        You need to set up your payout method before you can withdraw funds.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => { setDialogOpen(false); navigate("/vendor/payout-settings"); }}
                    >
                      <Settings className="h-4 w-4" />
                      Configure Now
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Step 2: Amount ── */}
          {dialogStep === "amount" && (
            <div className="space-y-4 py-2">
              {/* Balance display */}
              <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold text-green-600">{currencyFormatter(wallet?.availableBalance)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-300" />
              </div>

              {/* Amount input */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Withdrawal Amount (ETB) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  min="100"
                  max={wallet?.availableBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="text-lg font-semibold"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">Minimum withdrawal: ETB 100.00</p>
              </div>

              {/* Quick amount buttons */}
              {wallet?.availableBalance > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {[100, 500, 1000].filter(v => v <= wallet.availableBalance).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setWithdrawAmount(String(v))}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary transition-colors font-medium"
                    >
                      ETB {v.toLocaleString()}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(String(wallet.availableBalance.toFixed(2)))}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary transition-colors font-medium"
                  >
                    Max
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setDialogStep("method")}>
                  Back
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleWithdraw}
                  disabled={
                    isSubmitting ||
                    !withdrawAmount ||
                    parseFloat(withdrawAmount) < 100 ||
                    parseFloat(withdrawAmount) > (wallet?.availableBalance || 0)
                  }
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isSubmitting ? "Submitting…" : "Request Withdrawal"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
