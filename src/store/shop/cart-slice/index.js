import axios from "@/lib/axios";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE        = "/api/shop/cart";
const PRODUCTS    = "/api/shop/products/get";
const GUEST_KEY   = "guestCart";

// ── localStorage helpers ──────────────────────────────────────────────────

function loadGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? JSON.parse(raw) : { items: [] };
  } catch {
    return { items: [] };
  }
}

function saveGuestCart(cart) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(cart));
}

function clearGuestCart() {
  localStorage.removeItem(GUEST_KEY);
}

// ── Shared: hydrate a list of {productId, quantity} with server product data ──

async function hydrateItems(rawItems) {
  // Keep current Redux state's hydrated items as a cache to avoid redundant fetches
  const hydrated = await Promise.all(
    rawItems.map(async (item) => {
      const pid = item.productId?.toString?.() || item.productId;
      try {
        const res = await axios.get(`${PRODUCTS}/${pid}`);
        const p = res.data?.data;
        if (!p) return null;
        return {
          productId:  p._id,
          title:      p.name || p.title || "Unknown Product",
          image:      p.images?.[0] || p.image || "",
          price:      p.price  ?? 0,
          salePrice:  p.salePrice ?? 0,
          totalStock: p.stock  ?? p.totalStock ?? 0,
          quantity:   item.quantity,
        };
      } catch {
        return null; // deleted or unavailable product
      }
    })
  );
  return hydrated.filter(Boolean);
}

// ── Thunks ────────────────────────────────────────────────────────────────

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ userId, productId, quantity }, { rejectWithValue }) => {
    if (!userId) {
      const cart = loadGuestCart();
      const idx  = cart.items.findIndex((i) => i.productId === productId);
      if (idx === -1) {
        cart.items.push({ productId, quantity });
      } else {
        cart.items[idx].quantity += quantity;
      }
      saveGuestCart(cart);
      const hydratedItems = await hydrateItems(cart.items);
      return { success: true, data: { items: hydratedItems } };
    }
    try {
      const res = await axios.post(`${BASE}/add`, { userId, productId, quantity });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const fetchCartItems = createAsyncThunk(
  "cart/fetchCartItems",
  async (userId, { rejectWithValue }) => {
    if (!userId) {
      const cart = loadGuestCart();
      if (!cart.items.length) {
        return { success: true, data: { items: [] } };
      }
      const hydratedItems = await hydrateItems(cart.items);
      // Prune deleted products from localStorage
      saveGuestCart({ items: hydratedItems.map((i) => ({ productId: i.productId, quantity: i.quantity })) });
      return { success: true, data: { items: hydratedItems } };
    }
    try {
      const res = await axios.get(`${BASE}/get/${userId}`);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const updateCartQuantity = createAsyncThunk(
  "cart/updateCartQuantity",
  async ({ userId, productId, quantity }, { rejectWithValue }) => {
    if (!userId) {
      const cart = loadGuestCart();
      const idx  = cart.items.findIndex((i) => i.productId === productId);
      if (idx !== -1) {
        if (quantity <= 0) {
          cart.items.splice(idx, 1);
        } else {
          cart.items[idx].quantity = quantity;
        }
      }
      saveGuestCart(cart);
      const hydratedItems = await hydrateItems(cart.items);
      return { success: true, data: { items: hydratedItems } };
    }
    try {
      const res = await axios.put(`${BASE}/update-cart`, { userId, productId, quantity });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const deleteCartItem = createAsyncThunk(
  "cart/deleteCartItem",
  async ({ userId, productId }, { rejectWithValue }) => {
    if (!userId) {
      const cart = loadGuestCart();
      cart.items = cart.items.filter((i) => i.productId !== productId);
      saveGuestCart(cart);
      const hydratedItems = await hydrateItems(cart.items);
      return { success: true, data: { items: hydratedItems } };
    }
    try {
      const res = await axios.delete(`${BASE}/${userId}/${productId}`);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const mergeGuestCart = createAsyncThunk(
  "cart/mergeGuestCart",
  async (userId, { rejectWithValue }) => {
    const guestCart = loadGuestCart();
    try {
      for (const item of guestCart.items) {
        await axios.post(`${BASE}/add`, {
          userId,
          productId: item.productId,
          quantity:  item.quantity,
        });
      }
      clearGuestCart();
      const res = await axios.get(`${BASE}/get/${userId}`);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────

const initialState = {
  cartItems: [],
  isLoading: false,
};

function setItems(state, action) {
  state.isLoading = false;
  state.cartItems = action.payload?.data || [];
}

const shoppingCartSlice = createSlice({
  name: "shoppingCart",
  initialState,
  reducers: {
    loadGuestCartToStore(state) {
      state.cartItems = loadGuestCart();
    },
  },
  extraReducers: (builder) => {
    const pending  = (state) => { state.isLoading = true; };
    const rejected = (state) => { state.isLoading = false; };

    builder
      .addCase(addToCart.pending,          pending)
      .addCase(addToCart.fulfilled,        setItems)
      .addCase(addToCart.rejected,         rejected)
      .addCase(fetchCartItems.pending,     pending)
      .addCase(fetchCartItems.fulfilled,   setItems)
      .addCase(fetchCartItems.rejected,    rejected)
      .addCase(updateCartQuantity.pending,   pending)
      .addCase(updateCartQuantity.fulfilled, setItems)
      .addCase(updateCartQuantity.rejected,  rejected)
      .addCase(deleteCartItem.pending,     pending)
      .addCase(deleteCartItem.fulfilled,   setItems)
      .addCase(deleteCartItem.rejected,    rejected)
      .addCase(mergeGuestCart.pending,     pending)
      .addCase(mergeGuestCart.fulfilled,   setItems)
      .addCase(mergeGuestCart.rejected,    rejected);
  },
});

export const { loadGuestCartToStore } = shoppingCartSlice.actions;
export default shoppingCartSlice.reducer;
