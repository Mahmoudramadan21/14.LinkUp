const { prisma } = require("../utils/prisma");
const { redisClient } = require("../utils/redis");
const logger = require("../utils/logger");

class NotificationService {
  /**
   * Creates and sends a notification
   * @param {Object} params - Notification parameters
   * @param {number} params.userId - Target user ID
   * @param {string} params.type - Notification type (e.g., LIKE, COMMENT)
   * @param {string} params.content - Notification content
   * @param {Object} [params.metadata] - Additional data (e.g., postId, senderId)
   * @param {Object} io - Socket.IO instance
   */
  static async createNotification({ userId, type, content, metadata }, io) {
    try {
      // Validate notification type
      const validTypes = [
        "FOLLOW_REQUEST",
        "FOLLOW_ACCEPTED",
        "FOLLOW",
        "LIKE",
        "COMMENT",
        "MESSAGE",
        "STORY_LIKE",
        "ADMIN_WARNING",
      ];
      if (!validTypes.includes(type)) {
        throw new Error(`Invalid notification type: ${type}`);
      }

      // Rate limit notifications per user
      const rateLimitKey = `notification:ratelimit:${userId}:${type}`;
      const count = await redisClient.incr(rateLimitKey);
      if (count === 1) await redisClient.expire(rateLimitKey, 60); // 1 minute window
      if (count > 5) {
        logger.warn(`Rate limit exceeded for notification to user ${userId}`);
        return;
      }

      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          UserID: userId,
          Type: type,
          Content: content,
          Metadata: metadata || {},
        },
      });

      // Cache notification in Redis (expires in 24 hours)
      await redisClient.setEx(
        `notification:${notification.NotificationID}`,
        24 * 60 * 60,
        JSON.stringify(notification)
      );

      // Emit notification via Socket.IO
      io.to(`user_${userId}`).emit("notification", {
        id: notification.NotificationID,
        type: notification.Type,
        content: notification.Content,
        metadata: notification.Metadata,
        isRead: notification.IsRead,
        createdAt: notification.CreatedAt,
      });

      logger.info(`Notification sent to user ${userId}: ${content}`);
      return notification;
    } catch (error) {
      logger.error(`Failed to create notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marks notifications as read
   * @param {number} userId - User ID
   * @param {number[]} notificationIds - Array of notification IDs
   */
  static async markNotificationsRead(userId, notificationIds) {
    try {
      await prisma.notification.updateMany({
        where: {
          NotificationID: { in: notificationIds },
          UserID: userId,
        },
        data: { IsRead: true },
      });
      logger.info(`Marked notifications as read for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to mark notifications read: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deletes a notification
   * @param {number} userId - User ID
   * @param {number} notificationId - Notification ID
   */
  static async deleteNotification(userId, notificationId) {
    try {
      await prisma.notification.delete({
        where: {
          NotificationID: notificationId,
          UserID: userId,
        },
      });
      await redisClient.del(`notification:${notificationId}`);
      logger.info(`Deleted notification ${notificationId} for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to delete notification: ${error.message}`);
      throw error;
    }
  }
}

module.exports = NotificationService;
