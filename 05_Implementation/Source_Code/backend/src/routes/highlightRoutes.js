const {
  createHighlight,
  getUserHighlights,
  getHighlightDetails,
  updateHighlight,
  deleteHighlight,
} = require("../controllers/highlightController");
const authMiddleware = require("../middleware/authMiddleware");
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
 * /highlights:
 *   post:
 *     summary: Create a new highlight
 *     tags: [Highlights]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
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
 *                 format: uri
 *                 example: "https://example.com/cover.jpg"
 *               storyIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *                 maxItems: 20
 *                 example: [1, 2, 3]
 *     responses:
 *       201:
 *         description: Highlight created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Highlight'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Unauthorized story access
 *       500:
 *         description: Highlight creation failed
 */
router.post("/", authMiddleware, validateHighlightInput, createHighlight);

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
 *         description: List of user highlights
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   HighlightID:
 *                     type: integer
 *                   Title:
 *                     type: string
 *                   CoverImage:
 *                     type: string
 *                   _count:
 *                     type: object
 *                     properties:
 *                       Stories:
 *                         type: integer
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
 *               type: object
 *               properties:
 *                 HighlightID:
 *                   type: integer
 *                 Title:
 *                   type: string
 *                 CoverImage:
 *                   type: string
 *                 UserID:
 *                   type: integer
 *                 Stories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       StoryID:
 *                         type: integer
 *                       MediaURL:
 *                         type: string
 *                 User:
 *                   type: object
 *                   properties:
 *                     IsPrivate:
 *                       type: boolean
 *                     UserID:
 *                       type: integer
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
 *       required: true
 *       content:
 *         application/json:
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
 *                 format: uri
 *                 example: "https://example.com/new-cover.jpg"
 *               storyIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *                 maxItems: 20
 *                 example: [1, 4, 5]
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
