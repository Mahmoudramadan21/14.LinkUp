const express = require("express");
const router = express.Router();
const authRoutes = require("./authRoutes");
const profileRoutes = require("./profileRoutes");
const postRoutes = require("./postRoutes");
const storyRoutes = require("./storyRoutes");
const messagesRoutes = require("./messagesRoutes");
const highlightRoutes = require("./highlightRoutes");
const adminRoutes = require("./adminRoutes");
const notificationRoutes = require("./notificationRoutes");

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/posts", postRoutes);
router.use("/stories", storyRoutes);
router.use("/messanger", messagesRoutes);
router.use("/highlights", highlightRoutes);
router.use("/admin", adminRoutes);
router.use("/notifications", notificationRoutes);

module.exports = router;
