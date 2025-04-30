import { useState, useEffect, FormEvent } from "react";
import CodeInput from "@/components/CodeInput";
import Button from "@/components/Button";
import api from "@/utils/api";
import { API_ENDPOINTS, ERROR_MESSAGES } from "@/utils/constants";
import Link from "next/link";

// Define form data type
interface FormData {
  email: string;
  code: string;
}

// Define error type
interface FormErrors {
  email?: string;
  code?: string;
}

// Define API response type
interface VerifyCodeResponse {
  message: string;
  data: { resetToken?: string };
}

const VerificationCodeForm: React.FC = () => {
  // State for form inputs and errors
  const [formData, setFormData] = useState<FormData>({
    email: "",
    code: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string>("");
  const [serverSuccess, setServerSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Retrieve and validate email from sessionStorage
  useEffect(() => {
    const email = sessionStorage.getItem("resetEmail") || "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      setErrors({ email: "No valid email found. Please start the password reset process." });
    } else {
      setFormData((prev) => ({ ...prev, email }));
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // Handle code change
  const handleCodeChange = (code: string) => {
    setFormData((prev) => ({ ...prev, code }));
    setErrors((prev) => ({ ...prev, code: undefined }));
    setServerError("");
    setServerSuccess("");
  };

  // Handle resend code
  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setServerError("");
    setServerSuccess("");

    try {
      await api.post(API_ENDPOINTS.FORGOT_PASSWORD, { email: formData.email });
      setServerSuccess("A new verification code has been sent to your email.");
      setTimer(30);
      setCanResend(false);
    } catch (error: any) {
      setServerError(error.message || ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    // Validate email and code
    const errors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      errors.email = "No valid email found. Please start the password reset process.";
    }
    if (!formData.code || formData.code.length !== 4) {
      errors.code = "Please enter a 4-digit code";
    }

    setErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsLoading(true);
    setServerError("");
    setServerSuccess("");

    try {
      const response = await api.post<VerifyCodeResponse>(
        API_ENDPOINTS.VERIFY_CODE,
        { email: formData.email, code: formData.code },
        {
          headers: {
            "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
          },
        }
      );

      // Store the resetToken in sessionStorage
      if (response.data.resetToken) {
        sessionStorage.setItem("resetToken", response.data.resetToken);
      } else {
        throw new Error("Reset token not provided by the server.");
      }

      setServerSuccess("Code verified successfully.");
      // Do NOT remove resetEmail here; keep it for the next step
      setTimeout(() => {
        window.location.href = "/reset-password";
      }, 1500);
    } catch (error: any) {
      if (error.status === 400 && error.errors) {
        const newErrors: FormErrors = {};
        newErrors.code = error.errors[0]?.msg || "Invalid or expired verification code";
        setErrors(newErrors);
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

  // Format timer as MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // If there's an email error (i.e., no valid email in sessionStorage), show a message with a link to /forgot-password
  if (errors.email) {
    return (
      <section className="auth-form auth-form--verify-code">
        <div className="auth-form__container">
          <h1 className="auth-form__title">Verification</h1>
          <div className="auth-form__error" role="alert">
            {errors.email}
          </div>
          <p className="auth-form__signup">
            <Link href="/forgot-password" className="auth-form__link">
              Go back to Forgot Password
            </Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-form auth-form--verify-code">
      <div className="auth-form__container">
        <h1 className="auth-form__title">Verification</h1>
        <p className="auth-form__subtitle">
          Enter your 4-digit code that you received on your email
        </p>

        <form
          onSubmit={handleSubmit}
          className="auth-form__form"
          aria-label="Verification code form"
          noValidate
        >
          {/* Code Input */}
          <CodeInput
            length={4}
            onChange={handleCodeChange}
            error={errors.code}
          />

          {/* Timer */}
          <div className="auth-form__timer" aria-live="polite">
            {formatTimer(timer)}
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
            disabled={isLoading || formData.code.length !== 4}
            aria-label="Continue with verification code"
          >
            {isLoading ? "Verifying..." : "Continue"}
          </Button>

          {/* Resend Link */}
          <p className="auth-form__resend">
            If you didn’t receive a code!{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend || isLoading}
              className={`auth-form__resend-link ${!canResend || isLoading ? "auth-form__resend-link--disabled" : ""}`}
              aria-label="Resend verification code"
            >
              Resend
            </button>
          </p>
        </form>
      </div>
    </section>
  );
};

export default VerificationCodeForm;