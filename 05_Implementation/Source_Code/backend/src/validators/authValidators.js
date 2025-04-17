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
