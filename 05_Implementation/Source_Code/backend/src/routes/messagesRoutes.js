const express = require("express");
const router = express.Router();
const { validate } = require("../middleware/validationMiddleware");
const { authMiddleware } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  getConversationsRules,
  createConversationRules,
  getMessagesRules,
  sendMessageRules,
  addReactionRules,
  handleTypingRules,
} = require("../validators/messageValidators");
const {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  addReaction,
  handleTyping,
  getActiveFollowing,
  getSuggestedChatUsers,
} = require("../controllers/messagesController");

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Real-time one-on-one messaging
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
 *                       conversationId:
 *                         type: string
 *                         example: "conv_123"
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
 *                       unreadCount:
 *                         type: integer
 *                         example: 2
 *                       otherParticipant:
 *                         type: object
 *                         properties:
 *                           UserID:
 *                             type: integer
 *                           Username:
 *                             type: string
 *                           ProfilePicture:
 *                             type: string
 *                             nullable: true
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
 *     summary: Create a new one-on-one conversation
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
 *               - participantId
 *             properties:
 *               participantId:
 *                 type: integer
 *                 example: 2
 *                 description: ID of the other user to start a conversation with
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
 *         description: Invalid participant ID or conversation already exists
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
 *                 otherParticipant:
 *                   type: object
 *                   properties:
 *                     UserID:
 *                       type: integer
 *                     Username:
 *                       type: string
 *                     ProfilePicture:
 *                       type: string
 *                       nullable: true
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
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 totalMessages:
 *                   type: integer
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 2000
 *                 example: "Hello, how are you?"
 *                 description: Message content, required if no attachment is provided
 *               attachment:
 *                 type: string
 *                 format: binary
 *                 description: Optional file attachment (image, video, audio, or other file)
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
 *         description: Invalid message content, attachment, or replyToId
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
  upload.single("attachment"),
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

/**
 * @swagger
 * /messanger/active-following:
 *   get:
 *     summary: Get active users the current user follows
 *     tags: [Messages]
 *     description: Returns users followed by the current user who were active in the last 5 minutes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active followed users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activeFollowing:
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
 *                       lastActive:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: integer
 *                   example: 2
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/active-following", validate, getActiveFollowing);

/**
 * @swagger
 * /messanger/suggested-chat-users:
 *   get:
 *     summary: Get suggested users to start a chat with
 *     tags: [Messages]
 *     description: Returns users followed by the current user with no existing conversations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of suggested users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestedUsers:
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
 *                 count:
 *                   type: integer
 *                   example: 3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/suggested-chat-users", validate, getSuggestedChatUsers);

module.exports = router;
