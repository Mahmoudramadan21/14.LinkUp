const express = require("express");
const router = express.Router();

// Import all route files
const authRoutes = require("./authRoutes");
const profileRoutes = require("./profileRoutes");
const highlightRoutes = require("./highlightRoutes");
const postsRoutes = require("./postRoutes");
const storyRoutes = require("./storyRoutes"); // Add this line

// Use the routes
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/highlights", highlightRoutes);
router.use("/posts", postsRoutes);
router.use("/stories", storyRoutes); // Add this line

// Export the router
module.exports = router;
