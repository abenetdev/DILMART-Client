import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const BASE = "/api/admin/brands";
const cfg  = { withCredentials: true };

export const fetchAdminBrands = createAsyncThunk(
  "adminBrand/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(BASE, cfg);
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  }
);

export const createAdminBrand = createAsyncThunk(
  "adminBrand/create",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axios.post(BASE, formData, {
        ...cfg,
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  }
);

export const updateAdminBrand = createAsyncThunk(
  "adminBrand/update",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${BASE}/${id}`, formData, {
        ...cfg,
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  }
);

export const deleteAdminBrand = createAsyncThunk(
  "adminBrand/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.delete(`${BASE}/${id}`, cfg);
      return { ...res.data, id };
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  }
);

export const toggleActiveAdminBrand = createAsyncThunk(
  "adminBrand/toggleActive",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${BASE}/${id}/toggle-active`, {}, cfg);
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  }
);

const adminBrandSlice = createSlice({
  name: "adminBrand",
  initialState: {
    isLoading:    false,
    isSubmitting: false,
    brands:       [],
    error:        null,
  },
  reducers: {
    clearBrandError: (s) => { s.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminBrands.pending,   (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchAdminBrands.fulfilled, (s, a) => {
        s.isLoading = false;
        s.brands    = a.payload.data || [];
      })
      .addCase(fetchAdminBrands.rejected,  (s, a) => {
        s.isLoading = false;
        s.error = a.payload?.message;
      })

      .addCase(createAdminBrand.pending,   (s) => { s.isSubmitting = true; s.error = null; })
      .addCase(createAdminBrand.fulfilled, (s, a) => {
        s.isSubmitting = false;
        s.brands       = [...s.brands, a.payload.data];
      })
      .addCase(createAdminBrand.rejected,  (s, a) => {
        s.isSubmitting = false;
        s.error = a.payload?.message;
      })

      .addCase(updateAdminBrand.pending,   (s) => { s.isSubmitting = true; s.error = null; })
      .addCase(updateAdminBrand.fulfilled, (s, a) => {
        s.isSubmitting = false;
        s.brands       = s.brands.map((b) =>
          b._id === a.payload.data._id ? a.payload.data : b
        );
      })
      .addCase(updateAdminBrand.rejected,  (s, a) => {
        s.isSubmitting = false;
        s.error = a.payload?.message;
      })

      .addCase(deleteAdminBrand.pending,   (s) => { s.isSubmitting = true; })
      .addCase(deleteAdminBrand.fulfilled, (s, a) => {
        s.isSubmitting = false;
        s.brands       = s.brands.filter((b) => b._id !== a.payload.id);
      })
      .addCase(deleteAdminBrand.rejected,  (s, a) => {
        s.isSubmitting = false;
        s.error = a.payload?.message;
      })

      .addCase(toggleActiveAdminBrand.fulfilled, (s, a) => {
        s.brands = s.brands.map((b) =>
          b._id === a.payload.data._id ? a.payload.data : b
        );
      });
  },
});

export const { clearBrandError } = adminBrandSlice.actions;
export default adminBrandSlice.reducer;
