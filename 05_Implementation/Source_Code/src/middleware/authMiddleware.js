const jwt = require("jsonwebtoken");
const prisma = require("../utils/prisma");

// Middleware to authenticate users using JWT
const authMiddleware = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const token = req.header("Authorization").replace("Bearer ", "");
    if (!token) throw new Error("No token provided");

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { UserID: decoded.userId },
      select: { UserID: true, IsPrivate: true, Role: true }, // Only select needed fields
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Attach the user to the request object
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Please authenticate" });
  }
};

module.exports = authMiddleware;
