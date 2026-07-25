import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  checkoutUrl: null,
  isLoading: false,
  isSubmitting: false,
  orderId: null,
  orderGroupId: null,
  txRef: null,
  orderList: [],
  orderDetails: null,
};

// ── Create order → get Chapa checkout URL ─────────────────────────────────
export const createNewOrder = createAsyncThunk(
  "/order/createNewOrder",
  async (orderData) => {
    const response = await axios.post(
      "http://localhost:5000/api/shop/order/create",
      orderData
    );
    return response.data;
  }
);

// ── Verify order after Chapa redirects back ────────────────────────────────
export const verifyPayment = createAsyncThunk(
  "/order/verifyPayment",
  async ({ txRef, orderId, orderGroupId }) => {
    const response = await axios.post(
      "http://localhost:5000/api/shop/order/verify",
      { txRef, orderId, orderGroupId }
    );
    return response.data;
  }
);

// ── Get all orders for a user ─────────────────────────────────────────────
export const getAllOrdersByUserId = createAsyncThunk(
  "/order/getAllOrdersByUserId",
  async (userId) => {
    const response = await axios.get(
      `http://localhost:5000/api/shop/order/list/${userId}`
    );
    return response.data;
  }
);

// ── Get single order details ──────────────────────────────────────────────
export const getOrderDetails = createAsyncThunk(
  "/order/getOrderDetails",
  async (id) => {
    const response = await axios.get(
      `http://localhost:5000/api/shop/order/details/${id}`
    );
    return response.data;
  }
);

export const confirmDeliveryByCustomer = createAsyncThunk(
  "/order/confirmDeliveryByCustomer",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/shop/order/confirm-delivery/${orderId}`,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

const shoppingOrderSlice = createSlice({
  name: "shoppingOrderSlice",
  initialState,
  reducers: {
    resetOrderDetails: (state) => {
      state.orderDetails = null;
    },
    resetCheckout: (state) => {
      state.checkoutUrl  = null;
      state.orderId      = null;
      state.orderGroupId = null;
      state.txRef        = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // createNewOrder
      .addCase(createNewOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createNewOrder.fulfilled, (state, action) => {
        state.isLoading      = false;
        state.checkoutUrl    = action.payload.checkoutUrl;
        state.orderId        = action.payload.orderId;
        state.orderGroupId   = action.payload.orderGroupId || null;
        state.txRef          = action.payload.txRef;
        sessionStorage.setItem("currentOrderId", JSON.stringify(action.payload.orderId));
        sessionStorage.setItem("currentOrderGroupId", JSON.stringify(action.payload.orderGroupId || null));
        sessionStorage.setItem("currentTxRef", action.payload.txRef || "");
      })
      .addCase(createNewOrder.rejected, (state) => {
        state.isLoading      = false;
        state.checkoutUrl    = null;
        state.orderId        = null;
        state.orderGroupId   = null;
        state.txRef          = null;
      })

      // verifyPayment
      .addCase(verifyPayment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyPayment.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(verifyPayment.rejected, (state) => {
        state.isLoading = false;
      })

      // getAllOrdersByUserId
      .addCase(getAllOrdersByUserId.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllOrdersByUserId.fulfilled, (state, action) => {
        state.isLoading  = false;
        state.orderList  = action.payload.data;
      })
      .addCase(getAllOrdersByUserId.rejected, (state) => {
        state.isLoading = false;
        state.orderList = [];
      })

      // getOrderDetails
      .addCase(getOrderDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getOrderDetails.fulfilled, (state, action) => {
        state.isLoading    = false;
        state.orderDetails = action.payload.data;
      })
      .addCase(getOrderDetails.rejected, (state) => {
        state.isLoading    = false;
        state.orderDetails = null;
      })

      // confirmDeliveryByCustomer
      .addCase(confirmDeliveryByCustomer.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(confirmDeliveryByCustomer.fulfilled, (state, action) => {
        state.isSubmitting = false;
        if (action.payload?.data) {
          state.orderDetails = action.payload.data;
          const idx = state.orderList.findIndex(
            (o) => o._id === action.payload.data._id
          );
          if (idx !== -1) state.orderList[idx] = action.payload.data;
        }
      })
      .addCase(confirmDeliveryByCustomer.rejected, (state) => {
        state.isSubmitting = false;
      });
  },
});

export const { resetOrderDetails, resetCheckout } = shoppingOrderSlice.actions;
export default shoppingOrderSlice.reducer;
