const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const prisma = require("../utils/prisma");
const redis = require("../utils/redis");
const { sendResetEmail } = require("../services/emailService");
const { register, login: serviceLogin } = require("../services/authService");
/**
 * Handles user registration with email/username availability check
 * and password hashing
 */
const SALT_ROUNDS = 10; // Define salt rounds
const signup = async (req, res) => {
  console.log("Signup request received:", req.body); // Log incoming request

  const { username, email, password } = req.body;

  try {
    // Validate input
    if (!username || !email || !password) {
      console.log("Missing required fields:", { username, email, password });
      return res
        .status(400)
        .json({ message: "Username, email, and password are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Invalid email format:", email);
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      console.log("Invalid username format:", username);
      return res.status(400).json({
        message:
          "Username must be 3-30 characters long and contain only letters, numbers, or underscores",
      });
    }

    // Validate password strength
    if (password.length < 8) {
      console.log("Password too short:", password.length);
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    // Check for existing user
    console.log("Checking for existing user:", { email, username });
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ Email: email }, { Username: username }] },
    });

    if (existingUser) {
      console.log("User already exists:", {
        email: existingUser.Email,
        username: existingUser.Username,
      });
      return res
        .status(409)
        .json({ message: "Email or username already exists" });
    }

    // Hash password
    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    console.log("Password hashed successfully");

    // Create user
    console.log("Creating new user...");
    const newUser = await prisma.user.create({
      data: {
        Username: username,
        Email: email,
        Password: hashedPassword,
        Role: "USER", // Default role
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      },
      select: {
        UserID: true,
        Username: true,
        Email: true,
      },
    });
    console.log("User created:", newUser);

    // Generate tokens (to match login behavior)
    const accessToken = jwt.sign(
      { userId: newUser.UserID },
      process.env.JWT_SECRET,
      { expiresIn: "15m", issuer: "linkup-api" }
    );
    const refreshToken = jwt.sign(
      { userId: newUser.UserID },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d", issuer: "linkup-api" }
    );

    // Store refresh token in Redis
    console.log("Storing refresh token in Redis...");
    await redis.set(
      `refresh_token:${newUser.UserID}`,
      refreshToken,
      7 * 24 * 60 * 60
    );
    console.log("Refresh token stored");

    // Send response
    res.status(201).json({
      message: "User registered successfully",
      data: {
        userId: newUser.UserID,
        username: newUser.Username,
        email: newUser.Email,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      message: "Error registering user",
      error: process.env.NODE_ENV === "development" ? error.stack : null,
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
    console.log("Login attempt:", { usernameOrEmail });
    if (!usernameOrEmail || !password) {
      return res
        .status(400)
        .json({ message: "Username/email and password required" });
    }

    const { user, tokens } = await serviceLogin(usernameOrEmail, password);
    res.json({
      message: "Login successful",
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: user.UserID,
        username: user.Username,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    if (error.message.includes("Invalid credentials")) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (error.message.includes("redis.set")) {
      return res.status(503).json({ message: "Failed to store refresh token" });
    }
    res.status(500).json({
      message: "Authentication failed",
      error: process.env.NODE_ENV === "development" ? error.message : null,
    });
  }
};

/**
 * Refreshes access token using a valid refresh token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    console.log("Received refreshToken:", refreshToken);
    if (!refreshToken || typeof refreshToken !== "string") {
      return res.status(400).json({ error: "Valid refresh token required" });
    }

    let decoded;
    try {
      if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error("JWT_REFRESH_SECRET not configured");
      }
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      console.log("Decoded refresh token:", decoded);
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError.message);
      return res
        .status(401)
        .json({ error: "Invalid or expired refresh token" });
    }

    if (!decoded.userId) {
      return res.status(400).json({ error: "Invalid token payload" });
    }

    let storedToken;
    try {
      // Retrieve token as plain string
      storedToken = await redis.get(`refresh_token:${decoded.userId}`);
      console.log(
        `Retrieved refresh_token:${decoded.userId} from Redis:`,
        storedToken
      );
    } catch (redisError) {
      console.error("Redis get error in refreshToken:", redisError.message);
      return res.status(503).json({ error: "Redis service unavailable" });
    }

    if (!storedToken || storedToken !== refreshToken) {
      console.error("Refresh token mismatch or not found in Redis");
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { UserID: decoded.userId },
        select: { UserID: true, Username: true, IsBanned: true },
      });
    } catch (dbError) {
      console.error("Database error in refreshToken:", dbError.message);
      return res.status(503).json({ error: "Database connection failed" });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.IsBanned) {
      return res.status(403).json({ error: "User is banned" });
    }

    const accessToken = jwt.sign(
      { userId: user.UserID },
      process.env.JWT_SECRET,
      { expiresIn: "15m", issuer: "linkup-api" }
    );
    const newRefreshToken = jwt.sign(
      { userId: user.UserID },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d", issuer: "linkup-api" }
    );

    try {
      // Store new refresh token as plain string
      await redis.set(
        `refresh_token:${user.UserID}`,
        newRefreshToken,
        7 * 24 * 60 * 60
      );
      console.log(`Stored new refresh_token:${user.UserID} in Redis`);
    } catch (redisError) {
      console.error("Redis set error in refreshToken:", redisError.message);
      return res
        .status(503)
        .json({ error: "Failed to store new refresh token" });
    }

    res.json({
      message: "Token refreshed successfully",
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch (error) {
    console.error("refreshToken error:", error.message);
    res.status(500).json({ error: "Failed to refresh token" });
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

module.exports = { signup, login, forgotPassword, refreshToken, resetPassword };
