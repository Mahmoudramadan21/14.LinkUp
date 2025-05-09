import { useState, FormEvent, ChangeEvent } from "react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import api from "@/utils/api";
import { setAuthData } from "@/utils/auth";
import { API_ENDPOINTS, ERROR_MESSAGES } from "@/utils/constants";
import Link from "next/link";

// Define form data type
interface FormData {
  profileName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender: "MALE" | "FEMALE" | "";
  dateOfBirth: string;
  marketingConsent: boolean;
}

// Define error type
interface FormErrors {
  profileName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  gender?: string;
  dateOfBirth?: string;
  marketingConsent?: string;
  captcha?: string;
}

// Define API response type
interface SignupResponse {
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    userId: number;
    username: string;
    profileName: string;
    profilePicture: string;
  };
}

// Validation function
const validateForm = (formData: FormData): FormErrors => {
  const errors: FormErrors = {};

  // Validate profileName
  const profileNameRegex = /^[a-zA-Z\s]{2,50}$/; // فقط حروف ومسافات، 2-50 حرفاً
  if (!formData.profileName.trim()) {
    errors.profileName = "Profile name is required";
  } else if (!profileNameRegex.test(formData.profileName)) {
    errors.profileName = "Profile name must be between 2 and 50 characters and contain only letters and spaces";
  }

  // Validate username
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  if (!formData.username.trim()) {
    errors.username = "Username is required";
  } else if (!usernameRegex.test(formData.username)) {
    errors.username = "Username must be 3-30 characters and can only contain letters, numbers, or underscores";
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email.trim()) {
    errors.email = "Email is required";
  } else if (!emailRegex.test(formData.email)) {
    errors.email = "Please enter a valid email address";
  }

  // Validate password
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!formData.password.trim()) {
    errors.password = "Password is required";
  } else if (!passwordRegex.test(formData.password)) {
    errors.password = "Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character (@$!%*?&)";
  }

  // Validate confirmPassword
  if (!formData.confirmPassword.trim()) {
    errors.confirmPassword = "Please confirm your password";
  } else if (formData.confirmPassword !== formData.password) {
    errors.confirmPassword = "Passwords do not match";
  }

  // Validate gender
  if (!formData.gender) {
    errors.gender = "Gender is required";
  } else if (!["MALE", "FEMALE"].includes(formData.gender)) {
    errors.gender = "Gender must be either Male or Female";
  }

  // Validate dateOfBirth
  if (!formData.dateOfBirth) {
    errors.dateOfBirth = "Date of birth is required";
  } else {
    const dob = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const dayDiff = today.getDate() - dob.getDate();
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (isNaN(dob.getTime())) {
      errors.dateOfBirth = "Please enter a valid date of birth";
    } else if (adjustedAge < 13) {
      errors.dateOfBirth = "You must be at least 13 years old to sign up";
    } else if (dob > today) {
      errors.dateOfBirth = "Date of birth cannot be in the future";
    }
  }

  return errors;
};

const SignupForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    profileName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    dateOfBirth: "",
    marketingConsent: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Handle input changes without real-time validation
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value, type } = e.target;
    const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    // Clear server error when user starts typing
    setServerError("");
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    // Validate the form on submission
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsLoading(true);
    setServerError("");

    try {
      // Format dateOfBirth to YYYY-MM-DD
      const formattedDateOfBirth = new Date(formData.dateOfBirth).toISOString().split("T")[0];

      // Log the data being sent
      console.log("Sending Signup Data:", {
        profileName: formData.profileName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        gender: formData.gender,
        dateOfBirth: formattedDateOfBirth,
      });

      const response = await api.post<SignupResponse>(
        API_ENDPOINTS.SIGNUP,
        {
          profileName: formData.profileName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          gender: formData.gender,
          dateOfBirth: formattedDateOfBirth,
        },
        {
          headers: {
            "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
          },
        }
      );
      const { accessToken, refreshToken, userId, username, profileName, profilePicture } = response.data.data;

      // Store auth data in localStorage
      setAuthData({
        accessToken,
        refreshToken,
        userId,
        username,
        profileName,
        profilePicture,
      });

      window.location.href = "/feed";
    } catch (error: any) {
      setIsLoading(false);
      if (error.status === 400 && error.errors) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err: { path: string; msg: string }) => {
          const field = err.path === "profilename" ? "profileName" : err.path;
          newErrors[field as keyof FormErrors] = err.msg;
        });
        setErrors(newErrors);
      } else if (error.status === 409) {
        setServerError("Email or username already exists");
      } else if (error.status === 400) {
        setServerError("Invalid registration data. Please check your inputs.");
      } else {
        setServerError(error.message || ERROR_MESSAGES.SERVER_ERROR);
      }
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <section className="auth-form signup-form">
      <div className="auth-form__container">
        <h1 className="auth-form__title signup-form__title">Sign up</h1>
        <p className="auth-form__subtitle signup-form__subtitle">Sign up with your email address</p>

        <form onSubmit={handleSubmit} className="auth-form__form" aria-label="Signup form" noValidate>
          {/* Profile Name */}
          <Input
            id="profileName"
            name="profileName"
            type="text"
            label="Profile name"
            placeholder="Enter your profile name"
            value={formData.profileName}
            onChange={handleChange}
            error={errors.profileName}
            required
            autoComplete="name"
          />

          {/* Username */}
          <Input
            id="username"
            name="username"
            type="text"
            label="Username"
            placeholder="Enter your username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            required
            autoComplete="username"
          />

          {/* Email */}
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            autoComplete="email"
          />

          {/* Password */}
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
            autoComplete="new-password"
          />

          {/* Confirm Password */}
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
          />

          {/* Password Requirements */}
          <p className="auth-form__info">
            Use 8 or more characters with a mix of letters, numbers & symbols
          </p>

          {/* Gender */}
          <div className="input-block">
            <div className="input-block__header">
              <label htmlFor="gender" className="input-block__label">
                What’s your gender?
                <span className="input-block__required" aria-hidden="true">
                  *
                </span>
              </label>
            </div>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={`input-block__input ${errors.gender ? "input-block__input--error" : ""}`}
              required
              aria-invalid={errors.gender ? "true" : "false"}
              aria-describedby={errors.gender ? "gender-error" : undefined}
            >
              <option value="" disabled>
                Select your gender
              </option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
            {errors.gender && (
              <span id="gender-error" className="input-block__error" role="alert">
                {errors.gender}
              </span>
            )}
          </div>

          {/* Date of Birth */}
          <div className="input-block">
            <div className="input-block__header">
              <label className="input-block__label">
                What’s your date of birth?
                <span className="input-block__required" aria-hidden="true">
                  *
                </span>
              </label>
            </div>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              error={errors.dateOfBirth}
              required
              className="input-block__input"
            />
          </div>

          {/* Marketing Consent */}
          <div className="auth-form__options">
            <label className="auth-form__checkbox">
              <input
                type="checkbox"
                name="marketingConsent"
                checked={formData.marketingConsent}
                onChange={handleChange}
                className="auth-form__checkbox-input"
              />
              <span className="auth-form__checkbox-label">
                Share my registration data with our content providers for marketing purposes.
              </span>
            </label>
          </div>

          {/* Terms and Privacy Policy */}
          <p className="auth-form__info text-sm">
            By creating an account, you agree to the{" "}
            <Link href="/terms" className="auth-form__link">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="auth-form__link">
              Privacy Policy
            </Link>.
          </p>

          {/* Server Error */}
          {serverError && (
            <div className="auth-form__error" role="alert">
              {serverError}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            aria-label="Sign up"
          >
            {isLoading ? "Signing up..." : "Sign up"}
          </Button>

          {/* Login Link */}
          <p className="auth-form__signup">
            Already have an account?{" "}
            <Link href="/login" className="auth-form__link">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default SignupForm;