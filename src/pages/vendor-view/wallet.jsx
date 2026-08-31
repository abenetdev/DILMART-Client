import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Wallet as WalletIcon, DollarSign, TrendingUp, Download, Clock,
  Loader2, ArrowUpRight, ArrowDownRight, Settings, Building2,
  Smartphone, AlertTriangle, ChevronRight, CheckCircle2,
} from "lucide-react";
import {
  getWallet,
  getTransactions,
  getWithdrawals,
  fetchTransactionsPage,
  fetchWithdrawalsPage,
  resetTransactions,
  resetWithdrawals,
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

const formatDateShort = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

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

// ── Payout method card ─────────────────────────────────────────────────────
function PayoutMethodCard({ settings }) {
  if (!settings) return null;
  const method = settings.preferredMethod;
  if (method === "bank") {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50">
        <div className="p-2 rounded-lg bg-blue-100 text-blue-600 shrink-0"><Building2 className="h-5 w-5" /></div>
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
        <div className="p-2 rounded-lg bg-green-100 text-green-600 shrink-0"><Smartphone className="h-5 w-5" /></div>
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

// ── Mobile transaction card ────────────────────────────────────────────────
function TransactionCard({ txn }) {
  const amountPositive = txn.amount >= 0;
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <TypeBadge type={txn.type} />
          <StatusBadge status={txn.status} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{formatDate(txn.createdAt)}</p>
        {(txn.description || txn.reference) && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {txn.description || txn.reference}
          </p>
        )}
      </div>
      <p className={`font-semibold text-sm shrink-0 ${amountPositive ? "text-green-600" : "text-red-600"}`}>
        {amountPositive ? "+" : ""}{currencyFormatter(txn.amount)}
      </p>
    </div>
  );
}

// ── Mobile withdrawal card ─────────────────────────────────────────────────
function WithdrawalCard({ w }) {
  const methodLabel =
    w.payoutMethod === "telebirr" ? "Telebirr" :
    w.payoutMethod === "bank"     ? "Bank Transfer" :
    w.payoutMethod || "—";
  return (
    <div className="bg-background border rounded-xl p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-sm font-semibold">WD-{w._id?.slice(-6).toUpperCase()}</p>
        <StatusBadge status={w.status} />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <div>
          <span className="text-xs text-muted-foreground block">Amount</span>
          <span className="font-semibold">{currencyFormatter(w.amount)}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block">Method</span>
          <span>{methodLabel}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block">Requested</span>
          <span className="text-xs">{formatDateShort(w.requestedAt)}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block">Processed</span>
          <span className="text-xs">{w.processedAt ? formatDateShort(w.processedAt) : "—"}</span>
        </div>
      </div>
      {w.status === "REJECTED" && w.adminNote && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
          {w.adminNote}
        </p>
      )}
    </div>
  );
}

// ── Loading-more indicator ─────────────────────────────────────────────────
function LoadingMore({ text = "Loading more…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {text}
    </div>
  );
}

