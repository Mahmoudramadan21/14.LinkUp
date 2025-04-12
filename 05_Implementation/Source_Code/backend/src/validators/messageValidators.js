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
 * Validation rules for creating a conversation
 * Validates participants, group settings and title
 */
const createConversationRules = [
  body("participantIds")
    .isArray({ min: 1, max: 20 })
    .withMessage("Must include 1-20 participants")
    .custom(async (participantIds, { req }) => {
      if (new Set(participantIds).size !== participantIds.length) {
        throw new Error("Duplicate participant IDs");
      }

      const usersCount = await prisma.user.count({
        where: { UserID: { in: participantIds } },
      });

      if (usersCount !== participantIds.length) {
        throw new Error("One or more participants not found");
      }
      return true;
    }),
  body("isGroup").isBoolean().withMessage("Must be boolean"),
  body("title")
    .if(body("isGroup").equals(true))
    .notEmpty()
    .withMessage("Group title is required")
    .isLength({ max: 50 })
    .withMessage("Title too long"),
];

/**
 * Validation rules for updating group members
 * Validates conversation ID and member changes
 */
const updateGroupMembersRules = [
  param("conversationId").isUUID().withMessage("Invalid conversation ID"),
  body("userIdsToAdd").optional().isArray(),
  body("userIdsToRemove").optional().isArray(),
  body().custom((_, { req }) => {
    if (!req.body.userIdsToAdd && !req.body.userIdsToRemove) {
      throw new Error("Must provide userIdsToAdd or userIdsToRemove");
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
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("before").optional().isISO8601().withMessage("Invalid timestamp"),
];

/**
 * Validation rules for sending a message
 * Validates content, attachments and reply
 */
const sendMessageRules = [
  param("conversationId").isUUID().withMessage("Invalid conversation ID"),
  body("content")
    .if(body("attachments").not().exists())
    .notEmpty()
    .withMessage("Content or attachments required")
    .isLength({ max: 2000 })
    .withMessage("Message too long"),
  body("replyToId")
    .optional()
    .isUUID()
    .withMessage("Invalid message ID")
    .custom(async (value, { req }) => {
      const message = await prisma.message.findUnique({
        where: { MessageID: value },
      });

      if (!message || message.conversationId !== req.params.conversationId) {
        throw new Error("Invalid reply message");
      }
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
          att.url.startsWith("https://")
      );
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
    }),
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
          id: {
            // Changed from MessageID to id
            in: messageIds,
          },
          conversation: {
            participants: {
              some: {
                UserID: req.user.UserID,
              },
            },
          },
        },
        select: {
          id: true, // Changed from MessageID to id
        },
      });

      // Check if all provided messageIds are valid
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
  updateGroupMembersRules,
  getMessagesRules,
  sendMessageRules,
  addReactionRules,
  markAsReadRules,
  handleTypingRules,
};
