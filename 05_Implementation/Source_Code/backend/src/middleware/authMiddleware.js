const jwt = require("jsonwebtoken");
const prisma = require("../utils/prisma");

// Middleware to authenticate requests using JWT
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Find user in database
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { UserID: decoded.userId },
        select: { UserID: true, IsBanned: true },
      });
    } catch (dbError) {
      console.error("Database connection error in authMiddleware:", dbError);
      return res.status(503).json({
        message: "Database connection failed",
        error: dbError.message,
        code: "DATABASE_UNAVAILABLE",
      });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.IsBanned) {
      return res.status(403).json({ error: "User is banned" });
    }

    req.user = { UserID: user.UserID };
    next();
  } catch (error) {
    console.error("authMiddleware error:", error);
    res.status(401).json({ error: "Authentication failed" });
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
