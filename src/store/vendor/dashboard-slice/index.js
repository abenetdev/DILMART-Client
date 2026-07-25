import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = "http://localhost:5000/api/vendor/dashboard";

const initialState = {
  isLoading: false,
  data: null,
  error: null,
};

export const getDashboardData = createAsyncThunk(
  "vendorDashboard/getData",
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

const vendorDashboardSlice = createSlice({
  name: "vendorDashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getDashboardData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getDashboardData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload.data;
      })
      .addCase(getDashboardData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to load dashboard";
      });
  },
});

export default vendorDashboardSlice.reducer;
