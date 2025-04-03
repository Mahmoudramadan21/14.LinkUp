const express = require("express");
const router = express.Router();

// Import all route files
const authRoutes = require("./authRoutes");
const profileRoutes = require("./profileRoutes");
const highlightRoutes = require("./highlightRoutes");
const postsRoutes = require("./postRoutes");

// Use the routes
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/highlights", highlightRoutes);
router.use("/posts", postsRoutes);

// Export the router
module.exports = router;
