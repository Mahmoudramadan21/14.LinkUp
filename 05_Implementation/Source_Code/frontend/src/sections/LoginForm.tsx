import { useState, FormEvent } from "react";
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

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
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
    //   window.location.href = "/feed";
    } catch (error: any) {
      setIsLoading(false);
      console.error("Login error:", error);
      if (error.status === 400 && error.errors) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err: { field: string; message: string }) => {
          newErrors[err.field as keyof FormErrors] = err.message;
        });
        setErrors(newErrors);
      } else {
        setServerError(error.message || ERROR_MESSAGES.SERVER_ERROR);
      }
    }
  };

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
            label="Email or phone number"
            placeholder="Enter your email address"
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
              forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button type="submit" variant="primary" disabled={isLoading}>
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