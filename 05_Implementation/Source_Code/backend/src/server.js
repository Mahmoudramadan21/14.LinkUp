const { Server } = require("socket.io");
const prisma = require("./utils/prisma");
const authMiddleware = require("./middleware/authMiddleware");
const { uploadToCloudinary } = require("./services/uploadService");

/**
 * Configures Socket.IO for real-time communication
 * @param {Object} server - HTTP server instance
 * @returns {Object} Configured Socket.IO instance
 */
const configureSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3001",
      methods: ["GET", "POST"],
      credentials: true,
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = authMiddleware.verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { UserID: decoded.userId },
        select: {
          UserID: true,
          Username: true,
          ProfilePicture: true,
          lastActive: true,
        },
      });

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error("Socket auth error:", err.message);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user.UserID;
    console.log(`User connected: ${socket.user.Username} (ID: ${userId})`);

    // Join user-specific room
    socket.join(`user_${userId}`);

    // Update user's online status
    await prisma.user.update({
      where: { UserID: userId },
      data: { lastActive: new Date() },
    });

    // Notify others about online status
    socket.broadcast.emit("userStatus", {
      userId,
      status: "online",
      username: socket.user.Username,
      lastActive: new Date(),
    });

    // Join all conversation rooms
    try {
      const conversations = await prisma.conversation.findMany({
        where: {
          participants: { some: { UserID: userId } },
        },
        select: { id: true },
      });

      conversations.forEach((conv) => {
        socket.join(conv.id);
        console.log(`User ${userId} joined conversation ${conv.id}`);
      });
    } catch (error) {
      console.error("Error joining conversations:", error);
    }

    // Handle sending a new message
    socket.on(
      "sendMessage",
      async ({ conversationId, content, replyToId, attachment }, callback) => {
        try {
          // Verify conversation access
          const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { participants: { select: { UserID: true } } },
          });

          if (
            !conversation ||
            !conversation.participants.some((p) => p.UserID === userId)
          ) {
            return callback({ error: "Unauthorized access to conversation" });
          }

          let attachmentData = null;
          // Handle attachment if provided
          if (attachment && attachment.buffer) {
            const result = await uploadToCloudinary(
              Buffer.from(attachment.buffer),
              `messages/${conversationId}`,
              attachment.type.startsWith("video/") ? "video" : "image"
            );

            attachmentData = {
              url: result.secure_url,
              type: attachment.type.startsWith("video/") ? "video" : "image",
              publicId: result.public_id,
            };
          }

          // Create message in database
          const message = await prisma.message.create({
            data: {
              content,
              senderId: userId,
              conversationId,
              replyToId,
              attachments: attachmentData
                ? { create: attachmentData }
                : undefined,
            },
            include: {
              sender: {
                select: { UserID: true, Username: true, ProfilePicture: true },
              },
              attachments: true,
            },
          });

          // Emit message to conversation room
          io.to(conversationId).emit("newMessage", message);

          callback({ success: true, message });
        } catch (error) {
          console.error("Error sending message:", error);
          callback({ error: "Failed to send message" });
        }
      }
    );

    // Typing indicator
    socket.on("typing", async ({ conversationId, isTyping }) => {
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { participants: { select: { UserID: true } } },
        });

        if (
          !conversation ||
          !conversation.participants.some((p) => p.UserID === userId)
        ) {
          return;
        }

        socket.to(conversationId).emit("typing", {
          userId,
          isTyping,
          username: socket.user.Username,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Error handling typing event:", error);
      }
    });

    // Message read receipt
    socket.on("markRead", async ({ messageIds }) => {
      try {
        await prisma.message.updateMany({
          where: { id: { in: messageIds } },
          data: { readAt: new Date() },
        });

        const messages = await prisma.message.findMany({
          where: { id: { in: messageIds } },
          select: { senderId: true, conversationId: true },
        });

        messages.forEach((msg) => {
          if (msg.senderId !== userId) {
            io.to(`user_${msg.senderId}`).emit("messagesRead", {
              conversationId: msg.conversationId,
              readerId: userId,
              timestamp: new Date(),
            });
          }
        });
      } catch (error) {
        console.error("Read receipt error:", error);
        socket.emit("error", { message: "Failed to mark messages as read" });
      }
    });

    // Disconnect handler
    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${socket.user.Username} (ID: ${userId})`);
      try {
        await prisma.user.update({
          where: { UserID: userId },
          data: { lastActive: new Date() },
        });

        socket.broadcast.emit("userStatus", {
          userId,
          status: "offline",
          username: socket.user.Username,
          lastActive: new Date(),
        });
      } catch (error) {
        console.error("Error updating last active:", error);
      }
    });
  });

  return io;
};

module.exports = configureSocket;
