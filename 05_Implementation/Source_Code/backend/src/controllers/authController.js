const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const prisma = require("../utils/prisma");
const redis = require("../utils/redis");
const { sendResetEmail } = require("../services/emailService");
const { register, login: serviceLogin } = require("../services/authService");

const SALT_ROUNDS = 10; // Define salt rounds

/**
 * Handles user registration with email/username availability check
 * and password hashing
 */
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
      where: { OR: [{ Email: email.toLowerCase() }, { Username: username }] },
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

    // Create user and welcome notification
    console.log("Creating new user...");
    const newUser = await prisma.user.create({
      data: {
        Username: username,
        Email: email.toLowerCase(), // Store email in lowercase
        Password: hashedPassword,
        Role: "USER",
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      },
      select: {
        UserID: true,
        Username: true,
        Email: true,
      },
    });

    // Create welcome notification
    await prisma.notification.create({
      data: {
        UserID: newUser.UserID,
        Type: "ADMIN_WARNING", // Replace with "WELCOME" if enum is updated
        Content: `Welcome to LinkUp, ${username}! Start exploring and connecting!`,
        Metadata: { signupDate: new Date().toISOString() },
      },
    });
    console.log("User created:", newUser);

    // Generate tokens
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
 * Initiates password reset flow by sending a 4-digit verification code
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { Email: email } });
    let codeSent = false;

    if (user) {
      // Generate a 4-digit verification code
      const verificationCode = Math.floor(
        1000 + Math.random() * 9000
      ).toString();
      const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

      // Store the code in resetToken field
      await prisma.user.update({
        where: { UserID: user.UserID },
        data: { resetToken: verificationCode, resetTokenExpiry },
      });

      // Send the verification code via email
      await sendResetEmail(email, verificationCode, true); // true indicates it's a code, not a link
      codeSent = true;
    }

    // Generic response to prevent email enumeration, but include codeSent for UI
    res.status(200).json({
      message: "If the email exists, a verification code has been sent",
      codeSent,
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Error processing request" });
  }
};

/**
 * Verifies the 4-digit verification code and returns a temporary token
 */
const verifyCode = async (req, res) => {
  const { code, email } = req.body;

  try {
    // Find user with valid, non-expired verification code
    const user = await prisma.user.findFirst({
      where: {
        Email: email,
        resetToken: code,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });
    }

    // Generate a temporary token for password reset (valid for 5 minutes)
    const resetToken = jwt.sign(
      { userId: user.UserID },
      process.env.JWT_SECRET,
      { expiresIn: "5m", issuer: "linkup-api" }
    );

    // Store the temporary token in Redis
    await redis.set(
      `reset_token:${user.UserID}`,
      resetToken,
      5 * 60 // 5 minutes expiry
    );

    // Clear the verification code
    await prisma.user.update({
      where: { UserID: user.UserID },
      data: { resetToken: null, resetTokenExpiry: null },
    });

    res.status(200).json({
      message: "Code verified successfully",
      resetToken,
    });
  } catch (error) {
    console.error("Code verification error:", error);
    res.status(500).json({ message: "Error verifying code" });
  }
};

/**
 * Completes password reset flow using a temporary token
 */
const resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    // Verify the temporary token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError.message);
      return res
        .status(401)
        .json({ message: "Invalid or expired reset token" });
    }

    const userId = decoded.userId;
    const storedToken = await redis.get(`reset_token:${userId}`);

    if (!storedToken || storedToken !== resetToken) {
      return res
        .status(401)
        .json({ message: "Invalid or expired reset token" });
    }

    // Validate new password
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters long" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { UserID: userId },
      data: {
        Password: hashedPassword,
      },
    });

    // Clear the temporary token from Redis
    await redis.del(`reset_token:${userId}`);

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
  refreshToken,
  verifyCode,
  resetPassword,
};
