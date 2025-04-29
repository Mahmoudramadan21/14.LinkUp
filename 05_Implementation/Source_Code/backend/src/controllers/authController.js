const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const prisma = require("../utils/prisma");
const redis = require("../utils/redis");
const { sendResetEmail } = require("../services/emailService");
const { register, login: serviceLogin } = require("../services/authService");
const { v4: uuidv4 } = require("uuid");

const SALT_ROUNDS = 10; // Define salt rounds

// Encryption key (same as used in authService.js)
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "your-32-char-long-secret-key-here";
const IV_LENGTH = 16;

// Fixed cookie name for sessionId (obfuscated but constant)
const SESSION_COOKIE_NAME = "qkz7m4p8v2";

/**
 * Encrypts the given text using AES-256-CBC
 * @param {string} text - The text to encrypt
 * @returns {string} The encrypted text with IV
 */
const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

/**
 * Decrypts the given encrypted text using AES-256-CBC
 * @param {string} text - The encrypted text with IV
 * @returns {string} The decrypted text
 */
const decrypt = (text) => {
  const [iv, encryptedText] = text
    .split(":")
    .map((part) => Buffer.from(part, "hex"));
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

/**
 * Generates a random string in UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
 * @returns {string} Random string in UUID format
 */
const generateRandomString = () => {
  const chars = "0123456789abcdef";
  const segments = [8, 4, 4, 4, 12]; // UUID segment lengths
  const randomSegment = (length) =>
    Array.from({ length }, () => chars[Math.floor(Math.random() * 16)]).join(
      ""
    );
  return segments.map(randomSegment).join("-");
};

/**
 * Generates a random cookie name (10 characters, lowercase letters and numbers)
 * @returns {string} Random cookie name
 */
const generateRandomCookieName = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length: 10 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
};

/**
 * Handles user registration with profileName, username, email, password, gender, and dateOfBirth
 * and sets session ID as a secure cookie with a fixed name
 */
