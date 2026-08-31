import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const BASE = "/api/admin/seller-applications";

const initialState = {
  isLoading:    false,
  applications: [],
  error:        null,
};

export const getAllApplications = createAsyncThunk(
  "adminSeller/getAll",
  async (status, { rejectWithValue }) => {
    try {
      const url = status && status !== "all" ? `${BASE}?status=${status}` : BASE;
      const res = await axios.get(url);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const approveApplication = createAsyncThunk(
  "adminSeller/approve",
  async ({ id, adminNote = "" }, { rejectWithValue }) => {
    try {
      // Generous timeout: approve does Cloudinary upload + multiple DB writes + Store creation
      const res = await axios.put(
        `${BASE}/${id}/approve`,
        { adminNote },
        { timeout: 60000 }
      );
      // Merge the application id so the slice can update the right row
      return { ...res.data, id };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const rejectApplication = createAsyncThunk(
  "adminSeller/reject",
  async ({ id, adminNote = "" }, { rejectWithValue }) => {
    try {
      const res = await axios.put(
        `${BASE}/${id}/reject`,
        { adminNote },
        { timeout: 20000 }
      );
      return { ...res.data, id };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

const adminSellerSlice = createSlice({
  name: "adminSeller",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // ── getAllApplications ─────────────────────────────────────────────
      .addCase(getAllApplications.pending,   (s) => { s.isLoading = true; s.error = null; })
      .addCase(getAllApplications.fulfilled, (s, a) => {
        s.isLoading    = false;
        s.applications = a.payload.data;
      })
      .addCase(getAllApplications.rejected,  (s, a) => {
        s.isLoading = false;
        s.error     = a.payload?.message || null;
      })

      // ── approveApplication ─────────────────────────────────────────────
      // Optimistically update the row status so the table refreshes immediately
      .addCase(approveApplication.fulfilled, (s, a) => {
        s.applications = s.applications.map((app) =>
          app._id === a.payload.id ? { ...app, status: "approved" } : app
        );
      })
      .addCase(approveApplication.rejected, (s, a) => {
        s.error = a.payload?.message || null;
      })

      // ── rejectApplication ──────────────────────────────────────────────
      .addCase(rejectApplication.fulfilled, (s, a) => {
        s.applications = s.applications.map((app) =>
          app._id === a.payload.id ? { ...app, status: "rejected" } : app
        );
      })
      .addCase(rejectApplication.rejected, (s, a) => {
        s.error = a.payload?.message || null;
      });
  },
});

export default adminSellerSlice.reducer;
