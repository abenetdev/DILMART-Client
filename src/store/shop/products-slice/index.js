import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  isLoadingMore: false,
  productList: [],
  productDetails: null,
  hasMore: true,
  currentPage: 1,
};

// Replaces entire product list (used on first load / filter/sort change)
export const fetchAllFilteredProducts = createAsyncThunk(
  "/products/fetchAllProducts",
  async ({ filterParams, sortParams, page = 1, limit = 12 }) => {
    const query = new URLSearchParams({
      ...filterParams,
      sortBy: sortParams,
      page,
      limit,
    });

    const result = await axios.get(
      `http://localhost:5000/api/shop/products/get?${query}`
    );

    return result?.data;
  }
);

// Appends products to existing list (used for infinite scroll "load more")
export const fetchMoreProducts = createAsyncThunk(
  "/products/fetchMoreProducts",
  async ({ filterParams, sortParams, page, limit = 12 }) => {
    const query = new URLSearchParams({
      ...filterParams,
      sortBy: sortParams,
      page,
      limit,
    });

    const result = await axios.get(
      `http://localhost:5000/api/shop/products/get?${query}`
    );

    return result?.data;
  }
);

export const fetchProductDetails = createAsyncThunk(
  "/products/fetchProductDetails",
  async (id) => {
    const result = await axios.get(
      `http://localhost:5000/api/shop/products/get/${id}`
    );

    return result?.data;
  }
);

const shoppingProductSlice = createSlice({
  name: "shoppingProducts",
  initialState,
  reducers: {
    setProductDetails: (state) => {
      state.productDetails = null;
    },
    resetProducts: (state) => {
      state.productList = [];
      state.hasMore = true;
      state.currentPage = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchAllFilteredProducts (reset + load first page) ──
      .addCase(fetchAllFilteredProducts.pending, (state) => {
        state.isLoading = true;
        state.productList = [];
        state.hasMore = true;
        state.currentPage = 1;
      })
      .addCase(fetchAllFilteredProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productList = action.payload.data ?? [];
        state.hasMore = action.payload.hasMore ?? false;
        state.currentPage = 1;
      })
      .addCase(fetchAllFilteredProducts.rejected, (state) => {
        state.isLoading = false;
        state.productList = [];
        state.hasMore = false;
      })

      // ── fetchMoreProducts (append next page) ──
      .addCase(fetchMoreProducts.pending, (state) => {
        state.isLoadingMore = true;
      })
      .addCase(fetchMoreProducts.fulfilled, (state, action) => {
        state.isLoadingMore = false;
        state.productList = [
          ...state.productList,
          ...(action.payload.data ?? []),
        ];
        state.hasMore = action.payload.hasMore ?? false;
        state.currentPage += 1;
      })
      .addCase(fetchMoreProducts.rejected, (state) => {
        state.isLoadingMore = false;
      })

      // ── fetchProductDetails ──
      .addCase(fetchProductDetails.pending, (state) => {
        state.isLoading = true;
        state.productDetails = null;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productDetails = action.payload.data;
      })
      .addCase(fetchProductDetails.rejected, (state) => {
        state.isLoading = false;
        state.productDetails = null;
      });
  },
});

export const { setProductDetails, resetProducts } = shoppingProductSlice.actions;

export default shoppingProductSlice.reducer;
