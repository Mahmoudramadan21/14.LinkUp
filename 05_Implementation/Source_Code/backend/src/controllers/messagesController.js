const prisma = require("../utils/prisma");
const redis = require("../utils/redis");
const { handleServerError } = require("../utils/errorHandler");

/**
 * Fetches user conversations with pagination
 * Returns conversation IDs, last message, unread count, and other participant's profile picture
 */
const getConversations = async (req, res) => {
  const { UserID } = req.user;
  const { page = 1, limit = 10 } = req.query;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch conversations with participants and last message
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { UserID },
        },
      },
      skip,
      take: parseInt(limit),
      orderBy: { updatedAt: "desc" },
      include: {
        participants: {
          select: {
            UserID: true,
            Username: true,
            ProfilePicture: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
    });

    // Count total conversations for pagination
    const total = await prisma.conversation.count({
      where: {
        participants: {
          some: { UserID },
        },
      },
    });

    // Format response with unread count and other participant's profile picture
    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Get other participant's profile picture
        const otherParticipant = conv.participants.find(
          (p) => p.UserID !== UserID
        );

        // Count unread messages (not sent by user, not read by user)
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: UserID },
            readBy: {
              none: { UserID },
            },
          },
        });

        return {
          conversationId: conv.id,
          lastMessage: conv.messages[0] || null,
          unreadCount,
          otherParticipant: otherParticipant
            ? {
                UserID: otherParticipant.UserID,
                Username: otherParticipant.Username,
                ProfilePicture: otherParticipant.ProfilePicture,
              }
            : null,
        };
      })
    );

    res.json({
      conversations: formattedConversations,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    handleServerError(res, error, "Failed to fetch conversations");
  }
};

/**
 * Creates a new one-on-one conversation with one participant
 * Invalidates conversation cache
 */
const createConversation = async (req, res) => {
  const { UserID } = req.user;
  const { participantId } = req.body;

  try {
    // Validate single participant
    if (!participantId || Array.isArray(participantId)) {
      return res
        .status(400)
        .json({ error: "Exactly one participant ID is required" });
    }

    // Verify participant exists
    const user = await prisma.user.findUnique({
      where: { UserID: participantId },
      select: { UserID: true },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid participant ID" });
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { UserID } } },
          { participants: { some: { UserID: participantId } } },
        ],
      },
      include: { participants: { select: { UserID: true } } },
    });

    if (existingConversation) {
      return res
        .status(400)
        .json({ error: "Conversation with this user already exists" });
    }

    // Create conversation with exactly two participants
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          connect: [{ UserID }, { UserID: participantId }],
        },
      },
      include: {
        participants: {
          select: {
            UserID: true,
            Username: true,
            ProfilePicture: true,
          },
        },
      },
    });

    // Invalidate conversation cache for participants
    await redis.del(`conversations:${UserID}`);
    await redis.del(`conversations:${participantId}`);

    res.status(201).json(conversation);
  } catch (error) {
    handleServerError(res, error, "Failed to create conversation");
  }
};

/**
 * Fetches conversation messages with details
 * Returns 404 for unauthorized access
 */
const getMessages = async (req, res) => {
  const { UserID } = req.user;
  const { conversationId } = req.params;
  const { limit = 20, before } = req.query;

  try {
    // Fetch conversation with messages and participants
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          select: {
            UserID: true,
            Username: true,
            ProfilePicture: true,
          },
        },
        messages: {
          where: before ? { createdAt: { lt: new Date(before) } } : undefined,
          take: parseInt(limit),
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: {
              select: {
                UserID: true,
                Username: true,
                ProfilePicture: true,
              },
            },
            attachments: {
              select: {
                id: true,
                url: true,
                type: true,
                fileName: true,
                fileSize: true,
              },
            },
            reactions: {
              select: {
                id: true,
                emoji: true,
                userId: true,
              },
            },
            readBy: {
              select: { UserID: true },
            },
            replyTo: {
              select: { id: true, content: true, senderId: true },
            },
          },
        },
      },
    });

    if (
      !conversation ||
      !conversation.participants.some((p) => p.UserID === UserID)
    ) {
      return res
        .status(404)
        .json({ error: "Conversation not found or access denied" });
    }

    // Count total messages for pagination
    const totalMessages = await prisma.message.count({
      where: {
        conversationId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
    });

    // Format response with message details
    const otherParticipant = conversation.participants.find(
      (p) => p.UserID !== UserID
    );

    const response = {
      id: conversation.id,
      otherParticipant: otherParticipant
        ? {
            UserID: otherParticipant.UserID,
            Username: otherParticipant.Username,
            ProfilePicture: otherParticipant.ProfilePicture,
          }
        : null,
      messages: conversation.messages.reverse(),
      lastMessage: conversation.messages[0] || null,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };

    res.json(response);
  } catch (error) {
    handleServerError(res, error, "Failed to fetch conversation");
  }
};

/**
 * Sends a message in a conversation
 * Supports attachments and replies
 */