const signup = async (req, res) => {
  console.log("Signup request received:", req.body); // Log incoming request

  const { profileName, username, email, password, gender, dateOfBirth } =
    req.body;

  try {
    // Validate input (already handled by middleware, but double-check)
    if (
      !profileName ||
      !username ||
      !email ||
      !password ||
      !gender ||
      !dateOfBirth
    ) {
      console.log("Missing required fields:", {
        profileName,
        username,
        email,
        password,
        gender,
        dateOfBirth,
      });
      return res
        .status(400)
        .json({
          message:
            "Profile name, username, email, password, gender, and date of birth are required",
        });
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

    // Register the user using authService
    console.log("Registering new user...");
    const { user: newUser } = await register({
      profileName,
      username,
      email: email.toLowerCase(),
      password,
      gender,
      dateOfBirth,
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

    // Generate a unique session ID
    const sessionId = uuidv4();

    // Generate a random cookie name for additional obfuscation
    const randomCookieName = generateRandomCookieName();

    // Encrypt the tokens before storing in Redis
    const encryptedAccessToken = encrypt(accessToken);
    const encryptedRefreshToken = encrypt(refreshToken);

    // Store encrypted tokens and the random cookie name in Redis with the session ID
    await redis.set(
      `session:${sessionId}`,
      JSON.stringify({
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        userId: newUser.UserID,
        randomCookieName: randomCookieName, // Store the random cookie name for logout
      }),
      7 * 24 * 60 * 60 // 7 days
    );

    // Set session ID as a secure cookie with the fixed name
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    // Set the sessionId in a cookie with a fixed, obfuscated name
    res.cookie(SESSION_COOKIE_NAME, sessionId, cookieOptions);

    // Also set the sessionId in a cookie with a random name for obfuscation
    res.cookie(randomCookieName, sessionId, cookieOptions);

    // Add dummy cookies for obfuscation (same format as sessionId)
    const dummyCookieNames = Array.from({ length: 5 }, () =>
      generateRandomCookieName()
    );
    dummyCookieNames.forEach((name) => {
      const dummyValue = generateRandomString(); // Generate a UUID-like string
      res.cookie(name, dummyValue, cookieOptions);
    });

    // Send response
    res.status(201).json({
      message: "User registered successfully",
      data: {
        userId: newUser.UserID,
        profileName: newUser.ProfileName,
        username: newUser.Username,
        email: newUser.Email,
        gender: newUser.Gender,
        dateOfBirth: newUser.DateOfBirth,
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
 * Authenticates user and sets session ID as a secure cookie with a fixed name
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

    const result = await serviceLogin(usernameOrEmail, password, res);
    res.json({
      message: "Login successful",
      data: {
        userId: result.user.UserID,
        username: result.user.Username,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    if (error.message.includes("Invalid credentials")) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (error.message.includes("redis.set")) {
      return res.status(503).json({ message: "Failed to store session data" });
    }
    res.status(500).json({
      message: "Authentication failed",
      error: process.env.NODE_ENV === "development" ? error.message : null,
    });
  }
};

/**
 * Refreshes access token using session ID from cookies
 */
const refreshToken = async (req, res) => {
  try {
    const sessionId = req.cookies[SESSION_COOKIE_NAME];
    console.log("Received sessionId from cookies:", sessionId);
    if (!sessionId || typeof sessionId !== "string") {
      return res
        .status(400)
        .json({ message: "Session ID required in cookies" });
    }

    // Retrieve session data from Redis
    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) {
      return res.status(401).json({ message: "Invalid session" });
    }

    const { refreshToken: encryptedRefreshToken, userId } =
      JSON.parse(sessionData);
    const refreshToken = decrypt(encryptedRefreshToken);

    // Verify the refresh token
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
        .json({ message: "Invalid or expired refresh token" });
    }

    if (!decoded.userId) {
      return res.status(400).json({ message: "Invalid token payload" });
    }

    // Fetch user
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { UserID: userId },
        select: { UserID: true, Username: true, IsBanned: true },
      });
    } catch (dbError) {
      console.error("Database error in refreshToken:", dbError.message);
      return res.status(503).json({ message: "Database connection failed" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.IsBanned) {
      return res.status(403).json({ message: "User is banned" });
    }

    // Generate new tokens (rotate refresh token)
    const newAccessToken = jwt.sign(
      { userId: user.UserID },
      process.env.JWT_SECRET,
      { expiresIn: "15m", issuer: "linkup-api" }
    );
    const newRefreshToken = jwt.sign(
      { userId: user.UserID },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d", issuer: "linkup-api" }
    );

    // Encrypt the new tokens
    const newEncryptedAccessToken = encrypt(newAccessToken);
    const newEncryptedRefreshToken = encrypt(newRefreshToken);

    // Update Redis with the new tokens
    await redis.set(
      `session:${sessionId}`,
      JSON.stringify({
        accessToken: newEncryptedAccessToken,
        refreshToken: newEncryptedRefreshToken,
        userId: user.UserID,
        randomCookieName: JSON.parse(sessionData).randomCookieName,
      }),
      7 * 24 * 60 * 60 // 7 days
    );

    res.json({
      message: "Token refreshed successfully",
      data: {},
    });
  } catch (error) {
    console.error("refreshToken error:", error.message);
    res.status(500).json({ message: "Failed to refresh token" });
  }
};

/**
 * Logs out user by clearing session ID cookie and dummy cookies, and removing session from Redis
 */
const logout = async (req, res) => {
  try {
    const sessionId = req.cookies[SESSION_COOKIE_NAME];
    if (sessionId) {
      const sessionData = await redis.get(`session:${sessionId}`);
      if (sessionData) {
        const { randomCookieName } = JSON.parse(sessionData);
        await redis.del(`session:${sessionId}`);
        console.log(`Deleted session:${sessionId} from Redis`);

        // Clear the fixed session ID cookie
        res.clearCookie(SESSION_COOKIE_NAME);

        // Clear the random cookie that also contains the sessionId
        if (randomCookieName) {
          res.clearCookie(randomCookieName);
        }

        // Clear all other cookies (since all other cookie names are random, we assume they are dummy)
        Object.keys(req.cookies).forEach((cookieName) => {
          if (
            cookieName !== SESSION_COOKIE_NAME &&
            cookieName !== randomCookieName
          ) {
            res.clearCookie(cookieName);
          }
        });
      }
    }

    res.json({
      message: "Logged out successfully",
      data: {},
    });
  } catch (error) {
    console.error("Logout error:", error.message);
    res.status(500).json({ message: "Logout failed" });
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
  refreshToken,
  logout,
  forgotPassword,
  verifyCode,
  resetPassword,
};