// ── useInfiniteScroll hook ─────────────────────────────────────────────────
// Watches a sentinel element and calls loadNextPage when it enters the viewport.
function useInfiniteScroll({ loadNextPage, hasNextPage, isLoading, currentPage }) {
  const sentinelRef  = useRef(null);
  const hasNextRef   = useRef(hasNextPage);
  const isLoadingRef = useRef(isLoading);
  const pageRef      = useRef(currentPage);

  // Keep refs in sync every render
  hasNextRef.current   = hasNextPage;
  isLoadingRef.current = isLoading;
  pageRef.current      = currentPage;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        if (!hasNextRef.current || isLoadingRef.current) return;
        loadNextPage(pageRef.current + 1);
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadNextPage]);

  return sentinelRef;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function VendorWallet() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { toast } = useToast();
  const { user }  = useSelector((s) => s.auth);
  const {
    wallet, transactions, withdrawals, isLoading,
    isLoadingMoreTxns, isLoadingMoreWds,
    txnCurrentPage, txnHasNextPage,
    wdCurrentPage, wdHasNextPage,
    payoutSettings,
  } = useSelector((s) => s.vendorWallet);

  const [dialogOpen,     setDialogOpen]    = useState(false);
  const [dialogStep,     setDialogStep]    = useState("method");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [txnFilterStatus, setTxnFilterStatus] = useState("all");
  const [isSubmitting,   setIsSubmitting]  = useState(false);

  const vendorId = user?._id || user?.id;

  // Hide COMMISSION transactions where the amount is 0 (commission rate = 0%)
  // — there is nothing meaningful to show the vendor in that case.
  const visibleTransactions = (transactions || []).filter(
    (txn) => !(txn.type === "COMMISSION" && txn.amount === 0)
  );

  // ── Keep filter ref stable for observer callbacks ──────────────────────
  const txnFilterRef = useRef("all");
  useEffect(() => { txnFilterRef.current = txnFilterStatus; }, [txnFilterStatus]);

  // ── Initial data load ──────────────────────────────────────────────────
  useEffect(() => {
    if (!vendorId) return;
    dispatch(getWallet(vendorId));
    dispatch(getEarningsBreakdown(vendorId));
    dispatch(getPayoutSettings(vendorId));
    // Load first page of transactions (for Overview tab + Transactions tab)
    dispatch(fetchTransactionsPage({ page: 1, limit: 20 }));
    // Load first page of withdrawals
    dispatch(fetchWithdrawalsPage({ page: 1, limit: 20 }));
  }, [dispatch, vendorId]);

  // ── Transactions: reset + reload when filter changes ──────────────────
  useEffect(() => {
    dispatch(resetTransactions());
    const raf = requestAnimationFrame(() => {
      dispatch(fetchTransactionsPage({
        page: 1, limit: 20,
        status: txnFilterStatus !== "all" ? txnFilterStatus.toUpperCase() : undefined,
      }));
    });
    return () => cancelAnimationFrame(raf);
  }, [dispatch, txnFilterStatus]);

  // ── loadNextTxnPage / loadNextWdPage ───────────────────────────────────
  const loadNextTxnPage = useCallback((page) => {
    dispatch(fetchTransactionsPage({
      page, limit: 20,
      status: txnFilterRef.current !== "all" ? txnFilterRef.current.toUpperCase() : undefined,
    }));
  }, [dispatch]);

  const loadNextWdPage = useCallback((page) => {
    dispatch(fetchWithdrawalsPage({ page, limit: 20 }));
  }, [dispatch]);

  // ── Sentinel refs via hook ─────────────────────────────────────────────
  const txnSentinelRef = useInfiniteScroll({
    loadNextPage: loadNextTxnPage,
    hasNextPage:  txnHasNextPage,
    isLoading:    isLoading || isLoadingMoreTxns,
    currentPage:  txnCurrentPage,
  });

  const wdSentinelRef = useInfiniteScroll({
    loadNextPage: loadNextWdPage,
    hasNextPage:  wdHasNextPage,
    isLoading:    isLoading || isLoadingMoreWds,
    currentPage:  wdCurrentPage,
  });

  // ── Withdrawal dialog ──────────────────────────────────────────────────
  const openDialog = () => {
    setWithdrawAmount("");
    setDialogStep("method");
    setDialogOpen(true);
  };

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
        // Refresh withdrawals from page 1
        dispatch(resetWithdrawals());
        requestAnimationFrame(() => dispatch(fetchWithdrawalsPage({ page: 1, limit: 20 })));
        // Refresh transactions from page 1
        dispatch(resetTransactions());
        requestAnimationFrame(() => dispatch(fetchTransactionsPage({ page: 1, limit: 20 })));
      })
      .catch((err) => {
        toast({ title: "Withdrawal Failed", description: err?.message || "Something went wrong", variant: "destructive" });
      })
      .finally(() => setIsSubmitting(false));
  };

  const payoutConfigured = (() => {
    if (!payoutSettings) return false;
    const m = payoutSettings.preferredMethod;
    if (m === "bank")     return !!(payoutSettings.bankName && payoutSettings.accountHolderName && payoutSettings.accountNumber);
    if (m === "telebirr") return !!(payoutSettings.telebirrName && payoutSettings.telebirrNumber);
    return false;
  })();

  if (isLoading && !wallet) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Wallet & Earnings</h1>
          <p className="text-muted-foreground text-sm">Track your revenue and manage withdrawals</p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          <Button variant="outline" onClick={() => navigate("/vendor/payout-settings")} className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Payout Settings</span>
            <span className="sm:hidden">Settings</span>
          </Button>
          <Button onClick={openDialog} className="gap-2" disabled={!wallet || wallet.availableBalance <= 0}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Request Withdrawal</span>
            <span className="sm:hidden">Withdraw</span>
          </Button>
        </div>
      </div>

      {/* ── Overview cards ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{currencyFormatter(wallet?.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">All completed orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Available</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{currencyFormatter(wallet?.availableBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Ready for withdrawal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-600">{currencyFormatter(wallet?.pendingBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Released after delivery</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Withdrawn</CardTitle>
            <WalletIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{currencyFormatter(wallet?.withdrawnAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{wallet?.totalOrders || 0} orders</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview"     className="flex-1 sm:flex-none">Overview</TabsTrigger>
          <TabsTrigger value="transactions" className="flex-1 sm:flex-none">Transactions</TabsTrigger>
          <TabsTrigger value="withdrawals"  className="flex-1 sm:flex-none">Withdrawals</TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════════════════
            OVERVIEW TAB — recent 5 from the already-loaded transactions
        ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {visibleTransactions?.length > 0 ? (
                <>
                  {/* Mobile */}
                  <div className="sm:hidden px-4 pb-2">
                    {visibleTransactions.slice(0, 5).map((txn) => (
                      <TransactionCard key={txn._id} txn={txn} />
                    ))}
                  </div>
                  {/* Tablet+ */}
                  <div className="hidden sm:block">
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
                        {visibleTransactions.slice(0, 5).map((txn) => (
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
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6 px-4">No transactions yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════
            TRANSACTIONS TAB — infinite scroll
        ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={txnFilterStatus} onValueChange={setTxnFilterStatus}>
              <SelectTrigger className="w-full sm:w-[200px]">
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
              {/* First-page loading skeleton */}
              {isLoading && visibleTransactions.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">Loading transactions…</p>
              ) : visibleTransactions?.length > 0 ? (
                <>
                  {/* ── Mobile: card-list ── */}
                  <div className="sm:hidden px-4 pb-2 pt-3">
                    {visibleTransactions.map((txn) => (
                      <TransactionCard key={txn._id} txn={txn} />
                    ))}
                  </div>

                  {/* ── Tablet (sm → xl) ── */}
                  <div className="hidden sm:block xl:hidden">
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
                        {visibleTransactions.map((txn) => (
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
                  </div>

                  {/* ── Desktop (xl+) ── */}
                  <div className="hidden xl:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transaction ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleTransactions.map((txn) => (
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
                           
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <p className="text-center py-8 text-muted-foreground text-sm px-4">No transactions found</p>
              )}

              {/* Loading more + sentinel */}
              {isLoadingMoreTxns && <LoadingMore text="Loading more transactions…" />}
              <div ref={txnSentinelRef} className="h-px w-full" aria-hidden="true" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════
            WITHDRAWALS TAB — infinite scroll
        ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="withdrawals" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {/* First-page loading skeleton */}
              {isLoading && withdrawals.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">Loading withdrawals…</p>
              ) : withdrawals?.length > 0 ? (
                <>
                  {/* ── Mobile: card-list ── */}
                  <div className="sm:hidden p-3 space-y-3">
                    {withdrawals.map((w) => (
                      <WithdrawalCard key={w._id} w={w} />
                    ))}
                  </div>

                  {/* ── Tablet (sm → xl) ── */}
                  <div className="hidden sm:block xl:hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {withdrawals.map((w) => (
                          <TableRow key={w._id}>
                            <TableCell className="font-mono text-xs">WD-{w._id?.slice(-6).toUpperCase()}</TableCell>
                            <TableCell className="font-medium">{currencyFormatter(w.amount)}</TableCell>
                            <TableCell className="text-sm capitalize">
                              {w.payoutMethod === "telebirr" ? "Telebirr" : w.payoutMethod === "bank" ? "Bank Transfer" : w.payoutMethod || "—"}
                            </TableCell>
                            <TableCell><StatusBadge status={w.status} /></TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDateShort(w.requestedAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* ── Desktop (xl+) ── */}
                  <div className="hidden xl:block">
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
                        {withdrawals.map((w) => (
                          <TableRow key={w._id}>
                            <TableCell className="font-mono text-xs">WD-{w._id?.slice(-6).toUpperCase()}</TableCell>
                            <TableCell className="text-sm">{formatDate(w.requestedAt)}</TableCell>
                            <TableCell className="font-medium">{currencyFormatter(w.amount)}</TableCell>
                            <TableCell className="text-sm capitalize">
                              {w.payoutMethod === "telebirr" ? "Telebirr" : w.payoutMethod === "bank" ? "Bank Transfer" : w.payoutMethod || "—"}
                            </TableCell>
                            <TableCell><StatusBadge status={w.status} /></TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                              {w.status === "REJECTED" && w.adminNote ? <span className="text-red-600">{w.adminNote}</span> : "—"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {w.processedAt ? formatDate(w.processedAt) : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <p className="text-center py-8 text-muted-foreground text-sm px-4">No withdrawal requests yet</p>
              )}

              {/* Loading more + sentinel */}
              {isLoadingMoreWds && <LoadingMore text="Loading more withdrawals…" />}
              <div ref={wdSentinelRef} className="h-px w-full" aria-hidden="true" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Withdrawal Dialog (unchanged) ─────────────────────────────────── */}
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

          {/* Step indicator */}
          <div className="flex items-center gap-2 py-1">
            {["method", "amount"].map((step, i) => {
              const active = dialogStep === step;
              const done   = dialogStep === "amount" && step === "method";
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

          {/* Step 1: Payout method */}
          {dialogStep === "method" && (
            <div className="space-y-4 py-2">
              {payoutConfigured ? (
                <>
                  <p className="text-sm text-muted-foreground">Your withdrawal will be sent to:</p>
                  <PayoutMethodCard settings={payoutSettings} />
                  <p className="text-xs text-muted-foreground">
                    Need to change this?{" "}
                    <button className="text-primary underline underline-offset-2"
                      onClick={() => { setDialogOpen(false); navigate("/vendor/payout-settings"); }}>
                      Update payout settings
                    </button>
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button className="flex-1 gap-2" onClick={() => setDialogStep("amount")}>
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
                    <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button className="flex-1 gap-2" onClick={() => { setDialogOpen(false); navigate("/vendor/payout-settings"); }}>
                      <Settings className="h-4 w-4" />Configure Now
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Amount */}
          {dialogStep === "amount" && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold text-green-600">{currencyFormatter(wallet?.availableBalance)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-300" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Withdrawal Amount (ETB) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number" placeholder="0.00" min="100" max={wallet?.availableBalance}
                  value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="text-lg font-semibold" autoFocus
                />
                <p className="text-xs text-muted-foreground">Minimum withdrawal: ETB 100.00</p>
              </div>
              {wallet?.availableBalance > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {[100, 500, 1000].filter((v) => v <= wallet.availableBalance).map((v) => (
                    <button key={v} type="button" onClick={() => setWithdrawAmount(String(v))}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary transition-colors font-medium">
                      ETB {v.toLocaleString()}
                    </button>
                  ))}
                  <button type="button" onClick={() => setWithdrawAmount(String(wallet.availableBalance.toFixed(2)))}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary transition-colors font-medium">
                    Max
                  </button>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setDialogStep("method")}>Back</Button>
                <Button className="flex-1 gap-2" onClick={handleWithdraw}
                  disabled={isSubmitting || !withdrawAmount || parseFloat(withdrawAmount) < 100 || parseFloat(withdrawAmount) > (wallet?.availableBalance || 0)}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
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
