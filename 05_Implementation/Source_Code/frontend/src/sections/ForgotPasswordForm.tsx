import { useState, FormEvent, ChangeEvent } from "react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import api from "@/utils/api";
import { API_ENDPOINTS, ERROR_MESSAGES } from "@/utils/constants";
import Link from "next/link";

// Define form data type
interface FormData {
  email: string;
}

// Define error type
interface FormErrors {
  email?: string;
}

// Define API response type
interface ForgotPasswordResponse {
  message: string;
  codeSent: boolean;
}

// Validation function
const validateForm = (formData: FormData): FormErrors => {
  const errors: FormErrors = {};

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email.trim()) {
    errors.email = "Email is required";
  } else if (!emailRegex.test(formData.email)) {
    errors.email = "Please enter a valid email address";
  }

  return errors;
};

const ForgotPasswordForm: React.FC = () => {
  // State for form inputs and errors
  const [formData, setFormData] = useState<FormData>({
    email: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string>("");
  const [serverSuccess, setServerSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
      const response = await api.post<ForgotPasswordResponse>(
        API_ENDPOINTS.FORGOT_PASSWORD,
        { email: formData.email }
      );

      // Store the email in localStorage for the next step
      localStorage.setItem("resetEmail", formData.email);

      setServerSuccess("If the email exists, a verification code has been sent.");
      setFormData({ email: "" }); // Clear the form

      // Redirect to the verify-code page
      setTimeout(() => {
        window.location.href = "/verify-code";
      }, 1500);
    } catch (error: any) {
      if (error.status === 400 && error.errors) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err: { field: string; error: string }) => {
          newErrors.email = err.error;
        });
        setErrors(newErrors);
      } else if (error.status === 500) {
        setServerError("Error processing request.");
      } else {
        setServerError(error.message || ERROR_MESSAGES.SERVER_ERROR);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check if the form has any validation errors
  const validationErrors = validateForm(formData);
  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <section className="auth-form auth-form--forgot-password">
      <div className="auth-form__container">
        <h1 className="auth-form__title">Forgot Your Password?</h1>
        <p className="auth-form__subtitle">
          To request a new password, enter your email
        </p>

        <form
          onSubmit={handleSubmit}
          className="auth-form__form"
          aria-label="Forgot password form"
          noValidate
        >
          {/* Email Input */}
          <Input
            id="email"
            name="email"
            type="email"
            label="Enter your email"
            placeholder="Your email address"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            autoComplete="email"
          />

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
            aria-label="Continue with password reset request"
          >
            {isLoading ? "Sending..." : "Continue"}
          </Button>

          {/* Back to Sign In Link */}
          <p className="auth-form__signup">
            <Link href="/login" className="auth-form__link">
              Back to Sign In
            </Link>
          </p>

          {/* Sign Up Link */}
          <p className="auth-form__signup">
            Don’t have an account?{" "}
            <Link href="/signup" className="auth-form__link">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default ForgotPasswordForm;