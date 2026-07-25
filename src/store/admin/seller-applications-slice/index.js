import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = "http://localhost:5000/api/admin/seller-applications";

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
      const res = await axios.get(url, { withCredentials: true });
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
      const res = await axios.put(
        `${BASE}/${id}/approve`,
        { adminNote },
        { withCredentials: true }
      );
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
        { withCredentials: true }
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
      .addCase(getAllApplications.pending,   (s) => { s.isLoading = true; s.error = null; })
      .addCase(getAllApplications.fulfilled, (s, a) => {
        s.isLoading    = false;
        s.applications = a.payload.data;
      })
      .addCase(getAllApplications.rejected,  (s, a) => {
        s.isLoading = false;
        s.error = a.payload?.message;
      })

      // Remove or update entry after approve/reject
      .addCase(approveApplication.fulfilled, (s, a) => {
        s.applications = s.applications.map((app) =>
          app._id === a.payload.id ? { ...app, status: "approved" } : app
        );
      })
      .addCase(rejectApplication.fulfilled, (s, a) => {
        s.applications = s.applications.map((app) =>
          app._id === a.payload.id ? { ...app, status: "rejected" } : app
        );
      });
  },
});

export default adminSellerSlice.reducer;
