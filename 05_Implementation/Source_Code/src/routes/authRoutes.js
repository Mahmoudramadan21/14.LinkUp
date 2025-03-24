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

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     description: Register a new user with email, username, and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input
 */
// Route for user signup
router.post("/signup", signupValidationRules, validate, signup);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     description: Login with email/username and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Invalid credentials
 */
// Route for user login
router.post("/login", loginValidationRules, validate, login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send a password reset link to the user's email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset link sent
 *       404:
 *         description: User not found
 */
// Route for forgot password
router.post(
  "/forgot-password",
  forgotPasswordValidationRules,
  validate,
  forgotPassword
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     description: Reset the user's password using a token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid token or input
 */
// Route for resetting password
router.post(
  "/reset-password",
  resetPasswordValidationRules,
  validate,
  resetPassword
);

module.exports = router;
