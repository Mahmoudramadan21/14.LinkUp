const express = require("express");
const router = express.Router();

// Import all route files
const authRoutes = require("./authRoutes");
const profileRoutes = require("./profileRoutes");

// Use the routes
router.use("/auth", authRoutes); // Mount auth routes under /auth
router.use("/profile", profileRoutes); // Mount profile routes under /profile

// Export the router
module.exports = router;
