import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";
import { patchUserInState } from "@/store/auth-slice";

const BASE = "/api/shop/seller";

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
      // formData is a native FormData object (supports file upload)
      const res = await axios.post(`${BASE}/apply`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
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
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const res = await axios.get(`${BASE}/status`, { withCredentials: true });
      // If the DB role is vendor, sync it into the auth slice immediately.
      // This handles the case where the JWT still carries role:"user" from
      // before the vendor promotion was approved.
      const dbRole = res.data?.data?.role;
      if (dbRole) {
        dispatch(patchUserInState({ role: dbRole }));
      }
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
