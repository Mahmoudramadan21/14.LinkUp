const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../utils/prisma");
const { sendResetEmail } = require("../services/emailService");

// Salt rounds for password hashing - value between 10-12 is recommended
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = "1h"; // JWT expiry time

/**
 * Handles user registration with email/username availability check
 * and password hashing
 */
const signup = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check for existing user using compound query
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ Email: email }, { Username: username }] },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email or username already exists." });
    }

    // Hash password with bcrypt (async operation)
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await prisma.user.create({
      data: { Username: username, Email: email, Password: hashedPassword },
    });

    // Omit sensitive data from response
    res.status(201).json({
      message: "User registered successfully",
      userId: newUser.UserID,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      message: "Error registering user",
      error: process.env.NODE_ENV === "development" ? error.message : null,
    });
  }
};

/**
 * Authenticates user and returns JWT token
 * Uses constant-time comparison to prevent timing attacks
 */
const login = async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ Username: usernameOrEmail }, { Email: usernameOrEmail }],
      },
    });

    // Constant-time comparison for security
    const isValid = user && (await bcrypt.compare(password, user.Password));
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Sign JWT with user ID and email
    const token = jwt.sign(
      { userId: user.UserID, email: user.Email },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      expiresIn: TOKEN_EXPIRY,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Authentication failed",
      error: process.env.NODE_ENV === "development" ? error.message : null,
    });
  }
};

/**
 * Initiates password reset flow
 * Uses time-based token with expiry for security
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { Email: email } });

    if (user) {
      // Generate cryptographically secure token
      const resetToken = crypto.randomBytes(20).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry

      await prisma.user.update({
        where: { UserID: user.UserID },
        data: { resetToken, resetTokenExpiry },
      });

      // In production, use frontend URL from config
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await sendResetEmail(email, resetLink);
    }

    // Generic response to prevent email enumeration
    res.status(200).json({
      message: "If the email exists, a reset link has been sent",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Error processing request" });
  }
};

/**
 * Completes password reset flow
 * Validates token and updates credentials
 */
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Find valid, non-expired token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Clear reset token after use (one-time use)
    await prisma.user.update({
      where: { UserID: user.UserID },
      data: {
        Password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ message: "Error updating password" });
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
};
