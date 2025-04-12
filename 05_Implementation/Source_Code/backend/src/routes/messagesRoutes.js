// messagesRoutes.js
const express = require("express");
const router = express.Router();
const { validate } = require("../middleware/validationMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getConversationsRules,
  createConversationRules,
  updateGroupMembersRules,
  getMessagesRules,
  sendMessageRules,
  addReactionRules,
  markAsReadRules,
  handleTypingRules,
} = require("../validators/messageValidators");
const {
  getConversations,
  createConversation,
  updateGroupMembers,
  getMessages,
  sendMessage,
  addReaction,
  markAsRead,
  handleTyping,
} = require("../controllers/messagesController");

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Real-time messaging and conversations
 */

/**
 * @swagger
 * /messanger/conversations:
 *   get:
 *     summary: Get list of user conversations
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of conversations per page
 *     responses:
 *       200:
 *         description: List of user conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "conv_123"
 *                       title:
 *                         type: string
 *                         nullable: true
 *                         example: "Group Chat"
 *                       isGroup:
 *                         type: boolean
 *                         example: false
 *                       adminId:
 *                         type: integer
 *                         nullable: true
 *                         example: 1
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       participants:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             UserID:
 *                               type: integer
 *                             Username:
 *                               type: string
 *                             ProfilePicture:
 *                               type: string
 *                               nullable: true
 *                       lastMessage:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: string
 *                           content:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           senderId:
 *                             type: integer
 *                 total:
 *                   type: integer
 *                   example: 50
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/conversations", getConversationsRules, validate, getConversations);

/**
 * @swagger
 * /messanger/conversations:
 *   post:
 *     summary: Create a new conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participantIds
 *             properties:
 *               participantIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *                 maxItems: 20
 *                 example: [2, 3]
 *               isGroup:
 *                 type: boolean
 *                 default: false
 *                 example: false
 *               title:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Friends Group"
 *                 description: Required if isGroup is true
 *     responses:
 *       201:
 *         description: Conversation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                   nullable: true
 *                 isGroup:
 *                   type: boolean
 *                 adminId:
 *                   type: integer
 *                   nullable: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 participants:
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
 *                         nullable: true
 *       400:
 *         description: Invalid participant IDs or missing title for group chat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/conversations",
  createConversationRules,
  validate,
  createConversation
);

/**
 * @swagger
 * /messanger/conversations/{conversationId}/members:
 *   patch:
 *     summary: Update group conversation members
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the conversation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               add:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [3, 4]
 *                 description: User IDs to add to the group
 *               remove:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [2]
 *                 description: User IDs to remove from the group
 *     responses:
 *       200:
 *         description: Group members updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                   nullable: true
 *                 isGroup:
 *                   type: boolean
 *                 adminId:
 *                   type: integer
 *                   nullable: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 participants:
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
 *                         nullable: true
 *       400:
 *         description: Invalid user IDs or not a group conversation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to modify this group
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Conversation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/conversations/:conversationId/members",
  updateGroupMembersRules,
  validate,
  updateGroupMembers
);

/**
 * @swagger
 * /messanger/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get messages in a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the conversation
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of messages to retrieve
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fetch messages before this timestamp
 *     responses:
 *       200:
 *         description: Conversation details with messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                   nullable: true
 *                 isGroup:
 *                   type: boolean
 *                 adminId:
 *                   type: integer
 *                   nullable: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 participants:
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
 *                         nullable: true
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       content:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       sender:
 *                         type: object
 *                         properties:
 *                           UserID:
 *                             type: integer
 *                           Username:
 *                             type: string
 *                           ProfilePicture:
 *                             type: string
 *                             nullable: true
 *                       attachments:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             url:
 *                               type: string
 *                             type:
 *                               type: string
 *                             fileName:
 *                               type: string
 *                               nullable: true
 *                             fileSize:
 *                               type: integer
 *                               nullable: true
 *                       reactions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             emoji:
 *                               type: string
 *                             userId:
 *                               type: integer
 *                       readBy:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             UserID:
 *                               type: integer
 *                       replyTo:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: string
 *                           content:
 *                             type: string
 *                           senderId:
 *                             type: integer
 *                 lastMessage:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: string
 *                     content:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     sender:
 *                       type: object
 *                       properties:
 *                         UserID:
 *                           type: integer
 *                         Username:
 *                           type: string
 *                         ProfilePicture:
 *                           type: string
 *                           nullable: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Conversation not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/conversations/:conversationId/messages",
  getMessagesRules,
  validate,
  getMessages
);

/**
 * @swagger
 * /messanger/conversations/{conversationId}/messages:
 *   post:
 *     summary: Send a message in a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the conversation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 2000
 *                 example: "Hello, how are you?"
 *                 description: Required if no attachments provided
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       format: uri
 *                       example: "https://res.cloudinary.com/duw4x8iqq/image.jpg"
 *                     type:
 *                       type: string
 *                       enum: [image, video, audio, file]
 *                       example: image
 *                     fileName:
 *                       type: string
 *                       nullable: true
 *                       example: "image.jpg"
 *                     fileSize:
 *                       type: integer
 *                       nullable: true
 *                       example: 102400
 *                 maxItems: 10
 *                 description: Optional attachments
 *               replyToId:
 *                 type: string
 *                 example: "msg_123"
 *                 description: Optional ID of message being replied to
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 content:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 sender:
 *                   type: object
 *                   properties:
 *                     UserID:
 *                       type: integer
 *                     Username:
 *                       type: string
 *                     ProfilePicture:
 *                       type: string
 *                       nullable: true
 *                 attachments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       url:
 *                         type: string
 *                       type:
 *                         type: string
 *                       fileName:
 *                         type: string
 *                         nullable: true
 *                       fileSize:
 *                         type: integer
 *                         nullable: true
 *                 replyTo:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: string
 *                     content:
 *                       type: string
 *                     senderId:
 *                       type: integer
 *       400:
 *         description: Invalid message content, attachments, or replyToId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Conversation not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/conversations/:conversationId/messages",
  sendMessageRules,
  validate,
  sendMessage
);

/**
 * @swagger
 * /messanger/messages/{messageId}/reactions:
 *   post:
 *     summary: Add a reaction to a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the message
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emoji
 *             properties:
 *               emoji:
 *                 type: string
 *                 maxLength: 10
 *                 example: "👍"
 *     responses:
 *       201:
 *         description: Reaction added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messageId:
 *                   type: string
 *                 emoji:
 *                   type: string
 *       400:
 *         description: Invalid emoji or reaction already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Message not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/messages/:messageId/reactions",
  addReactionRules,
  validate,
  addReaction
);

/**
 * @swagger
 * /messanger/messages/mark-read:
 *   post:
 *     summary: Mark messages as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageIds
 *             properties:
 *               messageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 example: ["msg_123", "msg_124"]
 *     responses:
 *       200:
 *         description: Messages marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 updatedCount:
 *                   type: integer
 *                   example: 2
 *       400:
 *         description: Invalid message IDs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/messages/mark-read", markAsReadRules, validate, markAsRead);

/**
 * @swagger
 * /messanger/conversations/typing:
 *   post:
 *     summary: Notify typing status in a conversation (HTTP fallback)
 *     tags: [Messages]
 *     description: Stores typing status in Redis. For real-time typing indicators, use Socket.IO 'typing' event instead.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *             properties:
 *               conversationId:
 *                 type: string
 *                 example: "conv_123"
 *               isTyping:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *     responses:
 *       200:
 *         description: Typing status stored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid conversation ID or isTyping value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Conversation not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/conversations/typing", handleTypingRules, validate, handleTyping);

module.exports = router;
