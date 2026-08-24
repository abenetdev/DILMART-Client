import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const BASE = "/api/admin/orders";

const initialState = {
  isListLoading: false,
  isSubmitting:  false,
  orderList:     [],   // one grouped-order object per customer checkout
  orderDetails:  null, // one grouped-order object (full detail)
  error:         null,
};

// ── Thunks ─────────────────────────────────────────────────────────────────

export const getAllOrdersForAdmin = createAsyncThunk(
  "adminOrder/getAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { status, paymentStatus, search, escrowPending, awaitingCustomer } = params;
      const q = new URLSearchParams();
      if (status        && status        !== "all") q.set("status",        status);
      if (paymentStatus && paymentStatus !== "all") q.set("paymentStatus", paymentStatus);
      if (search)           q.set("search",          search);
      if (escrowPending)    q.set("escrowPending",    "true");
      if (awaitingCustomer) q.set("awaitingCustomer", "true");
      const url = q.toString() ? `${BASE}/get?${q}` : `${BASE}/get`;
      const res = await axios.get(url, { withCredentials: true });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

// :id = orderGroupId (preferred) or sub-order _id (fallback)
export const getOrderDetailsForAdmin = createAsyncThunk(
  "adminOrder/getDetails",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE}/details/${id}`, { withCredentials: true });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

// :id = sub-order _id (vendor-level status update)
export const updateOrderStatus = createAsyncThunk(
  "adminOrder/updateStatus",
  async ({ id, orderStatus }, { rejectWithValue }) => {
    try {
      const res = await axios.put(
        `${BASE}/update/${id}`,
        { orderStatus },
        { withCredentials: true }
      );
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

// :id = sub-order _id
export const confirmEscrowRelease = createAsyncThunk(
  "adminOrder/confirmEscrow",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${BASE}/release-escrow/${id}`, {}, { withCredentials: true });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

// :id = sub-order _id
export const rejectEscrowRelease = createAsyncThunk(
  "adminOrder/rejectEscrow",
  async ({ id, adminNote }, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${BASE}/reject-escrow/${id}`,
        { adminNote },
        { withCredentials: true }
      );
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

// ── Helper: merge updated grouped order back into the list ─────────────────
function mergeIntoList(list, updated) {
  if (!updated) return list;
  const idx = list.findIndex((o) => o._id === updated._id || o.orderGroupId === updated.orderGroupId);
  if (idx !== -1) {
    const next = [...list];
    next[idx]  = updated;
    return next;
  }
  return list;
}

// ── Slice ──────────────────────────────────────────────────────────────────
const adminOrderSlice = createSlice({
  name: "adminOrder",
  initialState,
  reducers: {
    resetOrderDetails: (state) => { state.orderDetails = null; },
  },
  extraReducers: (builder) => {
    // ── getAll ──
    builder
      .addCase(getAllOrdersForAdmin.pending,   (s) => { s.isListLoading = true;  s.error = null; })
      .addCase(getAllOrdersForAdmin.fulfilled, (s, a) => {
        s.isListLoading = false;
        s.orderList     = a.payload?.data || [];
      })
      .addCase(getAllOrdersForAdmin.rejected,  (s, a) => {
        s.isListLoading = false;
        s.error         = a.payload?.message || "Failed to load orders";
      });

    // ── getDetails ──
    builder
      .addCase(getOrderDetailsForAdmin.pending,   (s) => { s.isSubmitting = true; })
      .addCase(getOrderDetailsForAdmin.fulfilled, (s, a) => {
        s.isSubmitting = false;
        s.orderDetails = a.payload?.data || null;
      })
      .addCase(getOrderDetailsForAdmin.rejected,  (s) => {
        s.isSubmitting = false;
        s.orderDetails = null;
      });

    // ── updateStatus / confirmEscrow / rejectEscrow ──
    // All three return the updated grouped order → patch both orderDetails and the list row
    const mutationHandlers = [updateOrderStatus, confirmEscrowRelease, rejectEscrowRelease];
    mutationHandlers.forEach((thunk) => {
      builder
        .addCase(thunk.pending,   (s) => { s.isSubmitting = true; })
        .addCase(thunk.fulfilled, (s, a) => {
          s.isSubmitting = false;
          const updated  = a.payload?.data || null;
          if (updated) {
            s.orderDetails = updated;
            s.orderList    = mergeIntoList(s.orderList, updated);
          }
        })
        .addCase(thunk.rejected,  (s) => { s.isSubmitting = false; });
    });
  },
});

export const { resetOrderDetails } = adminOrderSlice.actions;
export default adminOrderSlice.reducer;
