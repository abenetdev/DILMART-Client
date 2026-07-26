import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const BASE = "/api/admin/vendors";

const initialState = {
  isListLoading: false,
  isSubmitting: false,
  vendorList: [],
  vendorDetails: null,
  error: null,
};

export const registerVendor = createAsyncThunk(
  "adminVendors/register",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${BASE}/register`,
        formData,
        { withCredentials: true }
      );
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const fetchAllVendors = createAsyncThunk(
  "adminVendors/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { search, storeStatus } = params;

      const query = new URLSearchParams();

      if (search) query.set("search", search);
      if (storeStatus && storeStatus !== "all") {
        query.set("storeStatus", storeStatus);
      }

      const url = query.toString() ? `${BASE}?${query}` : BASE;

      const res = await axios.get(url, {
        withCredentials: true,
      });

      return res.data;
    } catch (e) {
      return rejectWithValue(
        e.response?.data || { message: e.message }
      );
    }
  }
);

export const getVendorById = createAsyncThunk(
  "adminVendors/getById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE}/${id}`, {
        withCredentials: true,
      });

      return res.data;
    } catch (e) {
      return rejectWithValue(
        e.response?.data || { message: e.message }
      );
    }
  }
);

export const updateVendorStoreStatus = createAsyncThunk(
  "adminVendors/updateStoreStatus",
  async ({ vendorId, status }, { rejectWithValue }) => {
    try {
      const res = await axios.put(
        `${BASE}/${vendorId}/store-status`,
        { status },
        { withCredentials: true }
      );

      return res.data;
    } catch (e) {
      return rejectWithValue(
        e.response?.data || { message: e.message }
      );
    }
  }
);

export const updateVendorAccountStatus = createAsyncThunk(
  "adminVendors/updateAccountStatus",
  async ({ vendorId, status }, { rejectWithValue }) => {
    try {
      const res = await axios.put(
        `${BASE}/${vendorId}/account-status`,
        { status },
        { withCredentials: true }
      );
      return { ...res.data, vendorId, status };
    } catch (e) {
      return rejectWithValue(
        e.response?.data || { message: e.message }
      );
    }
  }
);

export const deleteVendor = createAsyncThunk(
  "adminVendors/delete",
  async (vendorId, { rejectWithValue }) => {
    try {
      const res = await axios.delete(`${BASE}/${vendorId}`, {
        withCredentials: true,
      });

      return {
        ...res.data,
        vendorId,
      };
    } catch (e) {
      return rejectWithValue(
        e.response?.data || { message: e.message }
      );
    }
  }
);

export const resetVendorPassword = createAsyncThunk(
  "adminVendors/resetPassword",
  async ({ vendorId, newPassword }, { rejectWithValue }) => {
    try {
      const res = await axios.put(
        `${BASE}/${vendorId}/reset-password`,
        { newPassword },
        { withCredentials: true }
      );

      return res.data;
    } catch (e) {
      return rejectWithValue(
        e.response?.data || { message: e.message }
      );
    }
  }
);

const adminVendorsSlice = createSlice({
  name: "adminVendors",
  initialState,

  reducers: {
    clearVendorDetails: (state) => {
      state.vendorDetails = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch all vendors
      .addCase(fetchAllVendors.pending, (state) => {
        state.isListLoading = true;
        state.error = null;
      })
      .addCase(fetchAllVendors.fulfilled, (state, action) => {
        state.isListLoading = false;
        state.vendorList = action.payload?.data || [];
      })
      .addCase(fetchAllVendors.rejected, (state, action) => {
        state.isListLoading = false;
        state.error =
          action.payload?.message || "Failed to load vendors";
      })

      // Get vendor details
      .addCase(getVendorById.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(getVendorById.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.vendorDetails = action.payload?.data || null;
      })
      .addCase(getVendorById.rejected, (state) => {
        state.isSubmitting = false;
        state.vendorDetails = null;
      })

      // Update store status
      .addCase(updateVendorStoreStatus.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(updateVendorStoreStatus.fulfilled, (state) => {
        state.isSubmitting = false;
      })
      .addCase(updateVendorStoreStatus.rejected, (state) => {
        state.isSubmitting = false;
      })

      // Update account status
      .addCase(updateVendorAccountStatus.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(updateVendorAccountStatus.fulfilled, (state, action) => {
        state.isSubmitting = false;
        // Optimistically update the vendorList so dropdown flips immediately
        const { vendorId, status } = action.payload;
        const vendor = state.vendorList.find((v) => v._id === vendorId);
        if (vendor) vendor.accountStatus = status;
      })
      .addCase(updateVendorAccountStatus.rejected, (state) => {
        state.isSubmitting = false;
      })

      // Delete vendor
      .addCase(deleteVendor.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(deleteVendor.fulfilled, (state, action) => {
        state.isSubmitting = false;

        state.vendorList = state.vendorList.filter(
          (vendor) => vendor._id !== action.payload.vendorId
        );
      })
      .addCase(deleteVendor.rejected, (state) => {
        state.isSubmitting = false;
      })

      // Reset password
      .addCase(resetVendorPassword.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(resetVendorPassword.fulfilled, (state) => {
        state.isSubmitting = false;
      })
      .addCase(resetVendorPassword.rejected, (state) => {
        state.isSubmitting = false;
      })

      // Register vendor
      .addCase(registerVendor.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(registerVendor.fulfilled, (state) => {
        state.isSubmitting = false;
      })
      .addCase(registerVendor.rejected, (state) => {
        state.isSubmitting = false;
      });
  },
});

export const { clearVendorDetails } = adminVendorsSlice.actions;

export default adminVendorsSlice.reducer;
