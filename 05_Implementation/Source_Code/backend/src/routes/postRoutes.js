const express = require("express");
const router = express.Router();
const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  addComment,
  likeComment,
  replyToComment,
  savePost,
  reportPost,
} = require("../controllers/postController");
const {
  postCreationRules,
  postUpdateRules,
  reportPostRules,
  commentLikeRules,
  commentReplyRules,
} = require("../validators/postValidators");
const { validate } = require("../middleware/validationMiddleware");
const { authMiddleware } = require("../middleware/authMiddleware");
const checkPostOwnership = require("../middleware/postOwnershipMiddleware");
const upload = require("../middleware/uploadMiddleware");
const rateLimit = require("express-rate-limit");
const { moderateContent } = require("../middleware/moderationMiddleware");

// Rate limiting configuration
const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: "Too many requests from this IP, please try again later",
  skip: (req) => req.user?.Role === "ADMIN", // Skip rate limiting for admins
});

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post management endpoints
 */

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Post content
 *               media:
 *                 type: string
 *                 format: binary
 *                 description: Image or video file
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Invalid input or content violation
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  authMiddleware,
  postLimiter,
  upload.single("media"),
  postCreationRules,
  validate,
  moderateContent,
  createPost
);

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all public posts (paginated)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of posts
 *       401:
 *         description: Unauthorized
 */
router.get("/", authMiddleware, getPosts);

/**
 * @swagger
 * /posts/{postId}:
 *   get:
 *     summary: Get a specific post by ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the post to retrieve
 *     responses:
 *       200:
 *         description: Post details
 *       403:
 *         description: Access to private post denied
 *       404:
 *         description: Post not found
 */
router.get("/:postId", authMiddleware, getPostById);

/**
 * @swagger
 * /posts/{postId}:
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the post to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Not authorized to update this post
 *       404:
 *         description: Post not found
 */
router.put(
  "/:postId",
  authMiddleware,
  checkPostOwnership,
  postUpdateRules,
  validate,
  moderateContent,
  updatePost
);

/**
 * @swagger
 * /posts/{postId}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the post to delete
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       403:
 *         description: Not authorized to delete this post
 *       404:
 *         description: Post not found
 */
router.delete("/:postId", authMiddleware, checkPostOwnership, deletePost);

/**
 * @swagger
 * /posts/{postId}/like:
 *   post:
 *     summary: Like or unlike a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the post to like/unlike
 *     responses:
 *       200:
 *         description: Like status toggled successfully
 *       404:
 *         description: Post not found
 */
router.post("/:postId/like", authMiddleware, postLimiter, likePost);

/**
 * @swagger
 * /posts/{postId}/comment:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the post to comment on
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Invalid input or content violation
 *       404:
 *         description: Post not found
 */
router.post(
  "/:postId/comment",
  authMiddleware,
  postLimiter,
  postCreationRules,
  validate,
  moderateContent,
  addComment
);

/**
 * @swagger
 * /posts/comments/{commentId}/like:
 *   post:
 *     summary: Like or unlike a comment
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the comment to like/unlike
 *     responses:
 *       200:
 *         description: Like status toggled successfully
 *       404:
 *         description: Comment not found
 *       403:
 *         description: Access to private post denied
 */
router.post(
  "/comments/:commentId/like",
  authMiddleware,
  postLimiter,
  commentLikeRules,
  validate,
  likeComment
);

/**
 * @swagger
 * /posts/comments/{commentId}/reply:
 *   post:
 *     summary: Reply to a comment
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the comment to reply to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Reply content
 *     responses:
 *       201:
 *         description: Reply added successfully
 *       400:
 *         description: Invalid input or content violation
 *       404:
 *         description: Comment not found
 *       403:
 *         description: Access to private post denied
 */
router.post(
  "/comments/:commentId/reply",
  authMiddleware,
  postLimiter,
  commentReplyRules,
  validate,
  moderateContent,
  replyToComment
);

/**
 * @swagger
 * /posts/{postId}/save:
 *   post:
 *     summary: Save or unsave a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the post to save/unsave
 *     responses:
 *       200:
 *         description: Save status toggled successfully
 *       404:
 *         description: Post not found
 */
router.post("/:postId/save", authMiddleware, savePost);

/**
 * @swagger
 * /posts/{postId}/report:
 *   post:
 *     summary: Report a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: SPAM
 *     responses:
 *       201:
 *         description: Post reported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 reportId:
 *                   type: integer
 *       400:
 *         description: Invalid input or duplicate report
 *       403:
 *         description: No access to private account
 *       404:
 *         description: Post not found
 */
router.post(
  "/:postId/report",
  authMiddleware,
  reportPostRules,
  validate,
  reportPost
);

module.exports = router;
