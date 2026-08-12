import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const BASE = "/api/shop/returns";

export const createReturnRequest = createAsyncThunk(
  "shopReturn/create",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axios.post(BASE, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  }
);

export const fetchMyReturnRequests = createAsyncThunk(
  "shopReturn/listMine",
  async (params = {}, { rejectWithValue }) => {
    try {
      const q = new URLSearchParams(params).toString();
      const res = await axios.get(`${BASE}${q ? "?" + q : ""}`, { withCredentials: true });
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  }
);

export const fetchReturnRequestById = createAsyncThunk(
  "shopReturn/getOne",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE}/${id}`, { withCredentials: true });
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  }
);

export const checkReturnEligibility = createAsyncThunk(
  "shopReturn/checkEligibility",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE}/eligibility/${orderId}`, { withCredentials: true });
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  }
);

export const cancelReturnRequest = createAsyncThunk(
  "shopReturn/cancel",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${BASE}/${id}/cancel`, { reason }, { withCredentials: true });
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  }
);

export const escalateReturnRequest = createAsyncThunk(
  "shopReturn/escalate",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${BASE}/${id}/escalate`, { reason }, { withCredentials: true });
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  }
);

export const submitReturnShipment = createAsyncThunk(
  "shopReturn/submitShipment",
  async ({ id, courier, trackingNumber }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${BASE}/${id}/ship-return`, { courier, trackingNumber }, { withCredentials: true });
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  }
);

const initialState = {
  list:        [],
  current:     null,
  eligibility: null,
  isLoading:   false,
  isSubmitting: false,
  error:       null,
};

const handlePending  = (state) => { state.isSubmitting = true; state.error = null; };
const handleRejected = (state, a) => { state.isSubmitting = false; state.error = a.payload?.message || "Error"; };
const handleFulfilled = (state, a) => {
  state.isSubmitting = false;
  if (a.payload?.data) state.current = a.payload.data;
};

const shopReturnSlice = createSlice({
  name: "shopReturn",
  initialState,
  reducers: {
    clearReturnState: (state) => { state.current = null; state.eligibility = null; state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkReturnEligibility.pending,   (s) => { s.isLoading = true; })
      .addCase(checkReturnEligibility.fulfilled, (s, a) => { s.isLoading = false; s.eligibility = a.payload?.data || null; })
      .addCase(checkReturnEligibility.rejected,  (s) => { s.isLoading = false; })

      .addCase(fetchMyReturnRequests.pending,   (s) => { s.isLoading = true; })
      .addCase(fetchMyReturnRequests.fulfilled, (s, a) => { s.isLoading = false; s.list = a.payload?.data || []; })
      .addCase(fetchMyReturnRequests.rejected,  (s) => { s.isLoading = false; })

      .addCase(fetchReturnRequestById.pending,   (s) => { s.isLoading = true; })
      .addCase(fetchReturnRequestById.fulfilled, (s, a) => { s.isLoading = false; s.current = a.payload?.data || null; })
      .addCase(fetchReturnRequestById.rejected,  (s) => { s.isLoading = false; })

      .addCase(createReturnRequest.pending,   handlePending)
      .addCase(createReturnRequest.fulfilled, handleFulfilled)
      .addCase(createReturnRequest.rejected,  handleRejected)

      .addCase(cancelReturnRequest.pending,   handlePending)
      .addCase(cancelReturnRequest.fulfilled, handleFulfilled)
      .addCase(cancelReturnRequest.rejected,  handleRejected)

      .addCase(escalateReturnRequest.pending,   handlePending)
      .addCase(escalateReturnRequest.fulfilled, handleFulfilled)
      .addCase(escalateReturnRequest.rejected,  handleRejected)

      .addCase(submitReturnShipment.pending,   handlePending)
      .addCase(submitReturnShipment.fulfilled, handleFulfilled)
      .addCase(submitReturnShipment.rejected,  handleRejected);
  },
});

export const { clearReturnState } = shopReturnSlice.actions;
export default shopReturnSlice.reducer;
