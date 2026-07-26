import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const initialState = {
  isListLoading: false,
  isSubmitting: false,
  productList: [],
  productDetails: null,
  error: null,
};

export const addNewProduct = createAsyncThunk(
  "/vendor/products/addnewproduct",
  async (formData, { rejectWithValue }) => {
    try {
      console.log("Redux: Sending product data to API:", formData);
      
      const result = await axios.post(
        "/api/vendor/products/add",
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      console.log("Redux: API response:", result?.data);
      return result?.data;
    } catch (error) {
      console.error("Redux: API error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchAllProducts = createAsyncThunk(
  "/vendor/products/fetchAllProducts",
  async (params = {}) => {
    const { status, category, search } = params;
    let url = `/api/vendor/products/get?`;
    
    const queryParams = [];
    if (status && status !== "all") queryParams.push(`status=${status}`);
    if (category && category !== "all") queryParams.push(`category=${category}`);
    if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
    
    url += queryParams.join("&");

    const result = await axios.get(url, { withCredentials: true });
    return result?.data;
  }
);

export const getProductById = createAsyncThunk(
  "/vendor/products/getProductById",
  async (id) => {
    const result = await axios.get(
      `/api/vendor/products/get/${id}`,
      { withCredentials: true }
    );
    return result?.data;
  }
);

export const editProduct = createAsyncThunk(
  "/vendor/products/editProduct",
  async ({ id, formData }) => {
    const result = await axios.put(
      `/api/vendor/products/edit/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    return result?.data;
  }
);

export const deleteProduct = createAsyncThunk(
  "/vendor/products/deleteProduct",
  async (id) => {
    const result = await axios.delete(
      `/api/vendor/products/delete/${id}`,
      { withCredentials: true }
    );

    return result?.data;
  }
);

export const bulkUpdateStatus = createAsyncThunk(
  "/vendor/products/bulkUpdateStatus",
  async ({ productIds, status, storeId }) => {
    const result = await axios.put(
      "/api/vendor/products/bulk-status",
      { productIds, status, storeId },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    return result?.data;
  }
);

export const setSuperDeal = createAsyncThunk(
  "/vendor/products/setSuperDeal",
  async ({ id, dealPrice, dealTitle, expiresAt }, { rejectWithValue }) => {
    try {
      const result = await axios.put(
        `/api/vendor/products/super-deal/${id}`,
        { dealPrice, dealTitle, expiresAt },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      return result?.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const cancelSuperDeal = createAsyncThunk(
  "/vendor/products/cancelSuperDeal",
  async (id, { rejectWithValue }) => {
    try {
      const result = await axios.delete(
        `/api/vendor/products/super-deal/${id}`,
        { withCredentials: true }
      );
      return result?.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const VendorProductsSlice = createSlice({
  name: "vendorProducts",
  initialState,
  reducers: {
    clearProductDetails: (state) => {
      state.productDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all products
      .addCase(fetchAllProducts.pending, (state) => {
        state.isListLoading = true;
        state.error = null;
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.isListLoading = false;
        state.productList = action.payload?.data || [];
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.isListLoading = false;
        state.error = action.error?.message || "Failed to load products";
      })
      // Add product
      .addCase(addNewProduct.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(addNewProduct.fulfilled, (state) => {
        state.isSubmitting = false;
      })
      .addCase(addNewProduct.rejected, (state) => {
        state.isSubmitting = false;
      })
      // Get product by ID
      .addCase(getProductById.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(getProductById.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.productDetails = action.payload.data;
      })
      .addCase(getProductById.rejected, (state) => {
        state.isSubmitting = false;
        state.productDetails = null;
      })
      // Edit product
      .addCase(editProduct.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(editProduct.fulfilled, (state) => {
        state.isSubmitting = false;
      })
      .addCase(editProduct.rejected, (state) => {
        state.isSubmitting = false;
      })
      // Delete product
      .addCase(deleteProduct.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(deleteProduct.fulfilled, (state) => {
        state.isSubmitting = false;
      })
      .addCase(deleteProduct.rejected, (state) => {
        state.isSubmitting = false;
      })
      // Super deal
      .addCase(setSuperDeal.pending, (state) => { state.isSubmitting = true; })
      .addCase(setSuperDeal.fulfilled, (state) => { state.isSubmitting = false; })
      .addCase(setSuperDeal.rejected, (state) => { state.isSubmitting = false; })
      .addCase(cancelSuperDeal.pending, (state) => { state.isSubmitting = true; })
      .addCase(cancelSuperDeal.fulfilled, (state) => { state.isSubmitting = false; })
      .addCase(cancelSuperDeal.rejected, (state) => { state.isSubmitting = false; });
  },
});

export const { clearProductDetails } = VendorProductsSlice.actions;
export default VendorProductsSlice.reducer;