const jwt = require("jsonwebtoken");
const prisma = require("../utils/prisma");

// Middleware to authenticate users using JWT
/**
 * Authenticates requests by verifying JWT and attaching user to req
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    if (!token) throw new Error("No token provided");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded); // Add this

    const user = await prisma.user.findUnique({
      where: { UserID: decoded.userId },
      select: { UserID: true, IsPrivate: true, Role: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    req.user = {
      UserID: decoded.userId,
    };
    console.log("req.user set to:", req.user); // Add this
    next();
  } catch (error) {
    console.error("authMiddleware error:", error);
    res.status(401).json({ message: "Please authenticate" });
  }
};

module.exports = authMiddleware;
