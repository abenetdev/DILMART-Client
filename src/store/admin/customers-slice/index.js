import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const BASE = "/api/admin/customers";
const cfg  = { withCredentials: true };

// ── Thunks ─────────────────────────────────────────────────────────────────

export const fetchAllCustomers = createAsyncThunk(
  "adminCustomers/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
      const res = await axios.get(`${BASE}?${q}`, cfg);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const fetchCustomerById = createAsyncThunk(
  "adminCustomers/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE}/${id}`, cfg);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const updateCustomer = createAsyncThunk(
  "adminCustomers/update",
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${BASE}/${id}`, data, { ...cfg, headers: { "Content-Type": "application/json" } });
      return { ...res.data, id };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const suspendCustomer = createAsyncThunk(
  "adminCustomers/suspend",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${BASE}/${id}/suspend`, {}, cfg);
      return { ...res.data, id };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const activateCustomer = createAsyncThunk(
  "adminCustomers/activate",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${BASE}/${id}/activate`, {}, cfg);
      return { ...res.data, id };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const resetCustomerPassword = createAsyncThunk(
  "adminCustomers/resetPassword",
  async ({ id, newPassword }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${BASE}/${id}/reset-password`, { newPassword },
        { ...cfg, headers: { "Content-Type": "application/json" } });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const forceLogoutCustomer = createAsyncThunk(
  "adminCustomers/forceLogout",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${BASE}/${id}/force-logout`, {}, cfg);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const deleteCustomer = createAsyncThunk(
  "adminCustomers/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.delete(`${BASE}/${id}`, cfg);
      return { ...res.data, id };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const deleteCustomerReview = createAsyncThunk(
  "adminCustomers/deleteReview",
  async ({ customerId, reviewId }, { rejectWithValue }) => {
    try {
      const res = await axios.delete(`${BASE}/${customerId}/reviews/${reviewId}`, cfg);
      return { ...res.data, reviewId };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────

const adminCustomersSlice = createSlice({
  name: "adminCustomers",
  initialState: {
    isListLoading:    false,
    isDetailLoading:  false,
    isSubmitting:     false,
    customerList:     [],
    customerDetails:  null,
    pagination:       null,
    stats:            null,
    error:            null,
  },
  reducers: {
    clearCustomerDetails: (state) => { state.customerDetails = null; },
    clearError:           (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchAllCustomers.pending,    (s) => { s.isListLoading = true; s.error = null; })
      .addCase(fetchAllCustomers.fulfilled,  (s, a) => {
        s.isListLoading = false;
        s.customerList  = a.payload.data || [];
        s.pagination    = a.payload.pagination || null;
        s.stats         = a.payload.stats || null;
      })
      .addCase(fetchAllCustomers.rejected,   (s, a) => { s.isListLoading = false; s.error = a.payload?.message; })

      // fetchById
      .addCase(fetchCustomerById.pending,    (s) => { s.isDetailLoading = true; })
      .addCase(fetchCustomerById.fulfilled,  (s, a) => { s.isDetailLoading = false; s.customerDetails = a.payload.data; })
      .addCase(fetchCustomerById.rejected,   (s) => { s.isDetailLoading = false; })

      // suspend
      .addCase(suspendCustomer.pending,  (s) => { s.isSubmitting = true; })
      .addCase(suspendCustomer.fulfilled,(s, a) => {
        s.isSubmitting = false;
        const c = s.customerList.find((x) => x._id === a.payload.id);
        if (c) c.accountStatus = "deactivated";
        if (s.customerDetails?.profile?._id === a.payload.id)
          s.customerDetails.profile.accountStatus = "deactivated";
      })
      .addCase(suspendCustomer.rejected, (s) => { s.isSubmitting = false; })

      // activate
      .addCase(activateCustomer.pending,  (s) => { s.isSubmitting = true; })
      .addCase(activateCustomer.fulfilled,(s, a) => {
        s.isSubmitting = false;
        const c = s.customerList.find((x) => x._id === a.payload.id);
        if (c) c.accountStatus = "active";
        if (s.customerDetails?.profile?._id === a.payload.id)
          s.customerDetails.profile.accountStatus = "active";
      })
      .addCase(activateCustomer.rejected, (s) => { s.isSubmitting = false; })

      // delete
      .addCase(deleteCustomer.pending,   (s) => { s.isSubmitting = true; })
      .addCase(deleteCustomer.fulfilled, (s, a) => {
        s.isSubmitting  = false;
        s.customerList  = s.customerList.filter((x) => x._id !== a.payload.id);
      })
      .addCase(deleteCustomer.rejected,  (s) => { s.isSubmitting = false; })

      // deleteReview
      .addCase(deleteCustomerReview.pending,   (s) => { s.isSubmitting = true; })
      .addCase(deleteCustomerReview.fulfilled, (s, a) => {
        s.isSubmitting = false;
        if (s.customerDetails?.reviews)
          s.customerDetails.reviews = s.customerDetails.reviews.filter((r) => r._id !== a.payload.reviewId);
      })
      .addCase(deleteCustomerReview.rejected,  (s) => { s.isSubmitting = false; })

      // others — just flip isSubmitting
      .addMatcher(
        (action) => ["adminCustomers/update", "adminCustomers/resetPassword",
          "adminCustomers/forceLogout"].some((t) => action.type.startsWith(t)),
        (s, a) => {
          if (a.type.endsWith("/pending"))   s.isSubmitting = true;
          if (a.type.endsWith("/fulfilled")) s.isSubmitting = false;
          if (a.type.endsWith("/rejected"))  s.isSubmitting = false;
        }
      );
  },
});

export const { clearCustomerDetails, clearError } = adminCustomersSlice.actions;
export default adminCustomersSlice.reducer;
