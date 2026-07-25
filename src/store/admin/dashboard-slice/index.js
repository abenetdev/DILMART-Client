import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = "http://localhost:5000/api/admin/dashboard";

const initialState = {
  isLoading: false,
  data: null,
  error: null,
};

export const getAdminDashboardData = createAsyncThunk(
  "adminDashboard/getData",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(BASE, { withCredentials: true });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

const adminDashboardSlice = createSlice({
  name: "adminDashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAdminDashboardData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAdminDashboardData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload.data;
      })
      .addCase(getAdminDashboardData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to load dashboard";
      });
  },
});

export default adminDashboardSlice.reducer;
