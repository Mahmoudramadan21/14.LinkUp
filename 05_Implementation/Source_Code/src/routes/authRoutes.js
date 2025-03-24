const express = require("express");
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const {
  signupValidationRules,
  loginValidationRules,
  forgotPasswordValidationRules,
  resetPasswordValidationRules,
} = require("../validators/authValidators");
const { validate } = require("../middleware/validationMiddleware");

const router = express.Router();

// Sign-up route
router.post("/signup", signupValidationRules, validate, signup);

// Login route
router.post("/login", loginValidationRules, validate, login);

// Forgot password route
router.post(
  "/forgot-password",
  forgotPasswordValidationRules,
  validate,
  forgotPassword
);

// Reset password route
router.post(
  "/reset-password",
  resetPasswordValidationRules,
  validate,
  resetPassword
);

module.exports = router;
