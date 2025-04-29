import { useState, FormEvent, ChangeEvent } from "react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import api from "@/utils/api";
import { setCookie } from "@/utils/cookie";
import { API_ENDPOINTS, ERROR_MESSAGES } from "@/utils/constants";
import Link from "next/link";

// Define form data type
interface FormData {
  usernameOrEmail: string;
  password: string;
}

// Define error type
interface FormErrors {
  usernameOrEmail?: string;
  password?: string;
}

// Define API response type
interface LoginResponse {
  message: string;
  data: {
    userId: number;
    username: string;
  };
}

// Validation function
const validateForm = (formData: FormData): FormErrors => {
  const errors: FormErrors = {};

  // Validate usernameOrEmail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email regex
  const usernameRegex = /^[a-zA-Z0-9_]{3,}$/; // Username: at least 3 chars, letters, numbers, underscores

  if (!formData.usernameOrEmail.trim()) {
    errors.usernameOrEmail = "Email or username is required";
  } else if (
    !emailRegex.test(formData.usernameOrEmail) &&
    !usernameRegex.test(formData.usernameOrEmail)
  ) {
    errors.usernameOrEmail = "Please enter a valid email or username (minimum 3 characters)";
  }

  // Validate password
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!formData.password.trim()) {
    errors.password = "Password is required";
  } else if (!passwordRegex.test(formData.password)) {
    errors.password =
      "Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character (@$!%*?&)";
  }

  return errors;
};

const LoginForm: React.FC = () => {
  // State for form inputs and errors
  const [formData, setFormData] = useState<FormData>({
    usernameOrEmail: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  // Handle input changes with real-time validation
  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Validate the entire form
    const updatedFormData = { ...formData, [name]: value };
    const newErrors = validateForm(updatedFormData);
    setErrors(newErrors); // Update all errors, not just the changed field
    setServerError("");
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    // Validate the entire form before submission
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return; // Stop submission if there are validation errors
    }

    setIsLoading(true);
    setServerError("");

    try {
      const response = await api.post<LoginResponse>(API_ENDPOINTS.LOGIN, formData);
      const { userId, username } = response.data.data;

      // Store userId and username in cookies (if needed)
      setCookie("userId", userId.toString(), { expires: rememberMe ? 7 : undefined });
      setCookie("username", username, { expires: rememberMe ? 7 : undefined });

      console.log("Login successful:", { userId, username });
      console.log("Response headers:", response.headers); // Check if Set-Cookie is present

      // Redirect to feed page
      // window.location.href = "/feed";
    } catch (error: any) {
      setIsLoading(false);
      console.error("Login error:", error);
      if (error.status === 400 && error.errors) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err: { field: string; message: string }) => {
          newErrors[err.field as keyof FormErrors] = err.message;
        });
        setErrors(newErrors);
      } else if (error.status === 401) {
        setServerError("Invalid email/username or password");
      } else if (error.status === 429) {
        setServerError("Too many login attempts. Please try again later.");
      } else {
        setServerError(error.message || ERROR_MESSAGES.SERVER_ERROR);
      }
    }
  };

  // Check if the form has any validation errors
  const validationErrors = validateForm(formData);
  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <section className="auth-form">
      <div className="auth-form__container">
        <h1 className="auth-form__title">Sign in</h1>
        <form onSubmit={handleSubmit} className="auth-form__form" aria-label="Login form">
          {/* Username or Email Input */}
          <Input
            id="usernameOrEmail"
            name="usernameOrEmail"
            type="text"
            label="Email or username"
            placeholder="Enter your email or username"
            value={formData.usernameOrEmail}
            onChange={handleChange}
            error={errors.usernameOrEmail}
            required
            autoComplete="username"
          />

          {/* Password Input */}
          <Input
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
            autoComplete="current-password"
          />

          {/* Password Requirements Info */}
          <p className="auth-form__info text-gray-500 text-xs mt-1">
            Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character (@$!%*?&).
          </p>

          {/* Server Error Message */}
          {serverError && (
            <div className="auth-form__error" role="alert">
              {serverError}
            </div>
          )}

          {/* Remember Me and Forgot Password */}
          <div className="auth-form__options">
            <label className="auth-form__checkbox">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="auth-form__checkbox-input"
              />
              <span className="auth-form__checkbox-label">Remember me</span>
            </label>
            <Link href="/forgot-password" className="auth-form__link">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || hasErrors}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>

          {/* Sign Up Link */}
          <p className="auth-form__signup">
            Don’t have an account?{" "}
            <Link href="/signup" className="auth-form__link">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default LoginForm;