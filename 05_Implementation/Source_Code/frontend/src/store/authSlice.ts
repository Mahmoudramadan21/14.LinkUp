import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  signup,
  login,
  refresh,
  logout as authLogout,
  isAuthenticated as checkAuth,
  forgotPassword,
  verifyCode,
  resetPassword,
} from "@/services/authService";
import {
  User,
  IsAuthenticatedResponse,
  ForgotPasswordResponse,
  VerifyCodeResponse,
} from "@/types/auth";
import {
  SignupRequest,
  LoginRequest,
  ForgotPasswordRequest,
  VerifyCodeRequest,
  ResetPasswordRequest,
} from "@/types/auth";

// Define SimpleSuccessResponse type (based on assumption)
interface SimpleSuccessResponse {
  message: string;
}

// Auth state interface
interface AuthState {
  user: User | null;
  isAuthenticated: null | boolean;
  resetEmail: string | null;
  loading: {
    initialize: boolean;
    signup: boolean;
    login: boolean;
    refresh: boolean;
    logout: boolean;
    checkAuth: boolean;
    forgotPassword: boolean;
    verifyCode: boolean;
    resetPassword: boolean;
  };
  error: {
    initialize: string | null;
    signup: string | null;
    login: string | null;
    refresh: string | null;
    logout: string | null;
    checkAuth: string | null;
    forgotPassword: string | null;
    verifyCode: string | null;
    resetPassword: string | null;
  };
  resetCodeSent: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: null,
  resetEmail: null,
  loading: {
    initialize: false,
    signup: false,
    login: false,
    refresh: false,
    logout: false,
    checkAuth: false,
    forgotPassword: false,
    verifyCode: false,
    resetPassword: false,
  },
  error: {
    initialize: null,
    signup: null,
    login: null,
    refresh: null,
    logout: null,
    checkAuth: null,
    forgotPassword: null,
    verifyCode: null,
    resetPassword: null,
  },
  resetCodeSent: false,
};

// Async thunk for checking authentication on app start
export const initializeAuth = createAsyncThunk<
  IsAuthenticatedResponse,
  void,
  { rejectValue: string }
