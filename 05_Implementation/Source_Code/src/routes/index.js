const express = require("express");
const router = express.Router();

// Import all route files
const authRoutes = require("./authRoutes");
const profileRoutes = require("./profileRoutes");
const highlightRoutes = require("./highlightRoutes");

// Use the routes
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/highlights", highlightRoutes);

// Export the router
module.exports = router;
