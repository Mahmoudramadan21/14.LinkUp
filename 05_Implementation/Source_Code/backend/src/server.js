// server.js
const { Server } = require("socket.io");
const prisma = require("./utils/prisma");
const authMiddleware = require("./middleware/authMiddleware");

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

  // Authentication middleware
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

    // Typing indicator
    socket.on("typing", async ({ conversationId, isTyping }) => {
      try {
        // Verify user is in the conversation
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { participants: { select: { UserID: true } } },
        });

        if (
          !conversation ||
          !conversation.participants.some((p) => p.UserID === userId)
        ) {
          console.warn(
            `User ${userId} attempted to send typing event to unauthorized conversation ${conversationId}`
          );
          return;
        }

        console.log(
          `Typing event: User ${userId} is ${
            isTyping ? "typing" : "not typing"
          } in conversation ${conversationId}`
        );

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
