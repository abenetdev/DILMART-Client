import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const BASE = "/api/admin/categories";
const cfg  = { withCredentials: true };

export const fetchAdminCategories = createAsyncThunk(
  "adminCategory/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(BASE, cfg);
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  }
);

export const createAdminCategory = createAsyncThunk(
  "adminCategory/create",
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

export const updateAdminCategory = createAsyncThunk(
  "adminCategory/update",
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

export const deleteAdminCategory = createAsyncThunk(
  "adminCategory/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.delete(`${BASE}/${id}`, cfg);
      return { ...res.data, id };
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  }
);

export const toggleActiveAdminCategory = createAsyncThunk(
  "adminCategory/toggleActive",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${BASE}/${id}/toggle-active`, {}, cfg);
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  }
);

export const toggleFeaturedAdminCategory = createAsyncThunk(
  "adminCategory/toggleFeatured",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${BASE}/${id}/toggle-featured`, {}, cfg);
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data || { message: e.message }); }
  }
);

const adminCategorySlice = createSlice({
  name: "adminCategory",
  initialState: {
    isLoading:    false,
    isSubmitting: false,
    categories:   [],
    error:        null,
  },
  reducers: {
    clearCategoryError: (s) => { s.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminCategories.pending,   (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchAdminCategories.fulfilled, (s, a) => {
        s.isLoading  = false;
        s.categories = a.payload.data || [];
      })
      .addCase(fetchAdminCategories.rejected,  (s, a) => {
        s.isLoading = false;
        s.error = a.payload?.message;
      })

      .addCase(createAdminCategory.pending,   (s) => { s.isSubmitting = true; s.error = null; })
      .addCase(createAdminCategory.fulfilled, (s, a) => {
        s.isSubmitting = false;
        s.categories   = [...s.categories, a.payload.data];
      })
      .addCase(createAdminCategory.rejected,  (s, a) => {
        s.isSubmitting = false;
        s.error = a.payload?.message;
      })

      .addCase(updateAdminCategory.pending,   (s) => { s.isSubmitting = true; s.error = null; })
      .addCase(updateAdminCategory.fulfilled, (s, a) => {
        s.isSubmitting = false;
        s.categories   = s.categories.map((c) =>
          c._id === a.payload.data._id ? a.payload.data : c
        );
      })
      .addCase(updateAdminCategory.rejected,  (s, a) => {
        s.isSubmitting = false;
        s.error = a.payload?.message;
      })

      .addCase(deleteAdminCategory.pending,   (s) => { s.isSubmitting = true; })
      .addCase(deleteAdminCategory.fulfilled, (s, a) => {
        s.isSubmitting = false;
        s.categories   = s.categories.filter((c) => c._id !== a.payload.id);
      })
      .addCase(deleteAdminCategory.rejected,  (s, a) => {
        s.isSubmitting = false;
        s.error = a.payload?.message;
      })

      .addCase(toggleActiveAdminCategory.fulfilled,   (s, a) => {
        s.categories = s.categories.map((c) =>
          c._id === a.payload.data._id ? a.payload.data : c
        );
      })
      .addCase(toggleFeaturedAdminCategory.fulfilled, (s, a) => {
        s.categories = s.categories.map((c) =>
          c._id === a.payload.data._id ? a.payload.data : c
        );
      });
  },
});

export const { clearCategoryError } = adminCategorySlice.actions;
export default adminCategorySlice.reducer;
