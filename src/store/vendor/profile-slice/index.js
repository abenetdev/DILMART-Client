import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = "http://localhost:5000/api/vendor/profile";

const initialState = {
  isLoading:  false,
  profile:    null,
  fieldErrors: {},
  error:      null,
};

export const getProfile = createAsyncThunk(
  "vendorProfile/get",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(BASE, { withCredentials: true });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const updateProfile = createAsyncThunk(
  "vendorProfile/update",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axios.put(BASE, data, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const changePassword = createAsyncThunk(
  "vendorProfile/changePassword",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axios.put(`${BASE}/change-password`, data, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

const vendorProfileSlice = createSlice({
  name: "vendorProfile",
  initialState,
  reducers: {
    clearErrors: (state) => { state.fieldErrors = {}; state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // getProfile
      .addCase(getProfile.pending,   (s) => { s.isLoading = true;  s.error = null; })
      .addCase(getProfile.fulfilled, (s, a) => { s.isLoading = false; s.profile = a.payload.data; })
      .addCase(getProfile.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload?.message; })
      // updateProfile
      .addCase(updateProfile.pending,   (s) => { s.isLoading = true;  s.fieldErrors = {}; s.error = null; })
      .addCase(updateProfile.fulfilled, (s, a) => { s.isLoading = false; s.profile = a.payload.data; })
      .addCase(updateProfile.rejected,  (s, a) => { s.isLoading = false; s.fieldErrors = a.payload?.errors || {}; s.error = a.payload?.message; })
      // changePassword
      .addCase(changePassword.pending,   (s) => { s.isLoading = true;  s.fieldErrors = {}; s.error = null; })
      .addCase(changePassword.fulfilled, (s) => { s.isLoading = false; })
      .addCase(changePassword.rejected,  (s, a) => { s.isLoading = false; s.fieldErrors = a.payload?.errors || {}; s.error = a.payload?.message; });
  },
});

export const { clearErrors } = vendorProfileSlice.actions;
export default vendorProfileSlice.reducer;
