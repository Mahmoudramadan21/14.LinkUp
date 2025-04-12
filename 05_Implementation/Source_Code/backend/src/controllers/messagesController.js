// messagesController.js
const prisma = require("../utils/prisma");
const redis = require("../utils/redis");
const { handleServerError } = require("../utils/errorHandler");

/**
 * Gets list of user conversations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getConversations = async (req, res) => {
  const { UserID } = req.user;
  const { page = 1, limit = 10 } = req.query;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
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

    const total = await prisma.conversation.count({
      where: {
        participants: {
          some: { UserID },
        },
      },
    });

    res.json({
      conversations: conversations.map((conv) => ({
        ...conv,
        lastMessage: conv.messages[0] || null,
      })),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    handleServerError(res, error, "Failed to fetch conversations");
  }
};

/**
 * Creates a new conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createConversation = async (req, res) => {
  const { UserID } = req.user;
  const { participantIds, isGroup, title } = req.body;

  try {
    if (isGroup && !title) {
      return res
        .status(400)
        .json({ error: "Title is required for group chats" });
    }

    // Verify participants exist
    const users = await prisma.user.findMany({
      where: { UserID: { in: participantIds } },
      select: { UserID: true },
    });

    if (users.length !== participantIds.length) {
      return res.status(400).json({ error: "Invalid participant IDs" });
    }

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        isGroup: isGroup || false,
        title: isGroup ? title : null,
        adminId: isGroup ? UserID : null,
        participants: {
          connect: [
            { UserID },
            ...participantIds.map((id) => ({ UserID: id })),
          ],
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

    // Invalidate cache
    await redis.del(`conversations:${UserID}`);
    for (const id of participantIds) {
      await redis.del(`conversations:${id}`);
    }

    res.status(201).json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    handleServerError(res, error, "Failed to create conversation");
  }
};

/**
 * Updates group conversation members
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateGroupMembers = async (req, res) => {
  const { UserID } = req.user;
  const { conversationId } = req.params;
  const { add = [], remove = [] } = req.body;

  try {
    // Verify conversation exists and is a group, and user is admin
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
        admin: { select: { UserID: true } },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({ error: "Not a group conversation" });
    }

    if (conversation.adminId !== UserID) {
      return res
        .status(403)
        .json({ error: "Only admins can modify group members" });
    }

    // Verify users to add/remove exist
    const usersToAdd = await prisma.user.findMany({
      where: { UserID: { in: add } },
      select: { UserID: true },
    });

    const usersToRemove = await prisma.user.findMany({
      where: { UserID: { in: remove } },
      select: { UserID: true },
    });

    if (
      usersToAdd.length !== add.length ||
      usersToRemove.length !== remove.length
    ) {
      return res.status(400).json({ error: "Invalid user IDs" });
    }

    // Update participants
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        participants: {
          connect: add.map((id) => ({ UserID: id })),
          disconnect: remove.map((id) => ({ UserID: id })),
        },
      },
    });

    // Fetch updated conversation
    const updatedConversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
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

    // Invalidate caches
    const participantIds = [
      ...conversation.participants.map((p) => p.UserID),
      ...add,
    ];
    for (const id of participantIds) {
      await redis.del(`conversations:${id}`);
    }

    res.json(updatedConversation);
  } catch (error) {
    console.error("Error updating group members:", error);
    handleServerError(res, error, "Failed to update group members");
  }
};

/**
 * Gets a conversation with all messages and details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMessages = async (req, res) => {
  const { UserID } = req.user;
  const { conversationId } = req.params;
  const { limit = 20, before } = req.query;

  try {
    // Fetch conversation with all details
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

    // Get total message count
    const totalMessages = await prisma.message.count({
      where: {
        conversationId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
    });

    // Get last message
    const lastMessage =
      conversation.messages.length > 0 ? conversation.messages[0] : null;

    // Format response
    const response = {
      id: conversation.id,
      title: conversation.title,
      isGroup: conversation.isGroup,
      adminId: conversation.adminId,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      participants: conversation.participants,
      messages: conversation.messages.reverse(),
      lastMessage,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    handleServerError(res, error, "Failed to fetch conversation");
  }
};

/**
 * Sends a message in a conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendMessage = async (req, res) => {
  const { UserID } = req.user;
  const { conversationId } = req.params;
  const { content, attachments, replyToId } = req.body;

  try {
    // Verify user is part of conversation
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

    // Verify replyToId if provided
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

    // Update conversation's updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Invalidate cache
    const participantIds = conversation.participants.map((p) => p.UserID);
    for (const id of participantIds) {
      await redis.del(`conversations:${id}`);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    handleServerError(res, error, "Failed to send message");
  }
};

/**
 * Adds a reaction to a message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addReaction = async (req, res) => {
  const { UserID } = req.user;
  const { messageId } = req.params;
  const { emoji } = req.body;

  try {
    // Verify message exists and user is part of conversation
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

    // Check if reaction already exists
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

    // Invalidate cache
    const participantIds = message.conversation.participants.map(
      (p) => p.UserID
    );
    for (const id of participantIds) {
      await redis.del(`conversations:${id}`);
    }

    res.status(201).json({ messageId, emoji: reaction.emoji });
  } catch (error) {
    console.error("Error adding reaction:", error);
    handleServerError(res, error, "Failed to add reaction");
  }
};

/**
 * Marks messages as read by the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const markAsRead = async (req, res) => {
  const { UserID } = req.user;
  const { messageIds } = req.body;

  try {
    // Verify messages exist and user is part of the conversation
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

    // Check if all provided messageIds are valid
    if (messages.length !== messageIds.length) {
      return res.status(400).json({ error: "Invalid message IDs" });
    }

    // Filter messages not sent by the user and not already read
    const messagesToUpdate = messages.filter(
      (msg) =>
        msg.senderId !== UserID &&
        !msg.readBy.some((reader) => reader.UserID === UserID)
    );

    // Update readBy and readAt using a transaction
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

    // Return success response
    res.json({ success: true, updatedCount: messagesToUpdate.length });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    handleServerError(res, error, "Failed to mark messages as read");
  }
};

/**
 * Notifies typing status in a conversation (stores in Redis only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleTyping = async (req, res) => {
  const { UserID } = req.user;
  const { conversationId, isTyping = true } = req.body;

  try {
    // Verify user is part of conversation
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

    // Store typing status in Redis (expires after 10 seconds)
    const cacheKey = `typing:${conversationId}:${UserID}`;
    if (isTyping) {
      await redis.set(cacheKey, "true", "EX", 10);
    } else {
      await redis.del(cacheKey);
    }

    // Respond to the HTTP request
    res.json({ success: true });
  } catch (error) {
    console.error("Error handling typing status:", error);
    handleServerError(res, error, "Failed to handle typing status");
  }
};

module.exports = {
  getConversations,
  createConversation,
  updateGroupMembers,
  getMessages,
  sendMessage,
  addReaction,
  markAsRead,
  handleTyping,
};
