import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = "http://localhost:5000/api/vendor/wallet";

const initialState = {
  isLoading: false,
  wallet: null,
  transactions: [],
  transactionsPagination: null,
  withdrawals: [],
  earningsBreakdown: null,
  payoutSettings: null,
  error: null,
};

// ── Thunks ─────────────────────────────────────────────────────────────────

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

export const getWithdrawals = createAsyncThunk(
  "vendorWallet/getWithdrawals",
  async ({ vendorId, status } = {}, { rejectWithValue }) => {
    try {
      let url = `${BASE}/withdrawals`;
      const params = [];
      if (vendorId) params.push(`vendorId=${vendorId}`);
      if (status)   params.push(`status=${status}`);
      if (params.length) url += `?${params.join("&")}`;
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
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
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
  },
  extraReducers: (builder) => {
    builder
      // getWallet
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

      // getTransactions
      .addCase(getTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload.data;
        state.transactionsPagination = action.payload.pagination;
      })
      .addCase(getTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to load transactions";
      })

      // getWithdrawals
      .addCase(getWithdrawals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getWithdrawals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.withdrawals = action.payload.data;
      })
      .addCase(getWithdrawals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to load withdrawals";
      })

      // requestWithdrawal
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

      // getEarningsBreakdown
      .addCase(getEarningsBreakdown.fulfilled, (state, action) => {
        state.earningsBreakdown = action.payload.data;
      })

      // getPayoutSettings
      .addCase(getPayoutSettings.fulfilled, (state, action) => {
        state.payoutSettings = action.payload.data;
      })

      // updatePayoutSettings
      .addCase(updatePayoutSettings.fulfilled, (state, action) => {
        state.payoutSettings = action.payload.data;
      });
  },
});

export const { clearError } = vendorWalletSlice.actions;
export default vendorWalletSlice.reducer;
