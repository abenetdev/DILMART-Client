import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = "http://localhost:5000/api/admin/withdrawals";

const initialState = {
  isListLoading: false,
  isSubmitting: false,
  withdrawalList: [],
  withdrawalDetails: null,
  error: null,
};

export const fetchAllWithdrawals = createAsyncThunk(
  "adminWithdrawals/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { status, search } = params;
      const query = new URLSearchParams();
      if (status && status !== "all") query.set("status", status);
      if (search) query.set("search", search);

      const url = query.toString() ? `${BASE}?${query}` : BASE;
      const res = await axios.get(url, { withCredentials: true });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const getWithdrawalById = createAsyncThunk(
  "adminWithdrawals/getById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE}/${id}`, { withCredentials: true });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const approveWithdrawal = createAsyncThunk(
  "adminWithdrawals/approve",
  async ({ id, adminNote }, { rejectWithValue }) => {
    try {
      const res = await axios.put(
        `${BASE}/${id}/approve`,
        { adminNote },
        { withCredentials: true }
      );
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const rejectWithdrawal = createAsyncThunk(
  "adminWithdrawals/reject",
  async ({ id, adminNote }, { rejectWithValue }) => {
    try {
      const res = await axios.put(
        `${BASE}/${id}/reject`,
        { adminNote },
        { withCredentials: true }
      );
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

const adminWithdrawalsSlice = createSlice({
  name: "adminWithdrawals",
  initialState,
  reducers: {
    clearWithdrawalDetails: (state) => {
      state.withdrawalDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllWithdrawals.pending, (state) => {
        state.isListLoading = true;
        state.error = null;
      })
      .addCase(fetchAllWithdrawals.fulfilled, (state, action) => {
        state.isListLoading = false;
        state.withdrawalList = action.payload?.data || [];
      })
      .addCase(fetchAllWithdrawals.rejected, (state, action) => {
        state.isListLoading = false;
        state.error = action.payload?.message || "Failed to load withdrawals";
      })
      .addCase(getWithdrawalById.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(getWithdrawalById.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.withdrawalDetails = action.payload?.data || null;
      })
      .addCase(getWithdrawalById.rejected, (state) => {
        state.isSubmitting = false;
        state.withdrawalDetails = null;
      })
      .addCase(approveWithdrawal.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(approveWithdrawal.fulfilled, (state, action) => {
        state.isSubmitting = false;
        if (action.payload?.data) {
          const idx = state.withdrawalList.findIndex(
            (w) => w._id === action.payload.data._id
          );
          if (idx !== -1) state.withdrawalList[idx] = action.payload.data;
          state.withdrawalDetails = action.payload.data;
        }
      })
      .addCase(approveWithdrawal.rejected, (state) => {
        state.isSubmitting = false;
      })
      .addCase(rejectWithdrawal.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(rejectWithdrawal.fulfilled, (state, action) => {
        state.isSubmitting = false;
        if (action.payload?.data) {
          const idx = state.withdrawalList.findIndex(
            (w) => w._id === action.payload.data._id
          );
          if (idx !== -1) state.withdrawalList[idx] = action.payload.data;
          state.withdrawalDetails = action.payload.data;
        }
      })
      .addCase(rejectWithdrawal.rejected, (state) => {
        state.isSubmitting = false;
      });
  },
});

export const { clearWithdrawalDetails } = adminWithdrawalsSlice.actions;
export default adminWithdrawalsSlice.reducer;
