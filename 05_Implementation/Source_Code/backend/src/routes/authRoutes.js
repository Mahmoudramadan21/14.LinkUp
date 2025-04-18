const express = require("express");
const {
  signup,
  login,
  refreshToken: controllerRefreshToken,
  forgotPassword,
  verifyCode,
  resetPassword,
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
 *           description: Password with minimum 8 characters, including one uppercase, one lowercase, one number, and one special character
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
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *           description: Valid refresh token
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
 *           description: New password with minimum 8 characters, including one uppercase, one lowercase, one number, and one special character
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
 *         description: User registered successfully
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
 *                 accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Username, email, and password are required
 *               errors:
 *                 - field: username
 *                   error: Username is required
 *       409:
 *         description: Email or username already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Email or username already exists
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Error registering user
 */
router.post("/signup", signupValidationRules, validate, signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and get access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginCredentials'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               message: Login successful
 *               data:
 *                 accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 userId: 1
 *                 username: john_doe
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Username or email is required
 *               errors:
 *                 - field: usernameOrEmail
 *                   error: Username or email is required
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Invalid credentials
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Too many login attempts, please try again after 15 minutes
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Authentication failed
 */
router.post("/login", loginLimiter, loginValidationRules, validate, login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               message: Token refreshed successfully
 *               data:
 *                 accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid or missing refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Valid refresh token required
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Invalid or expired refresh token
 *       403:
 *         description: User is banned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: User is banned
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: User not found
 *       503:
 *         description: Service unavailable (Redis or database)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Redis service unavailable
 */
router.post("/refresh", controllerRefreshToken);

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
 *             example:
 *               message: If the email exists, a verification code has been sent
 *               codeSent: true
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Email is required
 *               errors:
 *                 - field: email
 *                   error: Email is required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Error processing request
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
 *             example:
 *               message: Code verified successfully
 *               resetToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid or expired verification code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Invalid or expired verification code
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Error verifying code
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
 *             example:
 *               message: Password updated successfully
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: New password must be at least 8 characters long
 *       401:
 *         description: Invalid or expired reset token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Invalid or expired reset token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Error updating password
 */
router.post(
  "/reset-password",
  resetPasswordValidationRules,
  validate,
  resetPassword
);

module.exports = router;
