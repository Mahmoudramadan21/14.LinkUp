const express = require("express");
const router = express.Router();

// Import all route files
const authRoutes = require("./authRoutes");
const profileRoutes = require("./profileRoutes");
const highlightRoutes = require("./highlightRoutes");
const postsRoutes = require("./postRoutes");
const storyRoutes = require("./storyRoutes");
const messangerRoutes = require("./messagesRoutes");

// Use the routes
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/highlights", highlightRoutes);
router.use("/posts", postsRoutes);
router.use("/stories", storyRoutes);
router.use("/messanger", messangerRoutes);

// Export the router
module.exports = router;
