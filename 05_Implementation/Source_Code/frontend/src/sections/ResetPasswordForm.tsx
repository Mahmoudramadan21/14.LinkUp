import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import api from "@/utils/api";
import { API_ENDPOINTS, ERROR_MESSAGES } from "@/utils/constants";
import Link from "next/link";

// Define form data type
interface FormData {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

// Define error type
interface FormErrors {
  resetToken?: string;
  newPassword?: string;
  confirmPassword?: string;
}

// Define API response type
interface ResetPasswordResponse {
  message: string;
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
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string>("");
  const [serverSuccess, setServerSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Retrieve resetToken from localStorage
  useEffect(() => {
    const resetToken = localStorage.getItem("resetToken") || "";
    const newErrors: FormErrors = {};

    if (!resetToken) {
      newErrors.resetToken = "No valid reset token found. Please start the password reset process again.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setFormData((prev) => ({ ...prev, resetToken }));
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
        { resetToken: formData.resetToken, newPassword: formData.newPassword }
      );

      setServerSuccess("Password updated successfully.");
      // Clear localStorage
      localStorage.removeItem("resetToken");
      localStorage.removeItem("resetEmail");
      setFormData({ resetToken: "", newPassword: "", confirmPassword: "" }); // Clear the form
      window.location.href = "/password-reset-success";
    } catch (error: any) {
      if (error.status === 400) {
        setErrors({ newPassword: "New password must be at least 8 characters long" });
      } else if (error.status === 401) {
        setServerError("Invalid or expired reset token. Please start the password reset process again.");
      } else if (error.status === 500) {
        setServerError("Error updating password.");
      } else {
        setServerError(error.message || ERROR_MESSAGES.SERVER_ERROR);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If there's a resetToken error, show a message with a link to /forgot-password
  if (errors.resetToken) {
    return (
      <section className="auth-form auth-form--reset-password">
        <div className="auth-form__container">
          <h1 className="auth-form__title">Reset Password</h1>
          <div className="auth-form__error" role="alert">
            {errors.resetToken}
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

  // Check if the form has any validation errors (excluding resetToken errors)
  const validationErrors = validateForm(formData);
  const hasErrors = Object.keys(validationErrors).length > 0 && !validationErrors.resetToken;

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