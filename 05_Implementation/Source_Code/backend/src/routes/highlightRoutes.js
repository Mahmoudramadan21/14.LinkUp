const {
  createHighlight,
  getUserHighlights,
  getHighlightDetails,
  getHighlightStories,
  updateHighlight,
  deleteHighlight,
} = require("../controllers/highlightController");
const { authMiddleware } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  validateHighlightInput,
  validateHighlightUpdate,
} = require("../validators/highlightValidators");
const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Highlights
 *   description: Story highlights management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Highlight:
 *       type: object
 *       properties:
 *         HighlightID:
 *           type: integer
 *         Title:
 *           type: string
 *         CoverImage:
 *           type: string
 *         UserID:
 *           type: integer
 *         StoryHighlights:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               StoryID:
 *                 type: integer
 *               HighlightID:
 *                 type: integer
 *               AssignedAt:
 *                 type: string
 *                 format: date-time
 *         CreatedAt:
 *           type: string
 *           format: date-time
 *         UpdatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /highlights:
 *   post:
 *     summary: Create a new highlight
 *     tags: [Highlights]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - coverImage
 *               - storyIds
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "Summer Vacation"
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Cover image file to upload (JPEG, PNG, WebP)
 *               storyIds:
 *                 type: string
 *                 example: "1,2,3"
 *                 description: Comma-separated story IDs or array
 *     responses:
 *       201:
 *         description: Highlight created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Highlight'
 *       400:
 *         description: Validation error or invalid file type
 *       403:
 *         description: Unauthorized story access
 *       500:
 *         description: Highlight creation failed
 */
router.post(
  "/",
  authMiddleware,
  upload.fields([{ name: "coverImage", maxCount: 1 }]),
  validateHighlightInput,
  createHighlight
);

/**
 * @swagger
 * /highlights/user/{userId}:
 *   get:
 *     summary: Get all highlights for a user
 *     tags: [Highlights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user whose highlights to retrieve
 *     responses:
 *       200:
 *         description: List of user highlights with stories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   highlightId:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   coverImage:
 *                     type: string
 *                   storyCount:
 *                     type: integer
 *                   stories:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         storyId:
 *                           type: integer
 *                         mediaUrl:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *                         assignedAt:
 *                           type: string
 *                           format: date-time
 *       403:
 *         description: Private account - cannot view highlights
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to fetch highlights
 */
router.get("/user/:userId", authMiddleware, getUserHighlights);

/**
 * @swagger
 * /highlights/{highlightId}:
 *   get:
 *     summary: Get highlight details
 *     tags: [Highlights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: highlightId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the highlight to retrieve
 *     responses:
 *       200:
 *         description: Highlight details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Highlight'
 *       400:
 *         description: Invalid highlight ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Private account - Follow to view
 *       404:
 *         description: Highlight not found
 *       500:
 *         description: Internal server error
 */
router.get("/:highlightId", authMiddleware, getHighlightDetails);

/**
 * @swagger
 * /highlights/{highlightId}/stories:
 *   get:
 *     summary: Get stories in a highlight
 *     tags: [Highlights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: highlightId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the highlight to retrieve stories from
 *     responses:
 *       200:
 *         description: Stories in the highlight
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 highlightId:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 coverImage:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     isPrivate:
 *                       type: boolean
 *                 stories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       storyId:
 *                         type: integer
 *                       mediaUrl:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                       assignedAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Invalid highlight ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Private account - Follow to view
 *       404:
 *         description: Highlight not found
 *       500:
 *         description: Failed to fetch highlight stories
 */
router.get("/:highlightId/stories", authMiddleware, getHighlightStories);

/**
 * @swagger
 * /highlights/{highlightId}:
 *   put:
 *     summary: Update a highlight
 *     tags: [Highlights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: highlightId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the highlight to update
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "Updated Vacation"
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Cover image file to upload (JPEG, PNG, WebP)
 *               storyIds:
 *                 type: string
 *                 example: "1,4,5"
 *                 description: Comma-separated story IDs or array
 *     responses:
 *       200:
 *         description: Highlight updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Highlight'
 *       400:
 *         description: No valid fields to update or validation error
 *       403:
 *         description: Invalid stories provided
 *       404:
 *         description: Highlight not found
 *       500:
 *         description: Failed to update highlight
 */
router.put(
  "/:highlightId",
  authMiddleware,
  upload.fields([{ name: "coverImage", maxCount: 1 }]),
  validateHighlightUpdate,
  updateHighlight
);

/**
 * @swagger
 * /highlights/{highlightId}:
 *   delete:
 *     summary: Delete a highlight
 *     tags: [Highlights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: highlightId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the highlight to delete
 *     responses:
 *       200:
 *         description: Highlight deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deletedId:
 *                   type: integer
 *       403:
 *         description: You don't own this highlight
 *       404:
 *         description: Highlight not found
 *       500:
 *         description: Deletion failed
 */
router.delete("/:highlightId", authMiddleware, deleteHighlight);

module.exports = router;
