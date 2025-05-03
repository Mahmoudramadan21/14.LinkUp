const jwt = require("jsonwebtoken");
const prisma = require("../utils/prisma");
const redis = require("../utils/redis");
const { handleUnauthorizedError } = require("../utils/errorHandler");

/**
 * Verifies JWT token and attaches user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @async
 */
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return handleUnauthorizedError(res, "No token provided");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { UserID: decoded.userId },
      select: {
        UserID: true,
        Username: true,
        Role: true,
        IsBanned: true,
      },
    });

    if (!user) {
      return handleUnauthorizedError(res, "User not found");
    }

    if (user.IsBanned) {
      return handleUnauthorizedError(res, "User is banned");
    }

    req.user = user;
    next();
  } catch (error) {
    handleUnauthorizedError(res, "Authentication failed");
  }
};

/**
 * Authorizes requests based on user role
 * Caches role in Redis to reduce database queries
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
        await redis.set(`role:${userId}`, role, 3600);
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
