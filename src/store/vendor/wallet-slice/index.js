import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const BASE = "/api/vendor/wallet";

const initialState = {
  isLoading:         false,
  // ── Transactions infinite-scroll state ──────────────────────────────
  isLoadingMoreTxns: false,
  txnCurrentPage:    0,
  txnHasNextPage:    true,
  // ── Withdrawals infinite-scroll state ───────────────────────────────
  isLoadingMoreWds:  false,
  wdCurrentPage:     0,
  wdHasNextPage:     true,
  // ── Data ─────────────────────────────────────────────────────────────
  wallet:            null,
  transactions:      [],
  transactionsPagination: null,
  withdrawals:       [],
  earningsBreakdown: null,
  payoutSettings:    null,
  error:             null,
};

// ── Wallet ─────────────────────────────────────────────────────────────────

export const getWallet = createAsyncThunk(
  "vendorWallet/getWallet",
  async (vendorId, { rejectWithValue }) => {
    try {
      const url = vendorId ? `${BASE}?vendorId=${vendorId}` : BASE;
      const res = await axios.get(url, { withCredentials: true });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

// ── Transactions ──────────────────────────────────────────────────────────

// fetchTransactionsPage — page=1 replaces; page>1 appends
export const fetchTransactionsPage = createAsyncThunk(
  "vendorWallet/fetchTransactionsPage",
  async ({ page = 1, limit = 20, type, status } = {}, { rejectWithValue }) => {
    try {
      let url = `${BASE}/transactions?page=${page}&limit=${limit}`;
      if (type)   url += `&type=${type}`;
      if (status) url += `&status=${status}`;
      const res = await axios.get(url, { withCredentials: true });
      return { ...res.data, page, isFirstPage: page === 1 };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

// Kept for backward-compat (Overview tab recent 5, post-withdrawal refresh)
export const getTransactions = createAsyncThunk(
  "vendorWallet/getTransactions",
  async ({ vendorId, type, status, page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      let url = `${BASE}/transactions?page=${page}&limit=${limit}`;
      if (vendorId) url += `&vendorId=${vendorId}`;
      if (type)     url += `&type=${type}`;
      if (status)   url += `&status=${status}`;
      const res = await axios.get(url, { withCredentials: true });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

// ── Withdrawals ───────────────────────────────────────────────────────────

// fetchWithdrawalsPage — page=1 replaces; page>1 appends
export const fetchWithdrawalsPage = createAsyncThunk(
  "vendorWallet/fetchWithdrawalsPage",
  async ({ page = 1, limit = 20, status } = {}, { rejectWithValue }) => {
    try {
      let url = `${BASE}/withdrawals?page=${page}&limit=${limit}`;
      if (status) url += `&status=${status}`;
      const res = await axios.get(url, { withCredentials: true });
      return { ...res.data, page, isFirstPage: page === 1 };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

// Kept for post-withdrawal refresh
export const getWithdrawals = createAsyncThunk(
  "vendorWallet/getWithdrawals",
  async ({ vendorId, status } = {}, { getState, rejectWithValue }) => {
    try {
      const { wdCurrentPage } = getState().vendorWallet;
      const pagesLoaded = Math.max(1, wdCurrentPage);
      let url = `${BASE}/withdrawals?page=1&limit=${pagesLoaded * 20}`;
      if (vendorId) url += `&vendorId=${vendorId}`;
      if (status)   url += `&status=${status}`;
      const res = await axios.get(url, { withCredentials: true });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const requestWithdrawal = createAsyncThunk(
  "vendorWallet/requestWithdrawal",
  async ({ vendorId, amount }, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${BASE}/withdraw`,
        { vendorId, amount },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const getEarningsBreakdown = createAsyncThunk(
  "vendorWallet/getEarningsBreakdown",
  async (vendorId, { rejectWithValue }) => {
    try {
      const url = vendorId ? `${BASE}/earnings-breakdown?vendorId=${vendorId}` : `${BASE}/earnings-breakdown`;
      const res = await axios.get(url, { withCredentials: true });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const getPayoutSettings = createAsyncThunk(
  "vendorWallet/getPayoutSettings",
  async (vendorId, { rejectWithValue }) => {
    try {
      const url = vendorId ? `${BASE}/payout-settings?vendorId=${vendorId}` : `${BASE}/payout-settings`;
      const res = await axios.get(url, { withCredentials: true });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const updatePayoutSettings = createAsyncThunk(
  "vendorWallet/updatePayoutSettings",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axios.put(`${BASE}/payout-settings`, data, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────

const vendorWalletSlice = createSlice({
  name: "vendorWallet",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetTransactions: (state) => {
      state.transactions      = [];
      state.txnCurrentPage    = 0;
      state.txnHasNextPage    = true;
      state.isLoadingMoreTxns = false;
    },
    resetWithdrawals: (state) => {
      state.withdrawals       = [];
      state.wdCurrentPage     = 0;
      state.wdHasNextPage     = true;
      state.isLoadingMoreWds  = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── getWallet ──────────────────────────────────────────────────────
      .addCase(getWallet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getWallet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.wallet = action.payload.data;
      })
      .addCase(getWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to load wallet";
      })

      // ── fetchTransactionsPage ──────────────────────────────────────────
      .addCase(fetchTransactionsPage.pending, (state, action) => {
        const isFirst = (action.meta.arg?.page ?? 1) === 1;
        if (isFirst) {
          state.isLoading  = true;
          state.transactions = [];
        } else {
          state.isLoadingMoreTxns = true;
        }
        state.error = null;
      })
      .addCase(fetchTransactionsPage.fulfilled, (state, action) => {
        const { data = [], pagination, page, isFirstPage } = action.payload;
        const hasNext = pagination
          ? pagination.page < pagination.pages
          : false;

        if (isFirstPage) {
          state.transactions = data;
          state.isLoading    = false;
        } else {
          const existingIds = new Set(state.transactions.map((t) => t._id));
          const fresh = data.filter((t) => !existingIds.has(t._id));
          state.transactions      = [...state.transactions, ...fresh];
          state.isLoadingMoreTxns = false;
        }
        state.txnCurrentPage         = page;
        state.txnHasNextPage         = hasNext;
        state.transactionsPagination = pagination || null;
      })
      .addCase(fetchTransactionsPage.rejected, (state, action) => {
        state.isLoading         = false;
        state.isLoadingMoreTxns = false;
        state.error = action.payload?.message || "Failed to load transactions";
      })

      // ── getTransactions (legacy / overview tab) ────────────────────────
      .addCase(getTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTransactions.fulfilled, (state, action) => {
        state.isLoading              = false;
        state.transactions           = action.payload.data;
        state.transactionsPagination = action.payload.pagination;
      })
      .addCase(getTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to load transactions";
      })

      // ── fetchWithdrawalsPage ───────────────────────────────────────────
      .addCase(fetchWithdrawalsPage.pending, (state, action) => {
        const isFirst = (action.meta.arg?.page ?? 1) === 1;
        if (isFirst) {
          state.isLoading   = true;
          state.withdrawals = [];
        } else {
          state.isLoadingMoreWds = true;
        }
        state.error = null;
      })
      .addCase(fetchWithdrawalsPage.fulfilled, (state, action) => {
        const { data = [], hasNextPage = false, page, isFirstPage } = action.payload;

        if (isFirstPage) {
          state.withdrawals = data;
          state.isLoading   = false;
        } else {
          const existingIds = new Set(state.withdrawals.map((w) => w._id));
          const fresh = data.filter((w) => !existingIds.has(w._id));
          state.withdrawals      = [...state.withdrawals, ...fresh];
          state.isLoadingMoreWds = false;
        }
        state.wdCurrentPage = page;
        state.wdHasNextPage = hasNextPage;
      })
      .addCase(fetchWithdrawalsPage.rejected, (state, action) => {
        state.isLoading        = false;
        state.isLoadingMoreWds = false;
        state.error = action.payload?.message || "Failed to load withdrawals";
      })

      // ── getWithdrawals (legacy / post-mutation refresh) ────────────────
      .addCase(getWithdrawals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getWithdrawals.fulfilled, (state, action) => {
        state.isLoading   = false;
        state.withdrawals = action.payload.data;
        if (action.payload?.hasNextPage !== undefined) {
          state.wdHasNextPage = action.payload.hasNextPage;
        }
      })
      .addCase(getWithdrawals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to load withdrawals";
      })

      // ── requestWithdrawal ──────────────────────────────────────────────
      .addCase(requestWithdrawal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestWithdrawal.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(requestWithdrawal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Withdrawal request failed";
      })

      // ── getEarningsBreakdown ───────────────────────────────────────────
      .addCase(getEarningsBreakdown.fulfilled, (state, action) => {
        state.earningsBreakdown = action.payload.data;
      })

      // ── getPayoutSettings ──────────────────────────────────────────────
      .addCase(getPayoutSettings.fulfilled, (state, action) => {
        state.payoutSettings = action.payload.data;
      })

      // ── updatePayoutSettings ───────────────────────────────────────────
      .addCase(updatePayoutSettings.fulfilled, (state, action) => {
        state.payoutSettings = action.payload.data;
      });
  },
});

export const { clearError, resetTransactions, resetWithdrawals } = vendorWalletSlice.actions;
export default vendorWalletSlice.reducer;
