import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import api from "@/utils/api";
import { API_ENDPOINTS, ERROR_MESSAGES } from "@/utils/constants";
import Link from "next/link";

// Define form data type
interface FormData {
  resetToken: string;
  email: string;
  newPassword: string;
  confirmPassword: string;
}

// Define error type
interface FormErrors {
  resetToken?: string;
  email?: string;
  newPassword?: string;
  confirmPassword?: string;
}

// Define API response type
interface ResetPasswordResponse {
  message: string;
  data: Record<string, never>;
}

// Password validation function
const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain at least one special character";
  }
  return null;
};

// Form validation function
const validateForm = (formData: FormData): FormErrors => {
  const errors: FormErrors = {};

  // Validate resetToken
  if (!formData.resetToken) {
    errors.resetToken = "No valid reset token found. Please start the password reset process again.";
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email || !emailRegex.test(formData.email)) {
    errors.email = "No valid email found. Please start the password reset process again.";
  }

  // Validate new password
  const passwordError = validatePassword(formData.newPassword);
  if (passwordError) {
    errors.newPassword = passwordError;
  }

  // Validate confirm password
  if (formData.newPassword !== formData.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
};

const ResetPasswordForm: React.FC = () => {
  // State for form inputs and errors
  const [formData, setFormData] = useState<FormData>({
    resetToken: "",
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string>("");
  const [serverSuccess, setServerSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Retrieve resetToken and email from sessionStorage
  useEffect(() => {
    const resetToken = sessionStorage.getItem("resetToken") || "";
    const email = sessionStorage.getItem("resetEmail") || "";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const newErrors: FormErrors = {};

    if (!resetToken) {
      newErrors.resetToken = "No valid reset token found. Please start the password reset process again.";
    }
    if (!email || !emailRegex.test(email)) {
      newErrors.email = "No valid email found. Please start the password reset process again.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setFormData((prev) => ({ ...prev, resetToken, email }));
    }
  }, []);

  // Handle input changes with real-time validation
  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate the entire form
    const updatedFormData = { ...formData, [name]: value };
    const newErrors = validateForm(updatedFormData);
    setErrors(newErrors);
    setServerError("");
    setServerSuccess("");
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword((prev) => !prev);

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    // Validate the form before submission
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsLoading(true);
    setServerError("");
    setServerSuccess("");

    try {
      const response = await api.post<ResetPasswordResponse>(
        API_ENDPOINTS.RESET_PASSWORD,
        { resetToken: formData.resetToken, newPassword: formData.newPassword, email: formData.email },
        {
          headers: {
            "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
          },
        }
      );

      setServerSuccess("Password reset successfully.");
      // Clear sessionStorage
      sessionStorage.removeItem("resetToken");
      sessionStorage.removeItem("resetEmail");
      setFormData({ resetToken: "", email: "", newPassword: "", confirmPassword: "" }); // Clear the form
      window.location.href = "/password-reset-success";
    } catch (error: any) {
      if (error.status === 400 && error.errors) {
        const newErrors: FormErrors = {};
        newErrors.newPassword = error.errors[0]?.msg || "Invalid password format";
        setErrors(newErrors);
      } else if (error.status === 401) {
        setServerError("Invalid or expired reset token, or email mismatch. Please start the password reset process again.");
      } else if (error.status === 429) {
        setServerError("Too many attempts. Please try again later.");
      } else if (error.status === 500) {
        setServerError("Internal server error. Please try again later.");
      } else {
        setServerError(error.message || ERROR_MESSAGES.SERVER_ERROR);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If there's a resetToken or email error, show a message with a link to /forgot-password
  if (errors.resetToken || errors.email) {
    return (
      <section className="auth-form auth-form--reset-password">
        <div className="auth-form__container">
          <h1 className="auth-form__title">Reset Password</h1>
          <div className="auth-form__error" role="alert">
            {errors.resetToken || errors.email}
          </div>
          <p className="auth-form__signup">
            <Link href="/forgot-password" className="auth-form__link">
              Start the password reset process again
            </Link>
          </p>
        </div>
      </section>
    );
  }

  // Check if the form has any validation errors (excluding resetToken and email errors, which are handled above)
  const validationErrors = validateForm(formData);
  const hasErrors = Object.keys(validationErrors).length > 0 && !validationErrors.resetToken && !validationErrors.email;

  return (
    <section className="auth-form auth-form--reset-password">
      <div className="auth-form__container">
        <h1 className="auth-form__title">Reset Password</h1>
        <p className="auth-form__subtitle">
          Set the new password for your account so you can login and access all features.
        </p>

        <form
          onSubmit={handleSubmit}
          className="auth-form__form"
          aria-label="Reset password form"
          noValidate
        >
          {/* New Password Input */}
          <div className="auth-form__input-group">
            <Input
              id="newPassword"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              label="Enter new password"
              placeholder="Your password"
              value={formData.newPassword}
              onChange={handleChange}
              error={errors.newPassword}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="auth-form__toggle-visibility"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Confirm Password Input */}
          <div className="auth-form__input-group">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              label="Confirm password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="auth-form__toggle-visibility"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Server Success Message */}
          {serverSuccess && (
            <div className="auth-form__success" role="alert">
              {serverSuccess}
            </div>
          )}

          {/* Server Error Message */}
          {serverError && (
            <div className="auth-form__error" role="alert">
              {serverError}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || hasErrors}
            aria-label="Reset password"
          >
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default ResetPasswordForm;