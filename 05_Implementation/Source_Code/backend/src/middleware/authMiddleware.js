// authMiddleware.js
const jwt = require("jsonwebtoken");
const prisma = require("../utils/prisma");

/**
 * Authenticates requests by verifying JWT and attaching user to req
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "No Authorization header provided" });
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "linkup-api",
      maxAge: "1h",
    });
    console.log("Decoded token:", decoded);

    const user = await prisma.user.findUnique({
      where: { UserID: decoded.userId },
      select: { UserID: true, IsPrivate: true, Role: true },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = { UserID: decoded.userId };
    console.log("req.user set to:", req.user);
    next();
  } catch (error) {
    console.error("authMiddleware error:", error.message);
    return res
      .status(401)
      .json({ message: "Please authenticate", error: error.message });
  }
};

module.exports = authMiddleware;
