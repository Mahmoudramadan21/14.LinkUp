const express = require("express");
const {
  signup,
  login,
  refreshToken: controllerRefreshToken,
  forgotPassword,
  verifyCode,
  resetPassword,
  logout,
} = require("../controllers/authController");
const {
  signupValidationRules,
  loginValidationRules,
  forgotPasswordValidationRules,
  verifyCodeValidationRules,
  resetPasswordValidationRules,
} = require("../validators/authValidators");
const { validate } = require("../middleware/validationMiddleware");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 attempts
  message: "Too many login attempts, please try again after 15 minutes",
});

// Fixed cookie name for sessionId (obfuscated but constant)
const SESSION_COOKIE_NAME = "qkz7m4p8v2";

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: APIs for user authentication and account management
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     UserAuth:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 30
 *           pattern: '^[a-zA-Z0-9_]+$'
 *           example: john_doe
 *           description: Unique username (alphanumeric and underscores only)
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *           description: Valid email address
 *         password:
 *           type: string
 *           minLength: 8
 *           example: P@ssw0rd123
 *           description: Password with minimum 8 characters
 *     LoginCredentials:
 *       type: object
 *       required:
 *         - usernameOrEmail
 *         - password
 *       properties:
 *         usernameOrEmail:
 *           type: string
 *           example: john_doe
 *           description: Username or email address
 *         password:
 *           type: string
 *           minLength: 8
 *           example: P@ssw0rd123
 *           description: User password
 *     PasswordResetRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *           description: Email address associated with the account
 *     VerifyCodeRequest:
 *       type: object
 *       required:
 *         - email
 *         - code
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *           description: Email address associated with the account
 *         code:
 *           type: string
 *           pattern: '^[0-9]{4}$'
 *           example: "1234"
 *           description: 4-digit verification code received via email
 *     PasswordResetWithToken:
 *       type: object
 *       required:
 *         - resetToken
 *         - newPassword
 *       properties:
 *         resetToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *           description: Temporary token received after code verification
 *         newPassword:
 *           type: string
 *           minLength: 8
 *           example: NewP@ssw0rd123
 *           description: New password with minimum 8 characters
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *         codeSent:
 *           type: boolean
 *           description: Indicates if a code was sent (optional)
 *         resetToken:
 *           type: string
 *           description: Temporary token for password reset (optional)
 *         data:
 *           type: object
 *           description: Additional data (optional)
 *       example:
 *         message: Operation successful
 *         data: {}
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *         error:
 *           type: string
 *           description: Detailed error description (optional, development only)
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *               error:
 *                 type: string
 *           description: Validation errors (optional)
 *       example:
 *         message: Validation failed
 *         errors:
 *           - field: email
 *             error: Invalid email format
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserAuth'
 *     responses:
 *       201:
 *         description: User registered successfully, session ID set as a secure cookie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               message: User registered successfully
 *               data:
 *                 userId: 1
 *                 username: john_doe
 *                 email: john@example.com
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: qkz7m4p8v2=123e4567-e89b-12d3-a456-426614174000; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
 *             description: Sets session ID as a secure cookie with a fixed name (qkz7m4p8v2), along with dummy cookies for obfuscation
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email or username already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/signup", signupValidationRules, validate, signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and set session ID as a secure cookie
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginCredentials'
 *     responses:
 *       200:
 *         description: Login successful, session ID set as a secure cookie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               message: Login successful
 *               data:
 *                 userId: 1
 *                 username: john_doe
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: qkz7m4p8v2=123e4567-e89b-12d3-a456-426614174000; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
 *             description: Sets session ID as a secure cookie with a fixed name (qkz7m4p8v2), along with dummy cookies for obfuscation
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", loginLimiter, loginValidationRules, validate, login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using session ID from cookies
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               message: Token refreshed successfully
 *               data: {}
 *       400:
 *         description: Missing session ID in cookies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description Gravity: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: User is banned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       503:
 *         description: Service unavailable (Redis or database)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/refresh", controllerRefreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user and clear session ID cookie and dummy cookies
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully, session ID cookie and dummy cookies cleared
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               message: Logged out successfully
 *               data: {}
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: qkz7m4p8v2=; Max-Age=0; HttpOnly; Secure; SameSite=Strict
 *             description: Clears session ID cookie (qkz7m4p8v2) and dummy cookies
 *       401:
 *         description: Unauthorized - No user authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/logout", logout);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset verification code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetRequest'
 *     responses:
 *       200:
 *         description: Verification code sent (or queued) if account exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/forgot-password",
  forgotPasswordValidationRules,
  validate,
  forgotPassword
);

/**
 * @swagger
 * /auth/verify-code:
 *   post:
 *     summary: Verify the 4-digit verification code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyCodeRequest'
 *     responses:
 *       200:
 *         description: Code verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid or expired verification code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/verify-code", verifyCodeValidationRules, validate, verifyCode);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset user password using a temporary token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetWithToken'
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid or expired reset token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/reset-password",
  resetPasswordValidationRules,
  validate,
  resetPassword
);

module.exports = router;
