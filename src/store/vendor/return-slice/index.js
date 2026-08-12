import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const BASE = "/api/vendor/returns";

export const fetchVendorReturns = createAsyncThunk("vendorReturn/list",
  async (params = {}, { rejectWithValue }) => {
    try {
      const q = new URLSearchParams(params).toString();
      const res = await axios.get(`${BASE}${q ? "?" + q : ""}`, { withCredentials: true });
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  }
);

export const fetchVendorReturnById = createAsyncThunk("vendorReturn/getOne",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE}/${id}`, { withCredentials: true });
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  }
);

const makeAction = (name, urlFn, bodyFn = () => ({})) =>
  createAsyncThunk(`vendorReturn/${name}`, async (args, { rejectWithValue }) => {
    try {
      const res = await axios.post(urlFn(args), bodyFn(args), { withCredentials: true });
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  });

export const approveVendorReturn        = makeAction("approve",          ({ id })       => `${BASE}/${id}/approve`);
export const rejectVendorReturn         = makeAction("reject",           ({ id, reason }) => `${BASE}/${id}/reject`, ({ reason }) => ({ reason }));
export const confirmReturnReceived      = makeAction("confirmReceived",  ({ id })       => `${BASE}/${id}/confirm-received`);
export const submitInspectionResult     = makeAction("submitInspection", ({ id })       => `${BASE}/${id}/submit-inspection`, ({ result, note }) => ({ result, note }));

const initialState = { list: [], current: null, isLoading: false, isSubmitting: false, error: null };

const vendorReturnSlice = createSlice({
  name: "vendorReturn",
  initialState,
  reducers: { clearReturnDetail: (s) => { s.current = null; } },
  extraReducers: (builder) => {
    const patch = (state, action) => {
      state.isSubmitting = false;
      if (action.payload?.data) {
        state.current = action.payload.data;
        const idx = state.list.findIndex((r) => r._id === action.payload.data._id);
        if (idx !== -1) state.list[idx] = action.payload.data;
      }
    };
    builder
      .addCase(fetchVendorReturns.pending,   (s) => { s.isLoading = true; })
      .addCase(fetchVendorReturns.fulfilled, (s, a) => { s.isLoading = false; s.list = a.payload?.data || []; })
      .addCase(fetchVendorReturns.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload?.message; })
      .addCase(fetchVendorReturnById.pending,   (s) => { s.isLoading = true; })
      .addCase(fetchVendorReturnById.fulfilled, (s, a) => { s.isLoading = false; s.current = a.payload?.data || null; })
      .addCase(fetchVendorReturnById.rejected,  (s) => { s.isLoading = false; })
      .addCase(approveVendorReturn.pending,   (s) => { s.isSubmitting = true; })
      .addCase(approveVendorReturn.fulfilled, patch)
      .addCase(approveVendorReturn.rejected,  (s, a) => { s.isSubmitting = false; s.error = a.payload?.message; })
      .addCase(rejectVendorReturn.pending,   (s) => { s.isSubmitting = true; })
      .addCase(rejectVendorReturn.fulfilled, patch)
      .addCase(rejectVendorReturn.rejected,  (s, a) => { s.isSubmitting = false; s.error = a.payload?.message; })
      .addCase(confirmReturnReceived.pending,   (s) => { s.isSubmitting = true; })
      .addCase(confirmReturnReceived.fulfilled, patch)
      .addCase(confirmReturnReceived.rejected,  (s, a) => { s.isSubmitting = false; s.error = a.payload?.message; })
      .addCase(submitInspectionResult.pending,   (s) => { s.isSubmitting = true; })
      .addCase(submitInspectionResult.fulfilled, patch)
      .addCase(submitInspectionResult.rejected,  (s, a) => { s.isSubmitting = false; s.error = a.payload?.message; });
  },
});

export const { clearReturnDetail } = vendorReturnSlice.actions;
export default vendorReturnSlice.reducer;
