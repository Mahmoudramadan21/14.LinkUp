const express = require("express");
const router = express.Router();
const {
  createStory,
  getUserStories,
  getStoryFeed,
  deleteStory,
} = require("../controllers/storyController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const rateLimit = require("express-rate-limit");

// Rate limiting for story creation
const storyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each user to 30 story creations per window
  message: "Too many story creations, please try again later",
});

/**
 * @swagger
 * tags:
 *   name: Stories
 *   description: Story management endpoints
 */

/**
 * @swagger
 * /stories:
 *   post:
 *     summary: Create a new story
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               media:
 *                 type: string
 *                 format: binary
 *                 description: Image or video file
 *     responses:
 *       201:
 *         description: Story created successfully
 *       400:
 *         description: Media file is required
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  authMiddleware,
  storyLimiter,
  upload.single("media"),
  createStory
);

/**
 * @swagger
 * /stories/user/{userId}:
 *   get:
 *     summary: Get stories for a specific user
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user whose stories to retrieve
 *     responses:
 *       200:
 *         description: List of user's active stories
 *       403:
 *         description: Private account - cannot view stories
 *       404:
 *         description: User not found
 */
// router.get("/user/:userId", getUserStories);
router.get("/user/:userId", authMiddleware, getUserStories);

/**
 * @swagger
 * /stories/feed:
 *   get:
 *     summary: Get story feed (stories from followed users)
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of stories grouped by user
 *       401:
 *         description: Unauthorized
 */
router.get("/feed", authMiddleware, getStoryFeed);

/**
 * @swagger
 * /stories/{storyId}:
 *   delete:
 *     summary: Delete a story
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the story to delete
 *     responses:
 *       200:
 *         description: Story deleted successfully
 *       403:
 *         description: Not authorized to delete this story
 *       404:
 *         description: Story not found
 */
router.delete("/:storyId", authMiddleware, deleteStory);

module.exports = router;
