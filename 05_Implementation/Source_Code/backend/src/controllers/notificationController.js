const prisma = require("../utils/prisma");
const { setWithTracking, get, clearUserCache } = require("../utils/redisUtils");
const { handleServerError } = require("../utils/errorHandler");

// Constants for configuration
const NOTIFICATION_CACHE_TTL = 300; // 5 minutes cache duration
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetches notifications for the authenticated user
 * Supports pagination and filtering by read status
 */
const getNotifications = async (req, res) => {
  try {
    const { page = 1, readStatus = "ALL" } = req.query;
    const userId = req.user.UserID;
    const limit = parseInt(req.query.limit) || DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * limit;

    // Validate readStatus
    const validStatuses = ["ALL", "READ", "UNREAD"];
    if (!validStatuses.includes(readStatus)) {
      return res.status(400).json({ error: "Invalid read status" });
    }

    // Check cache
    const cacheKey = `notifications:${userId}:${page}:${limit}:${readStatus}`;
    const cachedNotifications = await get(cacheKey);
    if (cachedNotifications) {
      return res.json(cachedNotifications);
    }

    // Build where clause
    const where = { UserID: userId };
    if (readStatus !== "ALL") {
      where.IsRead = readStatus === "READ";
    }

    // Fetch notifications
    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { CreatedAt: "desc" },
        include: {
          Sender: {
            select: {
              UserID: true,
              Username: true,
              ProfilePicture: true,
            },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    // Format response
    const response = {
      notifications: notifications.map((n) => ({
        notificationId: n.NotificationID,
        type: n.Type,
        content: n.Content,
        isRead: n.IsRead,
        createdAt: n.CreatedAt,
        sender: n.Sender
          ? {
              userId: n.Sender.UserID,
              username: n.Sender.Username,
              profilePicture: n.Sender.ProfilePicture,
            }
          : null,
        metadata: n.Metadata,
      })),
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
    };

    // Cache response
    await setWithTracking(cacheKey, response, NOTIFICATION_CACHE_TTL, userId);

    res.json(response);
  } catch (error) {
    handleServerError(res, error, "Failed to fetch notifications");
  }
};

/**
 * Marks a single notification as read
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.UserID;

    const notification = await prisma.notification.findUnique({
      where: { NotificationID: parseInt(notificationId) },
      select: { UserID: true },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.UserID !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.notification.update({
      where: { NotificationID: parseInt(notificationId) },
      data: { IsRead: true },
    });

    // Clear cache
    await clearUserCache(userId);

    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    handleServerError(res, error, "Failed to mark notification as read");
  }
};

/**
 * Marks all notifications as read for the user
 */
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.UserID;

    await prisma.notification.updateMany({
      where: { UserID: userId, IsRead: false },
      data: { IsRead: true },
    });

    // Clear cache
    await clearUserCache(userId);

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    handleServerError(res, error, "Failed to mark all notifications as read");
  }
};

/**
 * Updates user notification preferences
 */
const updateNotificationPreferences = async (req, res) => {
  try {
    const { emailNotifications, pushNotifications, notificationTypes } =
      req.body;
    const userId = req.user.UserID;

    // Validate notification types
    const validTypes = [
      "LIKE",
      "COMMENT",
      "FOLLOW",
      "FOLLOW_REQUEST",
      "REPORT",
      "STORY_LIKE",
    ];
    if (
      (notificationTypes && !Array.isArray(notificationTypes)) ||
      notificationTypes.some((type) => !validTypes.includes(type))
    ) {
      return res.status(400).json({ error: "Invalid notification types" });
    }

    const preferences = {
      EmailNotifications: emailNotifications ?? undefined,
      PushNotifications: pushNotifications ?? undefined,
      NotificationTypes: notificationTypes ?? undefined,
    };

    const updatedUser = await prisma.user.update({
      where: { UserID: userId },
      data: {
        NotificationPreferences: {
          upsertgenerally: {
            create: preferences,
            update: preferences,
          },
        },
      },
      select: {
        NotificationPreferences: true,
      },
    });

    res.json({
      success: true,
      preferences: updatedUser.NotificationPreferences,
    });
  } catch (error) {
    handleServerError(res, error, "Failed to update notification preferences");
  }
};

/**
 * Deletes a notification
 */
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.UserID;

    const notification = await prisma.notification.findUnique({
      where: { NotificationID: parseInt(notificationId) },
      select: { UserID: true },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.UserID !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.notification.delete({
      where: { NotificationID: parseInt(notificationId) },
    });

    // Clear cache
    await clearUserCache(userId);

    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    handleServerError(res, error, "Failed to delete notification");
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  updateNotificationPreferences,
  deleteNotification,
};
