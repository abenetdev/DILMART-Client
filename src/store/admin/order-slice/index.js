import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = "http://localhost:5000/api/admin/orders";

const initialState = {
  isListLoading: false,
  isSubmitting: false,
  orderList: [],
  orderDetails: null,
  error: null,
};

export const getAllOrdersForAdmin = createAsyncThunk(
  "adminOrder/getAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { status, paymentStatus, search, escrowPending } = params;
      const query = new URLSearchParams();
      if (status && status !== "all") query.set("status", status);
      if (paymentStatus && paymentStatus !== "all") query.set("paymentStatus", paymentStatus);
      if (search) query.set("search", search);
      if (escrowPending) query.set("escrowPending", "true");

      const url = query.toString() ? `${BASE}/get?${query}` : `${BASE}/get`;
      const response = await axios.get(url, { withCredentials: true });
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const getOrderDetailsForAdmin = createAsyncThunk(
  "adminOrder/getDetails",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE}/details/${id}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  "adminOrder/updateStatus",
  async ({ id, orderStatus }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${BASE}/update/${id}`,
        { orderStatus },
        { withCredentials: true }
      );
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const confirmEscrowRelease = createAsyncThunk(
  "adminOrder/confirmEscrowRelease",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE}/release-escrow/${id}`,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const rejectEscrowRelease = createAsyncThunk(
  "adminOrder/rejectEscrowRelease",
  async ({ id, adminNote }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE}/reject-escrow/${id}`,
        { adminNote },
        { withCredentials: true }
      );
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

const adminOrderSlice = createSlice({
  name: "adminOrder",
  initialState,
  reducers: {
    resetOrderDetails: (state) => {
      state.orderDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllOrdersForAdmin.pending, (state) => {
        state.isListLoading = true;
        state.error = null;
      })
      .addCase(getAllOrdersForAdmin.fulfilled, (state, action) => {
        state.isListLoading = false;
        state.orderList = action.payload?.data || [];
      })
      .addCase(getAllOrdersForAdmin.rejected, (state, action) => {
        state.isListLoading = false;
        state.error = action.payload?.message || "Failed to load orders";
      })
      .addCase(getOrderDetailsForAdmin.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(getOrderDetailsForAdmin.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.orderDetails = action.payload?.data || null;
      })
      .addCase(getOrderDetailsForAdmin.rejected, (state) => {
        state.isSubmitting = false;
        state.orderDetails = null;
      })
      .addCase(updateOrderStatus.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.isSubmitting = false;
        if (action.payload?.data) {
          state.orderDetails = action.payload.data;
          const idx = state.orderList.findIndex(
            (o) => o._id === action.payload.data._id
          );
          if (idx !== -1) state.orderList[idx] = action.payload.data;
        }
      })
      .addCase(updateOrderStatus.rejected, (state) => {
        state.isSubmitting = false;
      })
      .addCase(confirmEscrowRelease.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(confirmEscrowRelease.fulfilled, (state, action) => {
        state.isSubmitting = false;
        if (action.payload?.data) {
          state.orderDetails = action.payload.data;
          const idx = state.orderList.findIndex(
            (o) => o._id === action.payload.data._id
          );
          if (idx !== -1) state.orderList[idx] = action.payload.data;
        }
      })
      .addCase(confirmEscrowRelease.rejected, (state) => {
        state.isSubmitting = false;
      })
      .addCase(rejectEscrowRelease.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(rejectEscrowRelease.fulfilled, (state, action) => {
        state.isSubmitting = false;
        if (action.payload?.data) {
          state.orderDetails = action.payload.data;
          const idx = state.orderList.findIndex(
            (o) => o._id === action.payload.data._id
          );
          if (idx !== -1) state.orderList[idx] = action.payload.data;
        }
      })
      .addCase(rejectEscrowRelease.rejected, (state) => {
        state.isSubmitting = false;
      });
  },
});

export const { resetOrderDetails } = adminOrderSlice.actions;
export default adminOrderSlice.reducer;
