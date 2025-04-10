const { body } = require("express-validator");
const {
  validateUsername,
  validateEmail,
  validatePassword,
} = require("../utils/validators");

/**
 * Validation rules for user sign-up
 * Ensures username, email, and password meet specific criteria
 */
const signupValidationRules = [
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
        return true; // Note: This seems incorrect; should likely throw an error if invalid
      }
      return true;
    }),
];

// Forgot password validation rules
const forgotPasswordValidationRules = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),
];

// Reset password validation rules
const resetPasswordValidationRules = [
  body("token").notEmpty().withMessage("Token is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .custom(validatePassword)
    .withMessage(
      "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
    ),
];

module.exports = {
  signupValidationRules,
  loginValidationRules,
  forgotPasswordValidationRules,
  resetPasswordValidationRules,
};
