import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = "http://localhost:5000/api/vendor/orders";

const initialState = {
  isListLoading:  false,
  isSubmitting:   false,
  orderList:      [],
  orderDetails:   null,
  orderStats:     null,
  error:          null,
};

// ── Read thunks ────────────────────────────────────────────────────────────

export const getAllOrdersForVendor = createAsyncThunk(
  "/vendor/order/getAllOrdersForVendor",
  async (params = {}) => {
    const { status, search, startDate, endDate } = params;
    const query = [];
    if (status && status !== "all") query.push(`status=${status}`);
    if (search)     query.push(`search=${encodeURIComponent(search)}`);
    if (startDate)  query.push(`startDate=${startDate}`);
    if (endDate)    query.push(`endDate=${endDate}`);
    const url = `${BASE}/get${query.length ? "?" + query.join("&") : ""}`;
    const response = await axios.get(url, { withCredentials: true });
    return response.data;
  }
);

export const getOrderDetailsForVendor = createAsyncThunk(
  "/vendor/order/getOrderDetailsForVendor",
  async (id) => {
    const response = await axios.get(`${BASE}/details/${id}`, { withCredentials: true });
    return response.data;
  }
);

export const getOrderStats = createAsyncThunk(
  "/vendor/order/getOrderStats",
  async () => {
    const response = await axios.get(`${BASE}/stats`, { withCredentials: true });
    return response.data;
  }
);

// ── Action thunks (state-machine based) ───────────────────────────────────

export const acceptOrder = createAsyncThunk(
  "/vendor/order/acceptOrder",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE}/${id}/accept`, {}, { withCredentials: true });
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const processOrder = createAsyncThunk(
  "/vendor/order/processOrder",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE}/${id}/process`, {}, { withCredentials: true });
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const shipOrder = createAsyncThunk(
  "/vendor/order/shipOrder",
  async ({ id, courierName = "", trackingNumber = "", shippedDate }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE}/${id}/ship`,
        { courierName, trackingNumber, shippedDate },
        { withCredentials: true }
      );
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────

const vendorOrderSlice = createSlice({
  name: "vendorOrder",
  initialState,
  reducers: {
    resetOrderDetails: (state) => {
      state.orderDetails = null;
    },
  },
  extraReducers: (builder) => {
    // ── getAllOrdersForVendor
    builder
      .addCase(getAllOrdersForVendor.pending, (state) => {
        state.isListLoading = true;
        state.error = null;
      })
      .addCase(getAllOrdersForVendor.fulfilled, (state, action) => {
        state.isListLoading = false;
        state.orderList = action.payload?.data || [];
      })
      .addCase(getAllOrdersForVendor.rejected, (state, action) => {
        state.isListLoading = false;
        state.error = action.error?.message || "Failed to load orders";
      });

    // ── getOrderDetailsForVendor
    builder
      .addCase(getOrderDetailsForVendor.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(getOrderDetailsForVendor.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.orderDetails = action.payload.data;
      })
      .addCase(getOrderDetailsForVendor.rejected, (state) => {
        state.isSubmitting = false;
        state.orderDetails = null;
      });

    // ── getOrderStats
    builder
      .addCase(getOrderStats.pending, (state) => { state.isSubmitting = true; })
      .addCase(getOrderStats.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.orderStats = action.payload.data;
      })
      .addCase(getOrderStats.rejected, (state) => { state.isSubmitting = false; });

    // ── Shared handler for all action thunks (they all return the updated order)
    const handleActionPending  = (state) => { state.isSubmitting = true; };
    const handleActionFulfilled = (state, action) => {
      state.isSubmitting = false;
      if (action.payload?.data) {
        state.orderDetails = action.payload.data;
        // Also update the order in the list if it's there
        const idx = state.orderList.findIndex((o) => o._id === action.payload.data._id);
        if (idx !== -1) state.orderList[idx] = action.payload.data;
      }
    };
    const handleActionRejected = (state) => { state.isSubmitting = false; };

    builder
      .addCase(acceptOrder.pending,  handleActionPending)
      .addCase(acceptOrder.fulfilled, handleActionFulfilled)
      .addCase(acceptOrder.rejected,  handleActionRejected)

      .addCase(processOrder.pending,  handleActionPending)
      .addCase(processOrder.fulfilled, handleActionFulfilled)
      .addCase(processOrder.rejected,  handleActionRejected)

      .addCase(shipOrder.pending,  handleActionPending)
      .addCase(shipOrder.fulfilled, handleActionFulfilled)
      .addCase(shipOrder.rejected,  handleActionRejected);
  },
});

export const { resetOrderDetails } = vendorOrderSlice.actions;
export default vendorOrderSlice.reducer;