const sendMessage = async (req, res) => {
  const { UserID } = req.user;
  const { conversationId } = req.params;
  const { content, attachments, replyToId } = req.body;

  try {
    // Verify conversation access
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, participants: { select: { UserID: true } } },
    });

    if (
      !conversation ||
      !conversation.participants.some((p) => p.UserID === UserID)
    ) {
      return res
        .status(404)
        .json({ error: "Conversation not found or access denied" });
    }

    // Validate reply message if provided
    let replyTo = null;
    if (replyToId) {
      replyTo = await prisma.message.findUnique({
        where: { id: replyToId, conversationId },
        select: { id: true },
      });
      if (!replyTo) {
        return res.status(400).json({ error: "Invalid replyTo message ID" });
      }
    }

    // Create message with attachments
    const message = await prisma.message.create({
      data: {
        content,
        senderId: UserID,
        conversationId,
        replyToId: replyTo?.id,
        attachments: attachments
          ? {
              create: attachments.map((att) => ({
                url: att.url,
                type: att.type,
                fileName: att.fileName,
                fileSize: att.fileSize,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: {
          select: {
            UserID: true,
            Username: true,
            ProfilePicture: true,
          },
        },
        attachments: {
          select: {
            id: true,
            url: true,
            type: true,
            fileName: true,
            fileSize: true,
          },
        },
        replyTo: {
          select: { id: true, content: true, senderId: true },
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Invalidate cache for participants
    const participantIds = conversation.participants.map((p) => p.UserID);
    for (const id of participantIds) {
      await redis.del(`conversations:${id}`);
    }

    res.status(201).json(message);
  } catch (error) {
    handleServerError(res, error, "Failed to send message");
  }
};

/**
 * Adds a reaction to a message
 * Prevents duplicate reactions
 */
const addReaction = async (req, res) => {
  const { UserID } = req.user;
  const { messageId } = req.params;
  const { emoji } = req.body;

  try {
    // Verify message and conversation access
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        conversation: {
          select: {
            id: true,
            participants: { select: { UserID: true } },
          },
        },
      },
    });

    if (
      !message ||
      !message.conversation.participants.some((p) => p.UserID === UserID)
    ) {
      return res
        .status(404)
        .json({ error: "Message not found or access denied" });
    }

    // Check for existing reaction
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId: UserID,
        },
      },
    });

    if (existingReaction) {
      return res.status(400).json({ error: "Reaction already exists" });
    }

    // Create reaction
    const reaction = await prisma.reaction.create({
      data: {
        emoji,
        userId: UserID,
        messageId,
      },
      select: {
        id: true,
        emoji: true,
        userId: true,
        messageId: true,
      },
    });

    // Invalidate cache for participants
    const participantIds = message.conversation.participants.map(
      (p) => p.UserID
    );
    for (const id of participantIds) {
      await redis.del(`conversations:${id}`);
    }

    res.status(201).json({ messageId, emoji: reaction.emoji });
  } catch (error) {
    handleServerError(res, error, "Failed to add reaction");
  }
};

/**
 * Marks messages as read
 * Updates read status for valid messages
 */
const markAsRead = async (req, res) => {
  const { UserID } = req.user;
  const { messageIds } = req.body;

  try {
    // Verify messages and conversation access
    const messages = await prisma.message.findMany({
      where: {
        id: { in: messageIds },
        conversation: {
          participants: {
            some: { UserID },
          },
        },
      },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        readBy: { select: { UserID: true } },
      },
    });

    if (messages.length !== messageIds.length) {
      return res.status(400).json({ error: "Invalid message IDs" });
    }

    // Filter messages to update
    const messagesToUpdate = messages.filter(
      (msg) =>
        msg.senderId !== UserID &&
        !msg.readBy.some((reader) => reader.UserID === UserID)
    );

    // Update read status in transaction
    if (messagesToUpdate.length > 0) {
      await prisma.$transaction(
        messagesToUpdate.map((msg) =>
          prisma.message.update({
            where: { id: msg.id },
            data: {
              readBy: {
                connect: { UserID },
              },
              readAt: new Date(),
            },
          })
        )
      );
    }

    // Invalidate cache for affected conversations
    const conversationIds = [...new Set(messages.map((m) => m.conversationId))];
    for (const convId of conversationIds) {
      const participants = await prisma.conversation.findUnique({
        where: { id: convId },
        select: { participants: { select: { UserID: true } } },
      });
      for (const { UserID: id } of participants.participants) {
        await redis.del(`conversations:${id}`);
      }
    }

    res.json({ success: true, updatedCount: messagesToUpdate.length });
  } catch (error) {
    handleServerError(res, error, "Failed to mark messages as read");
  }
};

/**
 * Updates typing status in Redis
 * Stores status with 10-second expiry
 */
const handleTyping = async (req, res) => {
  const { UserID } = req.user;
  const { conversationId, isTyping = true } = req.body;

  try {
    // Verify conversation access
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        participants: { select: { UserID: true } },
      },
    });

    if (
      !conversation ||
      !conversation.participants.some((p) => p.UserID === UserID)
    ) {
      return res
        .status(404)
        .json({ error: "Conversation not found or access denied" });
    }

    // Update typing status in Redis
    const cacheKey = `typing:${conversationId}:${UserID}`;
    if (isTyping) {
      await redis.set(cacheKey, "true", "EX", 10);
    } else {
      await redis.del(cacheKey);
    }

    res.json({ success: true });
  } catch (error) {
    handleServerError(res, error, "Failed to handle typing status");
  }
};

module.exports = {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  addReaction,
  markAsRead,
  handleTyping,
};
