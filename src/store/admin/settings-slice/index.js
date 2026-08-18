import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const BASE = "/api/admin/settings";

const initialState = {
  isLoading:     false,
  isSaving:      false,
  commissionRate: null,    // number (percentage)
  commissionHistory: [],
  updatedAt:     null,
  error:         null,
};

// GET /api/admin/settings/commission
export const fetchCommissionSettings = createAsyncThunk(
  "adminSettings/fetchCommission",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE}/commission`, { withCredentials: true });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

// PUT /api/admin/settings/commission
export const updateCommissionSettings = createAsyncThunk(
  "adminSettings/updateCommission",
  async ({ commissionRate, note }, { rejectWithValue }) => {
    try {
      const res = await axios.put(
        `${BASE}/commission`,
        { commissionRate, note },
        { withCredentials: true }
      );
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

const adminSettingsSlice = createSlice({
  name: "adminSettings",
  initialState,
  reducers: {
    clearSettingsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchCommissionSettings.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchCommissionSettings.fulfilled, (state, action) => {
        state.isLoading          = false;
        state.commissionRate     = action.payload?.data?.commissionRate     ?? null;
        state.commissionHistory  = action.payload?.data?.commissionHistory  ?? [];
        state.updatedAt          = action.payload?.data?.updatedAt          ?? null;
      })
      .addCase(fetchCommissionSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload?.message || "Failed to load settings";
      })
      // update
      .addCase(updateCommissionSettings.pending, (state) => {
        state.isSaving = true;
        state.error    = null;
      })
      .addCase(updateCommissionSettings.fulfilled, (state, action) => {
        state.isSaving           = false;
        state.commissionRate     = action.payload?.data?.commissionRate     ?? state.commissionRate;
        state.commissionHistory  = action.payload?.data?.commissionHistory  ?? state.commissionHistory;
        state.updatedAt          = action.payload?.data?.updatedAt          ?? state.updatedAt;
      })
      .addCase(updateCommissionSettings.rejected, (state, action) => {
        state.isSaving = false;
        state.error    = action.payload?.message || "Failed to save settings";
      });
  },
});

export const { clearSettingsError } = adminSettingsSlice.actions;
export default adminSettingsSlice.reducer;
