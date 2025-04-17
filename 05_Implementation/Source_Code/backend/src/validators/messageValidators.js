const { body, param, query } = require("express-validator");
const prisma = require("../utils/prisma");

/**
 * Validation rules for getting conversations
 * Validates pagination parameters
 */
const getConversationsRules = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1-50"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be positive integer"),
];

/**
 * Validation rules for creating a one-on-one conversation
 * Validates single participant ID
 */
const createConversationRules = [
  body("participantId")
    .isInt({ min: 1 })
    .withMessage("participantId must be a positive integer")
    .custom(async (participantId, { req }) => {
      // Verify participant exists
      const user = await prisma.user.findUnique({
        where: { UserID: participantId },
      });

      if (!user) {
        throw new Error("Participant not found");
      }

      // Prevent self-conversation
      if (participantId === req.user.UserID) {
        throw new Error("Cannot create conversation with yourself");
      }

      // Check for existing conversation
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { UserID: req.user.UserID } } },
            { participants: { some: { UserID: participantId } } },
          ],
        },
      });

      if (existingConversation) {
        throw new Error("Conversation with this user already exists");
      }

      return true;
    }),
];

/**
 * Validation rules for getting messages
 * Validates conversation ID and pagination
 */
const getMessagesRules = [
  param("conversationId").isUUID().withMessage("Invalid conversation ID"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1-100"),
  query("before").optional().isISO8601().withMessage("Invalid timestamp"),
];

/**
 * Validation rules for sending a message
 * Validates content, attachments, and reply
 */
const sendMessageRules = [
  param("conversationId")
    .isUUID()
    .withMessage("Invalid conversation ID")
    .custom(async (value, { req }) => {
      const conversation = await prisma.conversation.findUnique({
        where: { id: value },
        select: { participants: { select: { UserID: true } } },
      });
      if (
        !conversation ||
        !conversation.participants.some((p) => p.UserID === req.user.UserID)
      ) {
        throw new Error("Unauthorized access to conversation");
      }
    }),

  body("content")
    .optional()
    .isString()
    .withMessage("Content must be a string")
    .isLength({ max: 2000 })
    .withMessage("Message too long")
    .trim()
    .escape(),

  body("replyToId")
    .optional()
    .isUUID()
    .withMessage("Invalid message ID")
    .custom(async (value, { req }) => {
      const message = await prisma.message.findUnique({
        where: { id: value },
      });
      if (!message || message.conversationId !== req.params.conversationId) {
        throw new Error("Invalid reply message");
      }
    }),

  body("attachment").custom((_, { req }) => {
    if (!req.file) return true; // Attachment is optional
    const allowedTypes = ["image/jpeg", "image/png", "video/mp4"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new Error("Invalid media type. Only JPEG, PNG, and MP4 allowed");
    }
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (req.file.size > maxSize) {
      throw new Error("Media file too large. Maximum size is 50MB");
    }
    return true;
  }),

  body().custom((value, { req }) => {
    const hasContent = req.body.content && req.body.content.length > 0;
    const hasAttachment = !!req.file;
    if (!hasContent && !hasAttachment) {
      throw new Error("Content or attachment required");
    }
    return true;
  }),
];

/**
 * Validation rules for adding reactions
 * Validates message ID and emoji format
 */
const addReactionRules = [
  param("messageId").isUUID().withMessage("Invalid message ID"),
  body("emoji")
    .notEmpty()
    .withMessage("Emoji required")
    .isLength({ max: 10 })
    .withMessage("Emoji too long")
    .custom((emoji) => {
      const emojiRegex =
        /^(\p{Emoji}|\p{Emoji_Modifier}|\p{Emoji_Component}|[\u2000-\u3300]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])+$/u;
      return emojiRegex.test(emoji);
    })
    .withMessage("Invalid emoji format"),
];

/**
 * Validation rules for typing indicators
 * Validates conversation ID and typing status
 */
const handleTypingRules = [
  body("conversationId").isUUID().withMessage("Invalid conversation ID"),
  body("isTyping").isBoolean().withMessage("Must be boolean"),
];

module.exports = {
  getConversationsRules,
  createConversationRules,
  getMessagesRules,
  sendMessageRules,
  addReactionRules,
  handleTypingRules,
};
