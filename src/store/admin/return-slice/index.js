import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const BASE = "/api/admin/returns";

export const fetchAllReturns = createAsyncThunk("adminReturn/list",
  async (params = {}, { rejectWithValue }) => {
    try {
      const q = new URLSearchParams(params).toString();
      const res = await axios.get(`${BASE}${q ? "?" + q : ""}`, { withCredentials: true });
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  }
);

export const fetchAdminReturnById = createAsyncThunk("adminReturn/getOne",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE}/${id}`, { withCredentials: true });
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  }
);

const post = (name, urlFn, bodyFn = () => ({})) =>
  createAsyncThunk(`adminReturn/${name}`, async (args, { rejectWithValue }) => {
    try {
      const res = await axios.post(urlFn(args), bodyFn(args), { withCredentials: true });
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  });

export const adminApproveReturn       = post("approve",             ({ id, note })            => `${BASE}/${id}/approve`,             ({ note })            => ({ note }));
export const adminRejectReturn        = post("reject",              ({ id, reason })          => `${BASE}/${id}/reject`,              ({ reason })          => ({ reason }));
export const adminApproveRefund       = post("approveRefund",       ({ id })                  => `${BASE}/${id}/approve-refund`,       (a)                   => ({ approvedAmount: a.approvedAmount, changeOfMind: a.changeOfMind }));
export const adminProcessRefund       = post("processRefund",       ({ id })                  => `${BASE}/${id}/process-refund`);
export const adminApproveReplacement  = post("approveReplacement",  ({ id, note })            => `${BASE}/${id}/approve-replacement`,  ({ note })            => ({ note }));

const initialState = { list: [], current: null, isLoading: false, isSubmitting: false, error: null, total: 0 };

const adminReturnSlice = createSlice({
  name: "adminReturn",
  initialState,
  reducers: { clearAdminReturnDetail: (s) => { s.current = null; } },
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
      .addCase(fetchAllReturns.pending,   (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchAllReturns.fulfilled, (s, a) => { s.isLoading = false; s.list = a.payload?.data || []; s.total = a.payload?.total || 0; })
      .addCase(fetchAllReturns.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload?.message; })
      .addCase(fetchAdminReturnById.pending,   (s) => { s.isLoading = true; })
      .addCase(fetchAdminReturnById.fulfilled, (s, a) => { s.isLoading = false; s.current = a.payload?.data || null; })
      .addCase(fetchAdminReturnById.rejected,  (s) => { s.isLoading = false; });

    [adminApproveReturn, adminRejectReturn, adminApproveRefund, adminProcessRefund, adminApproveReplacement]
      .forEach((thunk) => {
        builder
          .addCase(thunk.pending,   (s) => { s.isSubmitting = true; s.error = null; })
          .addCase(thunk.fulfilled, patch)
          .addCase(thunk.rejected,  (s, a) => { s.isSubmitting = false; s.error = a.payload?.message || "Error"; });
      });
  },
});

export const { clearAdminReturnDetail } = adminReturnSlice.actions;
export default adminReturnSlice.reducer;
