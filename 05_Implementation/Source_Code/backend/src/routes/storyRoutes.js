const express = require("express");
const router = express.Router();
const {
  createStory,
  getUserStories,
  getStoryFeed,
  deleteStory,
  getStoryById,
  toggleStoryLike,
  getStoryViews,
} = require("../controllers/storyController");
const { authMiddleware } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const rateLimit = require("express-rate-limit");

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
 *     summary: Get story IDs for a specific user
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user whose stories to retrieve
 *     responses:
 *       200:
 *         description: List of story IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: integer
 *       403:
 *         description: Private account - cannot view stories
 *       404:
 *         description: User not found
 */
router.get("/user/:userId", authMiddleware, getUserStories);

/**
 * @swagger
 * /stories/{storyId}/views:
 *   get:
 *     summary: Get analytics for a specific story
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the story to get views for
 *     responses:
 *       200:
 *         description: Story view and like analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalViews:
 *                   type: integer
 *                 views:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       User:
 *                         type: object
 *                         properties:
 *                           UserID:
 *                             type: integer
 *                           Username:
 *                             type: string
 *                           ProfilePicture:
 *                             type: string
 *                       ViewedAt:
 *                         type: string
 *                         format: date-time
 *                 totalLikes:
 *                   type: integer
 *                 likedBy:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       UserID:
 *                         type: integer
 *                       Username:
 *                         type: string
 *                       ProfilePicture:
 *                         type: string
 *       403:
 *         description: Not authorized to view analytics
 *       404:
 *         description: Story not found
 */
router.get("/:storyId/views", authMiddleware, getStoryViews);

/**
 * @swagger
 * /stories/feed:
 *   get:
 *     summary: Get user IDs with active stories from followed users
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user IDs with view status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: integer
 *                   hasUnviewedStories:
 *                     type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get("/feed", authMiddleware, getStoryFeed);

/**
 * @swagger
 * /stories/{storyId}:
 *   get:
 *     summary: Get a specific story by ID
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the story to retrieve
 *     responses:
 *       200:
 *         description: Story details (owners can access expired stories)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 StoryID:
 *                   type: integer
 *                 MediaURL:
 *                   type: string
 *                 CreatedAt:
 *                   type: string
 *                   format: date-time
 *                 ExpiresAt:
 *                   type: string
 *                   format: date-time
 *                 User:
 *                   type: object
 *                   properties:
 *                     UserID:
 *                       type: integer
 *                     Username:
 *                       type: string
 *                     ProfilePicture:
 *                       type: string
 *                     IsPrivate:
 *                       type: boolean
 *                 _count:
 *                   type: object
 *                   properties:
 *                     StoryLikes:
 *                       type: integer
 *                     StoryViews:
 *                       type: integer
 *                 hasLiked:
 *                   type: boolean
 *       403:
 *         description: Private account - cannot view story
 *       404:
 *         description: Story not found or has expired (for non-owners)
 */
router.get("/:storyId", authMiddleware, getStoryById);

/**
 * @swagger
 * /stories/{storyId}/like:
 *   post:
 *     summary: Toggle like on a story
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the story to like/unlike
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 action:
 *                   type: string
 *                   enum: [liked, unliked]
 *       400:
 *         description: Story has expired
 *       403:
 *         description: Not authorized to like this story
 *       404:
 *         description: Story not found
 */
router.post("/:storyId/like", authMiddleware, toggleStoryLike);

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
