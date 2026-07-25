import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = "http://localhost:5000/api/vendor/store";

const initialState = {
  isLoading: false,
  isSaving: false,
  store: null,
  slugStatus: null, // { available: bool, message: string }
  error: null,
  fieldErrors: {},
};

// ── Thunks ─────────────────────────────────────────────────────────────────

export const getStore = createAsyncThunk(
  "vendorStore/getStore",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(BASE_URL, { withCredentials: true });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const saveStore = createAsyncThunk(
  "vendorStore/saveStore",
  async (formData, { rejectWithValue }) => {
    try {
      // Remove ownerId from body — backend uses JWT identity
      const { ownerId: _removed, ...payload } = formData;
      const res = await axios.put(BASE_URL, payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const createStore = createAsyncThunk(
  "vendorStore/createStore",
  async (formData, { rejectWithValue }) => {
    try {
      const { ownerId: _removed, ...payload } = formData;
      const res = await axios.post(BASE_URL, payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const checkSlugAvailability = createAsyncThunk(
  "vendorStore/checkSlug",
  async ({ slug, ownerId }, { rejectWithValue }) => {
    try {
      const url = ownerId
        ? `${BASE_URL}/check-slug/${slug}?ownerId=${ownerId}`
        : `${BASE_URL}/check-slug/${slug}`;
      const res = await axios.get(url, { withCredentials: true });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const uploadStoreImage = createAsyncThunk(
  "vendorStore/uploadImage",
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("my_file", file);
      const res = await axios.post(`${BASE_URL}/upload-image`, formData, {
        withCredentials: true,
      });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────

const vendorStoreSlice = createSlice({
  name: "vendorStore",
  initialState,
  reducers: {
    clearFieldErrors: (state) => {
      state.fieldErrors = {};
      state.error = null;
    },
    clearSlugStatus: (state) => {
      state.slugStatus = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // getStore
      .addCase(getStore.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getStore.fulfilled, (state, action) => {
        state.isLoading = false;
        state.store = action.payload.data;
      })
      .addCase(getStore.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to load store";
      })

      // saveStore
      .addCase(saveStore.pending, (state) => {
        state.isSaving = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(saveStore.fulfilled, (state, action) => {
        state.isSaving = false;
        state.store = action.payload.data;
        state.fieldErrors = {};
      })
      .addCase(saveStore.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload?.message || "Failed to save";
        state.fieldErrors = action.payload?.errors || {};
      })

      // createStore
      .addCase(createStore.pending, (state) => {
        state.isSaving = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createStore.fulfilled, (state, action) => {
        state.isSaving = false;
        state.store = action.payload.data;
      })
      .addCase(createStore.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload?.message || "Failed to create store";
        state.fieldErrors = action.payload?.errors || {};
      })

      // checkSlug
      .addCase(checkSlugAvailability.fulfilled, (state, action) => {
        state.slugStatus = action.payload;
      })
      .addCase(checkSlugAvailability.rejected, (state) => {
        state.slugStatus = null;
      });
  },
});

export const { clearFieldErrors, clearSlugStatus } = vendorStoreSlice.actions;
export default vendorStoreSlice.reducer;
