const prisma = require("../utils/prisma");
const {
  setWithTracking,
  get,
  clearUserCache,
  del,
} = require("../utils/redisUtils");
const { uploadToCloud } = require("../services/cloudService");
const { handleServerError } = require("../utils/errorHandler");
const redis = require("../utils/redis"); // Ensure Redis is imported

/**
 * Creates a new story with media
 * Expires after 24 hours
 */
const createStory = async (req, res) => {
  try {
    const { UserID } = req.user;
    const mediaFile = req.file;

    if (!mediaFile) {
      return res.status(400).json({ error: "Media file is required" });
    }

    const uploadResult = await uploadToCloud(mediaFile.buffer, {
      folder: "stories",
      resource_type: "auto",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
    });

    if (!uploadResult?.secure_url) {
      throw new Error("No secure URL received from Cloudinary");
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const story = await prisma.story.create({
      data: {
        MediaURL: uploadResult.secure_url,
        ExpiresAt: expiresAt,
        User: { connect: { UserID } },
      },
      select: {
        StoryID: true,
        MediaURL: true,
        CreatedAt: true,
        ExpiresAt: true,
      },
    });

    await del(`stories:${UserID}`, UserID);
    await del(`stories:feed:${UserID}`, UserID);

    // Notify via WebSocket
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${UserID}`).emit("storyUpdate", {
        storyId: story.StoryID,
        action: "new",
      });
    }

    res.status(201).json(story);
  } catch (error) {
    handleServerError(res, error, "Failed to create story");
  }
};

/**
 * Fetches stories for a user by username
 * Includes privacy checks and returns active stories with MediaURL and view status
 */
const getUserStories = async (req, res) => {
  const { username } = req.params;
  const currentUserId = req.user?.UserID;

  try {
    if (!currentUserId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const cacheKey = `stories:username:${username}`;
    const cachedStories = await get(cacheKey);
    if (cachedStories) return res.json(cachedStories);

    const user = await prisma.user.findUnique({
      where: { Username: username },
      select: { IsPrivate: true, UserID: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.IsPrivate && user.UserID !== currentUserId) {
      const isFollowing = await prisma.follower.count({
        where: {
          UserID: user.UserID,
          FollowerUserID: currentUserId,
          Status: "ACCEPTED",
        },
      });

      if (!isFollowing) {
        return res.status(403).json({ error: "Private account" });
      }
    }

    const stories = await prisma.story.findMany({
      where: {
        UserID: user.UserID,
        ExpiresAt: { gt: new Date() },
      },
      select: {
        StoryID: true,
        MediaURL: true,
        CreatedAt: true,
        ExpiresAt: true,
        StoryViews: {
          where: { UserID: currentUserId },
          select: { ViewID: true },
        },
      },
      orderBy: { CreatedAt: "desc" },
    });

    const formattedStories = stories.map((story) => ({
      StoryID: story.StoryID,
      MediaURL: story.MediaURL,
      CreatedAt: story.CreatedAt,
      ExpiresAt: story.ExpiresAt,
      isViewed: story.StoryViews.length > 0,
    }));

    await setWithTracking(
      cacheKey,
      formattedStories,
      60,
      user.UserID.toString()
    );
    res.json(formattedStories);
  } catch (error) {
    handleServerError(res, error, "Failed to fetch stories");
  }
};

/**
 * Fetches views and likes for a story
 * Requires ownership
 */
const getStoryViews = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.UserID;

    const story = await prisma.story.findUnique({
      where: { StoryID: parseInt(storyId) },
      select: { UserID: true },
    });

    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    if (story.UserID !== userId) {
      return res.status(403).json({ error: "You don't own this story" });
    }

    const views = await prisma.storyView.findMany({
      where: { StoryID: parseInt(storyId) },
      include: {
        User: {
          select: { UserID: true, Username: true, ProfilePicture: true },
        },
      },
      orderBy: { ViewedAt: "desc" },
    });

    const likes = await prisma.storyLike.findMany({
      where: { StoryID: parseInt(storyId) },
      include: {
        User: {
          select: { UserID: true, Username: true, ProfilePicture: true },
        },
      },
      orderBy: { CreatedAt: "desc" },
    });

    res.status(200).json({
      totalViews: views.length,
      views,
      totalLikes: likes.length,
      likedBy: likes.map((like) => like.User),
    });
  } catch (error) {
    handleServerError(res, error, "Failed to fetch story views");
  }
};

/**
 * Fetches story feed for followed users
 * Includes user details, story IDs, and view status
 * Prioritizes unviewed stories
 */
const getStoryFeed = async (req, res) => {
  const { UserID } = req.user;
  const { limit = 20, offset = 0 } = req.query;

  console.log("Processing getStoryFeed for UserID:", UserID); // Debug log

  try {
    if (!UserID) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const cacheKey = `stories:feed:${UserID}:${offset}:${limit}`;
    const cachedData = await get(cacheKey);
    if (cachedData) {
      console.log("Returning cached data for UserID:", UserID); // Debug log
      return res.json(cachedData);
    }

    const following = await prisma.follower.findMany({
      where: { FollowerUserID: UserID, Status: "ACCEPTED" },
      select: { UserID: true },
    });

    console.log(
      "Following IDs:",
      following.map((f) => f.UserID)
    ); // Debug log

    const followingIds = following.map((f) => f.UserID);
    followingIds.push(UserID);

    const stories = await prisma.story.findMany({
      where: {
        UserID: { in: followingIds },
        ExpiresAt: { gt: new Date() },
      },
      include: {
        User: { select: { Username: true, ProfilePicture: true } },
        StoryViews: { where: { UserID }, select: { ViewID: true } },
      },
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { CreatedAt: "desc" },
    });

    if (!stories || stories.length === 0) {
      console.log(
        `No stories found for user ${UserID} with followingIds: ${followingIds}`
      );
      return res.json([]);
    }

    const userMap = {};
    stories.forEach((story) => {
      userMap[story.UserID] = {
        userId: story.UserID,
        username: story.User.Username,
        profilePicture: story.User.ProfilePicture,
      };
    });

    const usersWithStories = stories.reduce((acc, story) => {
      if (!acc[story.UserID])
        acc[story.UserID] = { userId: story.UserID, stories: [] };
      acc[story.UserID].stories.push({
        storyId: story.StoryID,
        createdAt: story.CreatedAt,
        mediaUrl: story.MediaURL,
        expiresAt: story.ExpiresAt,
        isViewed: story.StoryViews.length > 0,
      });
      return acc;
    }, {});

    const result = Object.values(usersWithStories)
      .map((user) => {
        const userDetails = userMap[user.userId];
        if (!userDetails) return null;
        const storyIds = user.stories.map((s) => s.storyId);
        const viewedStoryIds = user.stories
          .filter((s) => s.isViewed)
          .map((s) => s.storyId);
        return {
          userId: user.userId,
          username: userDetails.username,
          profilePicture: userDetails.profilePicture,
          hasUnviewedStories: storyIds.length > viewedStoryIds.length,
          stories: user.stories,
        };
      })
      .filter((user) => user !== null)
      .sort((a, b) => (a.hasUnviewedStories && !b.hasUnviewedStories ? -1 : 1));

    await setWithTracking(cacheKey, result, 60, UserID);
    res.json(result);
  } catch (error) {
    console.error("Error in getStoryFeed:", error);
    handleServerError(res, error, "Failed to fetch story feed");
  }
};

/**
 * Fetches a specific story
 * Records view for non-owners
 */
const getStoryById = async (req, res) => {
  const { storyId } = req.params;
  const { UserID } = req.user;

  try {
    if (!UserID) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const story = await prisma.story.findUnique({
      where: { StoryID: parseInt(storyId) },
      select: {
        StoryID: true,
        MediaURL: true,
        CreatedAt: true,
        ExpiresAt: true,
        User: {
          select: {
            UserID: true,
            Username: true,
            ProfilePicture: true,
            IsPrivate: true,
          },
        },
        _count: { select: { StoryLikes: true, StoryViews: true } },
      },
    });

    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    if (story.ExpiresAt < new Date()) {
      return res.status(404).json({ error: "Story has expired" });
    }

    if (story.User.IsPrivate && story.User.UserID !== UserID) {
      const isFollowing = await prisma.follower.count({
        where: {
          UserID: story.User.UserID,
          FollowerUserID: UserID,
          Status: "ACCEPTED",
        },
      });

      if (!isFollowing) {
        return res.status(403).json({ error: "Private account" });
      }
    }

    if (story.User.UserID !== UserID) {
      const viewKey = `view:temp:${story.StoryID}:${UserID}`;
      await redis.set(viewKey, "1", "EX", 5);
      if (!global.viewBatch) {
        global.viewBatch = [];
        setInterval(async () => {
          const batch = global.viewBatch;
          global.viewBatch = [];
          if (batch.length) {
            await prisma.storyView.createMany({
              data: batch.map(({ storyId, userId }) => ({
                StoryID: parseInt(storyId),
                UserID: userId,
                ViewedAt: new Date(),
              })),
              skipDuplicates: true,
            });
            await Promise.all(
              batch.map(({ storyId, userId }) =>
                del(`stories:feed:${userId}`, userId)
              )
            );
          }
        }, 5000);
      }
      global.viewBatch.push({ storyId, userId: UserID });
      await del(`stories:feed:${UserID}`, UserID);
    }

    const hasLiked =
      (await prisma.storyLike.count({
        where: { StoryID: parseInt(storyId), UserID },
      })) > 0;

    res.json({ ...story, hasLiked });
  } catch (error) {
    console.error("Error in getStoryById:", error);
    handleServerError(res, error, "Failed to fetch story");
  }
};

/**
 * Records a view for a specific story
 * Only for non-owners, prevents duplicate views
 */
const recordStoryView = async (req, res) => {
  const { storyId } = req.params;
  const { UserID } = req.user;

  try {
    const story = await prisma.story.findUnique({
      where: { StoryID: parseInt(storyId) },
      select: {
        UserID: true,
        ExpiresAt: true,
        User: {
          select: {
            IsPrivate: true,
          },
        },
      },
    });

    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    if (story.ExpiresAt < new Date()) {
      return res.status(400).json({ error: "Story has expired" });
    }

    if (story.UserID === UserID) {
      return res.status(403).json({ error: "You cannot view your own story" });
    }

    if (story.User.IsPrivate) {
      const isFollowing = await prisma.follower.count({
        where: {
          UserID: story.UserID,
          FollowerUserID: UserID,
          Status: "ACCEPTED",
        },
      });

      if (!isFollowing) {
        return res.status(403).json({ error: "Private account" });
      }
    }

    const existingView = await prisma.storyView.findUnique({
      where: {
        StoryID_UserID: {
          StoryID: parseInt(storyId),
          UserID: UserID,
        },
      },
    });

    if (existingView) {
      return res
        .status(200)
        .json({ success: true, message: "Story already viewed" });
    }

    await prisma.storyView.create({
      data: {
        StoryID: parseInt(storyId),
        UserID: UserID,
        ViewedAt: new Date(),
      },
    });

    await del(`stories:feed:${UserID}`, UserID);

    res.status(200).json({ success: true, message: "Story view recorded" });
  } catch (error) {
    handleServerError(res, error, "Failed to record story view");
  }
};

/**
 * Creates notification for story like
 */
async function createStoryLikeNotification(storyId, likerId, likerUsername) {
  const story = await prisma.story.findUnique({
    where: { StoryID: parseInt(storyId) },
    select: { UserID: true },
  });

  if (!story || story.UserID === likerId) return;

  const recipient = await prisma.user.findUnique({
    where: { UserID: story.UserID },
    select: { NotificationPreferences: true },
  });

  const shouldNotify =
    !recipient.NotificationPreferences ||
    !recipient.NotificationPreferences.NotificationTypes ||
    recipient.NotificationPreferences.NotificationTypes.includes("STORY_LIKE");

  if (shouldNotify) {
    await prisma.notification.create({
      data: {
        UserID: story.UserID,
        SenderID: likerId,
        Type: "STORY_LIKE",
        Content: `${likerUsername} liked your story`,
        Metadata: {
          storyId: parseInt(storyId),
          likerId,
          likerUsername,
        },
      },
    });
  }
}

/**
 * Toggles like status on a story
 * Creates notifications
 */
const toggleStoryLike = async (req, res) => {
  const { storyId } = req.params;
  const { UserID } = req.user;

  try {
    const story = await prisma.story.findUnique({
      where: { StoryID: parseInt(storyId) },
      select: { UserID: true, ExpiresAt: true },
    });

    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    if (story.ExpiresAt < new Date()) {
      return res.status(400).json({ error: "Story has expired" });
    }

    if (story.UserID !== UserID) {
      const isFollowing = await prisma.follower.count({
        where: {
          UserID: story.UserID,
          FollowerUserID: UserID,
          Status: "ACCEPTED",
        },
      });

      if (!isFollowing) {
        return res.status(403).json({ error: "You cannot like this story" });
      }
    }

    const existingLike = await prisma.storyLike.findUnique({
      where: {
        UserID_StoryID: {
          UserID,
          StoryID: parseInt(storyId),
        },
      },
    });

    let action;
    if (existingLike) {
      await prisma.storyLike.delete({
        where: {
          UserID_StoryID: {
            UserID,
            StoryID: parseInt(storyId),
          },
        },
      });
      action = "unliked";
    } else {
      await prisma.storyLike.create({
        data: {
          UserID,
          StoryID: parseInt(storyId),
        },
      });

      if (story.UserID !== UserID) {
        await createStoryLikeNotification(storyId, UserID, req.user.Username);
      }
      action = "liked";
    }

    await del(`stories:${story.UserID}`, story.UserID);
    await del(`stories:feed:${UserID}`, UserID);

    res.json({ success: true, action });
  } catch (error) {
    handleServerError(res, error, "Failed to toggle like");
  }
};

/**
 * Deletes a story and related data
 * Requires ownership
 */
const deleteStory = async (req, res) => {
  const { storyId } = req.params;
  const { UserID } = req.user;

  try {
    const story = await prisma.story.findFirst({
      where: {
        StoryID: parseInt(storyId),
        UserID,
      },
    });

    if (!story) {
      return res.status(404).json({
        error: "Story not found or you don't have permission to delete it",
      });
    }

    await prisma.storyHighlight.deleteMany({
      where: { StoryID: parseInt(storyId) },
    });

    await prisma.story.delete({
      where: { StoryID: parseInt(storyId) },
    });

    await del(`stories:${UserID}`, UserID);
    await del(`stories:feed:${UserID}`, UserID);

    res.json({ success: true, message: "Story deleted successfully" });
  } catch (error) {
    handleServerError(res, error, "Failed to delete story");
  }
};

module.exports = {
  createStory,
  getStoryViews,
  getUserStories,
  getStoryFeed,
  getStoryById,
  recordStoryView,
  toggleStoryLike,
  deleteStory,
};
