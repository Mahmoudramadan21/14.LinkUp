const jwt = require("jsonwebtoken");
const prisma = require("../utils/prisma");

// Middleware to authenticate requests using JWT
const authMiddleware = async (req, res, next) => {
  try {
    // Check for Authorization header
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({
        message: "Authentication token required",
        code: "MISSING_AUTH_TOKEN",
      });
    }

    // Extract token from header
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return res.status(401).json({
        message: "Invalid token format",
        code: "INVALID_TOKEN_FORMAT",
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: "linkup-api",
        maxAge: "1h",
      });
      // Explicitly check expiration
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) {
        throw new Error("Token expired");
      }
    } catch (jwtError) {
      return res.status(401).json({
        message: "Invalid or expired token",
        error: jwtError.message,
        code: "INVALID_OR_EXPIRED_TOKEN",
      });
    }

    // Find user in database
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { UserID: decoded.userId },
        select: {
          UserID: true,
          IsPrivate: true,
          Role: true,
          IsBanned: true,
        },
      });
    } catch (dbError) {
      console.error("Database error in authMiddleware:", dbError);
      return res.status(503).json({
        message: "Database connection failed",
        error: dbError.message,
        code: "DATABASE_UNAVAILABLE",
      });
    }

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Check if user is banned
    if (user.IsBanned) {
      return res.status(403).json({
        message: "This account is banned",
        code: "ACCOUNT_BANNED",
      });
    }

    // Attach user info to request
    req.user = {
      UserID: user.UserID,
      Role: user.Role,
      IsPrivate: user.IsPrivate,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      message: "Authentication error",
      error: error.message,
      code: "AUTHENTICATION_ERROR",
    });
  }
};

// Middleware for role-based authorization
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user and role exist
    if (!req.user || !req.user.Role) {
      return res.status(403).json({
        error: "Forbidden",
        message: "No sufficient permissions",
        code: "MISSING_USER_ROLE",
      });
    }

    // Normalize roles to array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Check if user role is allowed
    if (!roles.includes(req.user.Role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Insufficient permissions to access this resource",
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }

    next();
  };
};

module.exports = { authMiddleware, authorize };