>("auth/initialize", async (_, { dispatch, rejectWithValue }) => {
  try {
    const response = await checkAuth();
    if (response.isAuthenticated) {
      return response;
    }
    const refreshResponse = await dispatch(refreshThunk()).unwrap();
    return {
      isAuthenticated: true,
      data: refreshResponse,
      message: "Authenticated via refresh token",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Authentication check failed";
    return rejectWithValue(message);
  }
});

// Async thunks for other endpoints
export const signupThunk = createAsyncThunk<
  User,
  SignupRequest,
  { rejectValue: string }
>("auth/signup", async (data, { rejectWithValue }) => {
  try {
    const response = await signup(data);
    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Signup failed";
    return rejectWithValue(message);
  }
});

export const loginThunk = createAsyncThunk<
  User,
  LoginRequest,
  { rejectValue: string }
>("auth/login", async (data, { rejectWithValue }) => {
  try {
    const response = await login(data);
    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Login failed";
    return rejectWithValue(message);
  }
});

export const refreshThunk = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>("auth/refresh", async (_, { rejectWithValue }) => {
  try {
    const response = await refresh();
    return response.data;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Token refresh failed";
    return rejectWithValue(message);
  }
});

export const logoutThunk = createAsyncThunk<
  SimpleSuccessResponse,
  void,
  { rejectValue: string }
>("auth/logout", async (_, { rejectWithValue }) => {
  try {
    const response = await authLogout();
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Logout failed";
    return rejectWithValue(message);
  }
});

export const checkAuthThunk = createAsyncThunk<
  IsAuthenticatedResponse,
  void,
  { rejectValue: string }
>("auth/checkAuth", async (_, { rejectWithValue }) => {
  try {
    const response = await checkAuth();
    return response;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Authentication check failed";
    return rejectWithValue(message);
  }
});

export const forgotPasswordThunk = createAsyncThunk<
  ForgotPasswordResponse & { email: string },
  ForgotPasswordRequest,
  { rejectValue: string }
>("auth/forgotPassword", async (data, { rejectWithValue }) => {
  try {
    const response = await forgotPassword(data);
    return { ...response, email: data.email };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Password reset request failed";
    return rejectWithValue(message);
  }
});

export const verifyCodeThunk = createAsyncThunk<
  VerifyCodeResponse,
  VerifyCodeRequest,
  { rejectValue: string }
>("auth/verifyCode", async (data, { rejectWithValue }) => {
  try {
    const response = await verifyCode(data);
    return response;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Code verification failed";
    return rejectWithValue(message);
  }
});

export const resetPasswordThunk = createAsyncThunk<
  SimpleSuccessResponse,
  ResetPasswordRequest,
  { rejectValue: string }
>("auth/resetPassword", async (data, { rejectWithValue }) => {
  try {
    const response = await resetPassword(data);
    return response;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Password reset failed";
    return rejectWithValue(message);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state, action: PayloadAction<keyof AuthState["error"]>) => {
      state.error[action.payload] = null;
    },
    clearResetState: (state) => {
      state.resetCodeSent = false;
      state.resetEmail = null;
      state.error.forgotPassword = null;
      state.error.verifyCode = null;
      state.error.resetPassword = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize Auth
      .addCase(initializeAuth.pending, (state) => {
        state.loading.initialize = true;
        state.error.initialize = null;
      })
      .addCase(
        initializeAuth.fulfilled,
        (state, action: PayloadAction<IsAuthenticatedResponse>) => {
          state.loading.initialize = false;
          state.isAuthenticated = action.payload.isAuthenticated;
          state.user = action.payload.data || null;
        }
      )
      .addCase(
        initializeAuth.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.initialize = false;
          state.error.initialize =
            action.payload ?? "Authentication check failed";
          state.isAuthenticated = false;
          state.user = null;
        }
      )
      // Signup
      .addCase(signupThunk.pending, (state) => {
        state.loading.signup = true;
        state.error.signup = null;
      })
      .addCase(signupThunk.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading.signup = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(
        signupThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.signup = false;
          state.error.signup = action.payload ?? "Signup failed";
        }
      )
      // Login
      .addCase(loginThunk.pending, (state) => {
        state.loading.login = true;
        state.error.login = null;
      })
      .addCase(loginThunk.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading.login = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(
        loginThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.login = false;
          state.error.login = action.payload ?? "Login failed";
        }
      )
      // Refresh
      .addCase(refreshThunk.pending, (state) => {
        state.loading.refresh = true;
        state.error.refresh = null;
      })
      .addCase(refreshThunk.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading.refresh = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(
        refreshThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.refresh = false;
          state.error.refresh = action.payload ?? "Token refresh failed";
          state.isAuthenticated = false;
          state.user = null;
        }
      )
      // Logout
      .addCase(logoutThunk.pending, (state) => {
        state.loading.logout = true;
        state.error.logout = null;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.loading.logout = false;
        state.user = null;
        state.isAuthenticated = false;
        state.resetCodeSent = false;
        state.resetEmail = null;
      })
      .addCase(
        logoutThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.logout = false;
          state.error.logout = action.payload ?? "Logout failed";
        }
      )
      // Check Auth
      .addCase(checkAuthThunk.pending, (state) => {
        state.loading.checkAuth = true;
        state.error.checkAuth = null;
      })
      .addCase(
        checkAuthThunk.fulfilled,
        (state, action: PayloadAction<IsAuthenticatedResponse>) => {
          state.loading.checkAuth = false;
          state.isAuthenticated = action.payload.isAuthenticated;
          state.user = action.payload.data || null;
        }
      )
      .addCase(
        checkAuthThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.checkAuth = false;
          state.error.checkAuth =
            action.payload ?? "Authentication check failed";
          state.isAuthenticated = false;
          state.user = null;
        }
      )
      // Forgot Password
      .addCase(forgotPasswordThunk.pending, (state) => {
        state.loading.forgotPassword = true;
        state.error.forgotPassword = null;
        state.resetCodeSent = false;
      })
      .addCase(
        forgotPasswordThunk.fulfilled,
        (
          state,
          action: PayloadAction<ForgotPasswordResponse & { email: string }>
        ) => {
          state.loading.forgotPassword = false;
          state.resetCodeSent = action.payload.codeSent;
          state.resetEmail = action.payload.email;
        }
      )
      .addCase(
        forgotPasswordThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.forgotPassword = false;
          state.error.forgotPassword =
            action.payload ?? "Password reset request failed";
        }
      )
      // Verify Code
      .addCase(verifyCodeThunk.pending, (state) => {
        state.loading.verifyCode = true;
        state.error.verifyCode = null;
      })
      .addCase(verifyCodeThunk.fulfilled, (state) => {
        state.loading.verifyCode = false;
      })
      .addCase(
        verifyCodeThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.verifyCode = false;
          state.error.verifyCode = action.payload ?? "Code verification failed";
        }
      )
      // Reset Password
      .addCase(resetPasswordThunk.pending, (state) => {
        state.loading.resetPassword = true;
        state.error.resetPassword = null;
      })
      .addCase(resetPasswordThunk.fulfilled, (state) => {
        state.loading.resetPassword = false;
        state.resetCodeSent = false;
      })
      .addCase(
        resetPasswordThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.resetPassword = false;
          state.error.resetPassword = action.payload ?? "Password reset failed";
        }
      );
  },
});

export const { clearError, clearResetState } = authSlice.actions;

export default authSlice.reducer;
