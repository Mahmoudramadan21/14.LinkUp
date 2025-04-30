const jwt = require("jsonwebtoken");
const prisma = require("../utils/prisma");
const redis = require("../utils/redis");
const { handleUnauthorizedError } = require("../utils/errorHandler");
const crypto = require("crypto");

// Encryption key (same as used in authService.js)
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "your-32-char-long-secret-key-here";
const IV_LENGTH = 16;

// Fixed cookie name for sessionId (obfuscated but constant)
const SESSION_COOKIE_NAME = "qkz7m4p8v2";

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
 * Middleware to authenticate requests by finding session ID in cookies
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authMiddleware = async (req, res, next) => {
  const sessionId = req.cookies[SESSION_COOKIE_NAME];

  if (!sessionId || typeof sessionId !== "string") {
    return res
      .status(401)
      .json({ message: "Unauthorized: No session ID found" });
  }

  try {
    // Retrieve session data from Redis
    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) {
      return res.status(401).json({ message: "Unauthorized: Invalid session" });
    }

    const { accessToken: encryptedAccessToken, userId } =
      JSON.parse(sessionData);

    // Decrypt the access token
    const accessToken = decrypt(encryptedAccessToken);

    // Verify the access token
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.user = { UserID: userId };
    return next();
  } catch (error) {
    console.error("Error verifying session:", error.message);
    return res.status(401).json({ message: "Unauthorized: Invalid session" });
  }
};

/**
 * Authorizes requests based on user role, caches role in Redis to reduce database queries
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware
 */
const authorize = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.UserID;
      let role = await redis.get(`role:${userId}`);

      // Fetch role from database if not cached
      if (!role) {
        const user = await prisma.user.findUnique({
          where: { UserID: userId },
          select: { Role: true },
        });

        if (!user) {
          return handleUnauthorizedError(res, "User not found");
        }

        role = user.Role;
        // Cache role for 1 hour
        await redis.set(`role:${userId}`, role, "EX", 3600);
      }

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      next();
    } catch (error) {
      handleUnauthorizedError(res, "Authorization failed");
    }
  };
};

module.exports = { authMiddleware, authorize };
