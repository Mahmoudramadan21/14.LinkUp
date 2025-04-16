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
  param("conversationId").isUUID().withMessage("Invalid conversation ID"),
  body("content")
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ max: 2000 })
    .withMessage("Message too long")
    .trim(),
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
      return true;
    }),
  body("attachments")
    .optional()
    .isArray({ max: 10 })
    .withMessage("Maximum 10 attachments")
    .custom((attachments) => {
      const validTypes = ["image", "video", "audio", "file"];
      return attachments.every(
        (att) =>
          validTypes.includes(att.type) &&
          typeof att.url === "string" &&
          att.url.startsWith("https://") &&
          (att.fileName === null || typeof att.fileName === "string") &&
          (att.fileSize === null || typeof att.fileSize === "number")
      );
    })
    .withMessage("Invalid attachment format"),
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
 * Validation rules for marking messages as read
 * Validates message IDs and access
 */
const markAsReadRules = [
  body("messageIds")
    .isArray({ min: 1 })
    .withMessage("messageIds must be a non-empty array")
    .custom(async (messageIds, { req }) => {
      // Ensure no duplicate IDs
      if (new Set(messageIds).size !== messageIds.length) {
        throw new Error("Duplicate message IDs");
      }

      // Verify messages exist and user is a participant
      const validMessages = await prisma.message.findMany({
        where: {
          id: { in: messageIds },
          conversation: {
            participants: {
              some: { UserID: req.user.UserID },
            },
          },
        },
        select: { id: true },
      });

      if (validMessages.length !== messageIds.length) {
        throw new Error("One or more message IDs are invalid or inaccessible");
      }

      return true;
    }),
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
  markAsReadRules,
  handleTypingRules,
};
