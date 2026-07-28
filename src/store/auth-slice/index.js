import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
};

export const registerUser = createAsyncThunk(
  "/auth/register",
  async (formData) => {
    const response = await axios.post("/api/auth/register", formData);
    return response.data;
  }
);

export const loginUser = createAsyncThunk(
  "/auth/login",
  async (formData) => {
    const response = await axios.post("/api/auth/login", formData);
    return response.data;
  }
);

export const logoutUser = createAsyncThunk(
  "/auth/logout",
  async () => {
    // Clear localStorage immediately — don't wait for the server response.
    // This ensures logout works even if the network request fails.
    localStorage.removeItem("token");
    try {
      const response = await axios.post("/api/auth/logout", {});
      return response.data;
    } catch {
      // Server call failed (e.g. Render sleeping), but we already cleared
      // the token so the user is logged out client-side regardless.
      return { success: true };
    }
  }
);

export const checkAuth = createAsyncThunk(
  "/auth/checkauth",
  async () => {
    const response = await axios.get("/api/auth/check-auth", {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
    return response.data;
  }
);

export const updateProfile = createAsyncThunk(
  "/auth/updateProfile",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.put("/api/auth/profile", formData);
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data.message || { message: e.message });
    }
  }
);

export const changePassword = createAsyncThunk(
  "/auth/changePassword",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.put("/api/auth/change-password", formData);
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const adminLoginUser = createAsyncThunk(
  "/auth/adminLogin",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post("/api/admin/auth/login", formData);
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "/auth/verifyOtp",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await axios.post("/api/auth/verify-otp", { email, otp });
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const resendOtp = createAsyncThunk(
  "/auth/resendOtp",
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await axios.post("/api/auth/resend-otp", { email });
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {},
    // Triggered by the global axios 401 interceptor
    forceLogout: (state) => {
      localStorage.removeItem("token");
      state.isLoading       = false;
      state.user            = null;
      state.isAuthenticated = false;
    },
    // Used when we know for certain the user is not authenticated
    // (e.g. no token in localStorage on production app start)
    clearAuth: (state) => {
      state.isLoading       = false;
      state.user            = null;
      state.isAuthenticated = false;
    },
    // Called directly after a successful admin profile PATCH
    patchUserInState: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // register
      .addCase(registerUser.pending, (state) => { state.isLoading = true; })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(registerUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })

      // login (user)
      .addCase(loginUser.pending, (state) => { state.isLoading = true; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success) {
          // Store token in localStorage so Authorization header works in incognito
          if (action.payload.token) {
            localStorage.setItem("token", action.payload.token);
          }
          state.user = action.payload.user;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(loginUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })

      // checkAuth
      .addCase(checkAuth.pending, (state) => { state.isLoading = true; })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success) {
          if (action.payload.token) {
            localStorage.setItem("token", action.payload.token);
          }
          state.user = action.payload.user;
          state.isAuthenticated = true;
        } else {
          localStorage.removeItem("token");
          state.user = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false;
        localStorage.removeItem("token");
        state.user = null;
        state.isAuthenticated = false;
      })

      // logout — state is cleared on pending so UI responds instantly
      .addCase(logoutUser.pending, (state) => {
        localStorage.removeItem("token");
        state.isLoading       = false;
        state.user            = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        localStorage.removeItem("token");
        state.isLoading       = false;
        state.user            = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.rejected, (state) => {
        localStorage.removeItem("token");
        state.isLoading       = false;
        state.user            = null;
        state.isAuthenticated = false;
      })

      // admin login
      .addCase(adminLoginUser.pending, (state) => { state.isLoading = true; })
      .addCase(adminLoginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success) {
          if (action.payload.token) {
            localStorage.setItem("token", action.payload.token);
          }
          state.user = action.payload.user;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(adminLoginUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })

      // updateProfile
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (action.payload?.success && action.payload?.user) {
          if (action.payload.token) {
            localStorage.setItem("token", action.payload.token);
          }
          state.user = action.payload.user;
        }
      });
  },
});

export const { setUser, forceLogout, clearAuth, patchUserInState } = authSlice.actions;
export default authSlice.reducer;
