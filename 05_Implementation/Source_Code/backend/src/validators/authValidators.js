const { body } = require("express-validator");
const {
  validateUsername,
  validateEmail,
  validatePassword,
} = require("../utils/validators");

// Validate date of birth (ensure user is at least 13 years old)
const validateDateOfBirth = (value) => {
  const dob = new Date(value);
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();

  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  if (isNaN(dob.getTime())) {
    throw new Error("Invalid date of birth format");
  }

  if (age < 13) {
    throw new Error("You must be at least 13 years old to register");
  }

  return true;
};

/**
 * Validation rules for user sign-up
 * Ensures all required fields meet specific criteria
 */
const signupValidationRules = [
  body("profilename")
    .notEmpty()
    .withMessage("Profile name is required")
    .matches(/^[a-zA-Z0-9\s\-']{3,50}$/)
    .withMessage(
      "Profile name must be 3-50 characters long and can only contain letters, numbers, spaces, hyphens, or apostrophes"
    ),
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .custom(validateUsername)
    .withMessage(
      "Username must be 3-20 characters long and can only contain letters, numbers, and underscores."
    ),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .custom(validatePassword)
    .withMessage(
      "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
    ),
  body("gender")
    .notEmpty()
    .withMessage("Gender is required")
    .isIn(["MALE", "FEMALE", "OTHER"])
    .withMessage("Gender must be one of: MALE, FEMALE, OTHER"),
  body("dateOfBirth")
    .notEmpty()
    .withMessage("Date of birth is required")
    .isISO8601()
    .withMessage(
      "Date of birth must be a valid date in ISO format (e.g., 2000-01-01)"
    )
    .custom(validateDateOfBirth),
];

/**
 * Validation rules for user login
 * Accepts either username or email, with password validation
 */
const loginValidationRules = [
  body("usernameOrEmail")
    .notEmpty()
    .withMessage("Username or email is required")
    .custom((value) => {
      if (!validateEmail(value) && !validateUsername(value)) {
        throw new Error("Invalid username or email format");
      }
      return true;
    }),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .custom((value) => {
      if (!validatePassword(value)) {
        throw new Error(
          "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
        );
      }
      return true;
    }),
];

/**
 * Validation rules for forgot password
 * Ensures email is provided and valid
 */
const forgotPasswordValidationRules = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),
];

/**
 * Validation rules for verifying the 4-digit code
 * Ensures email and code are provided and valid
 */
const verifyCodeValidationRules = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),
  body("code")
    .isString()
    .matches(/^[0-9]{4}$/)
    .withMessage("Verification code must be a 4-digit number"),
];

/**
 * Validation rules for resetting password with a temporary token
 * Ensures resetToken and newPassword are provided and valid
 */
const resetPasswordValidationRules = [
  body("resetToken")
    .isString()
    .notEmpty()
    .withMessage("Reset token is required"),
  body("newPassword")
    .isString()
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .custom(validatePassword)
    .withMessage(
      "New password must include at least one uppercase letter, one lowercase letter, one number, and one special character."
    ),
];

module.exports = {
  signupValidationRules,
  loginValidationRules,
  forgotPasswordValidationRules,
  verifyCodeValidationRules,
  resetPasswordValidationRules,
};
