import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = "http://localhost:5000/api/shop/seller";

const initialState = {
  isLoading:    false,
  sellerStatus: null,   // null | "pending" | "active" | "rejected"
  application:  null,
  error:        null,
};

export const applyToBecomeSeller = createAsyncThunk(
  "shopSeller/apply",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${BASE}/apply`, formData, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const getSellerStatus = createAsyncThunk(
  "shopSeller/getStatus",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE}/status`, { withCredentials: true });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

const shopSellerSlice = createSlice({
  name: "shopSeller",
  initialState,
  reducers: {
    clearSellerError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(applyToBecomeSeller.pending,   (s) => { s.isLoading = true;  s.error = null; })
      .addCase(applyToBecomeSeller.fulfilled, (s, a) => {
        s.isLoading    = false;
        s.sellerStatus = a.payload.sellerStatus;
      })
      .addCase(applyToBecomeSeller.rejected,  (s, a) => {
        s.isLoading = false;
        s.error = a.payload?.message || "Application failed";
      })

      .addCase(getSellerStatus.pending,   (s) => { s.isLoading = true; })
      .addCase(getSellerStatus.fulfilled, (s, a) => {
        s.isLoading    = false;
        s.sellerStatus = a.payload.data?.sellerStatus;
        s.application  = a.payload.data?.application;
      })
      .addCase(getSellerStatus.rejected,  (s) => { s.isLoading = false; });
  },
});

export const { clearSellerError } = shopSellerSlice.actions;
export default shopSellerSlice.reducer;
