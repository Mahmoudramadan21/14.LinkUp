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
    // Get the token from the Authorization header
    const token = req.header("Authorization").replace("Bearer ", "");
    if (!token) throw new Error("No token provided");

    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user in the database with minimal fields
    const user = await prisma.user.findUnique({
      where: { UserID: decoded.userId },
      select: { UserID: true, IsPrivate: true, Role: true }, // Only select needed fields
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Attach the user to the request object for downstream use
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Please authenticate" });
  }
};

module.exports = authMiddleware;
