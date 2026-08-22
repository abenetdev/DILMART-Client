import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const BASE = "/api/vendor/orders";

const initialState = {
  isListLoading:  false,   // true only on the very first page load
  isLoadingMore:  false,   // true while appending subsequent pages
  isSubmitting:   false,
  orderList:      [],
  orderDetails:   null,
  orderStats:     null,
  error:          null,

  // ── Infinite-scroll pagination state ──────────────────────────────────
  currentPage:  0,          // last successfully fetched page (0 = none yet)
  hasNextPage:  true,       // whether the API says more pages exist
};

// ── Helper: build query string ─────────────────────────────────────────────
function buildQS({ status, search, startDate, endDate, page = 1, limit = 20 } = {}) {
  const p = [];
  if (status && status !== "all") p.push(`status=${encodeURIComponent(status)}`);
  if (search)    p.push(`search=${encodeURIComponent(search)}`);
  if (startDate) p.push(`startDate=${startDate}`);
  if (endDate)   p.push(`endDate=${endDate}`);
  p.push(`page=${page}`);
  p.push(`limit=${limit}`);
  return p.join("&");
}

// ── fetchOrdersPage — loads one page and APPENDS to orderList ─────────────
// Used by the infinite-scroll logic. page=1 replaces the list; page>1 appends.
export const fetchOrdersPage = createAsyncThunk(
  "/vendor/order/fetchOrdersPage",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 20, status, search, startDate, endDate } = params;
      const qs = buildQS({ status, search, startDate, endDate, page, limit });
      const response = await axios.get(`${BASE}/get?${qs}`, { withCredentials: true });
      return { ...response.data, page, isFirstPage: page === 1 };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

// ── getAllOrdersForVendor — kept for backwards compat / post-mutation refresh
export const getAllOrdersForVendor = createAsyncThunk(
  "/vendor/order/getAllOrdersForVendor",
  async (params = {}, { getState }) => {
    const { currentPage } = getState().vendorOrder;
    const { status, search, startDate, endDate } = params;
    const pagesLoaded = Math.max(1, currentPage);
    const qs = buildQS({ status, search, startDate, endDate, page: 1, limit: pagesLoaded * 20 });
    const response = await axios.get(`${BASE}/get?${qs}`, { withCredentials: true });
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

// ── Action thunks ─────────────────────────────────────────────────────────

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
    // Called by the Orders page when filters/search change so the next
    // fetchOrdersPage(page=1) starts clean.
    resetOrders: (state) => {
      state.orderList     = [];
      state.currentPage   = 0;
      state.hasNextPage   = true;
      state.isListLoading = false;
      state.isLoadingMore = false;
      state.error         = null;
    },
  },
  extraReducers: (builder) => {
    // ── fetchOrdersPage ──────────────────────────────────────────────────
    builder
      .addCase(fetchOrdersPage.pending, (state, action) => {
        const isFirst = (action.meta.arg?.page ?? 1) === 1;
        if (isFirst) {
          state.isListLoading = true;
          state.orderList     = [];
        } else {
          state.isLoadingMore = true;
        }
        state.error = null;
      })
      .addCase(fetchOrdersPage.fulfilled, (state, action) => {
        const { data = [], hasNextPage = false, page, isFirstPage } = action.payload;

        if (isFirstPage) {
          state.orderList     = data;
          state.isListLoading = false;
        } else {
          // Append and dedup by _id
          const existingIds = new Set(state.orderList.map((o) => o._id));
          const fresh = data.filter((o) => !existingIds.has(o._id));
          state.orderList     = [...state.orderList, ...fresh];
          state.isLoadingMore = false;
        }

        state.currentPage = page;
        state.hasNextPage = hasNextPage;
      })
      .addCase(fetchOrdersPage.rejected, (state, action) => {
        state.isListLoading = false;
        state.isLoadingMore = false;
        state.error = action.payload?.message || "Failed to load orders";
      });

    // ── getAllOrdersForVendor (post-mutation refresh) ─────────────────────
    builder
      .addCase(getAllOrdersForVendor.pending, (state) => {
        state.isListLoading = true;
        state.error = null;
      })
      .addCase(getAllOrdersForVendor.fulfilled, (state, action) => {
        state.isListLoading = false;
        state.orderList     = action.payload?.data || [];
        if (action.payload?.hasNextPage !== undefined) {
          state.hasNextPage = action.payload.hasNextPage;
        }
      })
      .addCase(getAllOrdersForVendor.rejected, (state, action) => {
        state.isListLoading = false;
        state.error = action.error?.message || "Failed to load orders";
      });

    // ── getOrderDetailsForVendor ─────────────────────────────────────────
    builder
      .addCase(getOrderDetailsForVendor.pending, (state) => { state.isSubmitting = true; })
      .addCase(getOrderDetailsForVendor.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.orderDetails = action.payload.data;
      })
      .addCase(getOrderDetailsForVendor.rejected, (state) => {
        state.isSubmitting = false;
        state.orderDetails = null;
      });

    // ── getOrderStats ────────────────────────────────────────────────────
    builder
      .addCase(getOrderStats.pending,   (state) => { state.isSubmitting = true; })
      .addCase(getOrderStats.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.orderStats = action.payload.data;
      })
      .addCase(getOrderStats.rejected,  (state) => { state.isSubmitting = false; });

    // ── Shared handler for action thunks ─────────────────────────────────
    const handleActionPending   = (state) => { state.isSubmitting = true; };
    const handleActionFulfilled = (state, action) => {
      state.isSubmitting = false;
      if (action.payload?.data) {
        state.orderDetails = action.payload.data;
        const idx = state.orderList.findIndex((o) => o._id === action.payload.data._id);
        if (idx !== -1) state.orderList[idx] = action.payload.data;
      }
    };
    const handleActionRejected  = (state) => { state.isSubmitting = false; };

    builder
      .addCase(acceptOrder.pending,   handleActionPending)
      .addCase(acceptOrder.fulfilled, handleActionFulfilled)
      .addCase(acceptOrder.rejected,  handleActionRejected)

      .addCase(processOrder.pending,   handleActionPending)
      .addCase(processOrder.fulfilled, handleActionFulfilled)
      .addCase(processOrder.rejected,  handleActionRejected)

      .addCase(shipOrder.pending,   handleActionPending)
      .addCase(shipOrder.fulfilled, handleActionFulfilled)
      .addCase(shipOrder.rejected,  handleActionRejected);
  },
});

export const { resetOrderDetails, resetOrders } = vendorOrderSlice.actions;
export default vendorOrderSlice.reducer;
