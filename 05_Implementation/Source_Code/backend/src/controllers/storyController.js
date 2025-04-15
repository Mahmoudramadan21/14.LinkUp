const prisma = require("../utils/prisma");
const redis = require("../utils/redis");
const { uploadToCloud } = require("../services/cloudService");
const { handleServerError } = require("../utils/errorHandler");

/**
 * Creates a new story with media
 * Expires after 24 hours
 */
const createStory = async (req, res) => {
  try {
    const { UserID } = req.user;
    const mediaFile = req.file;

    // Verify media presence
    if (!mediaFile) {
      return res.status(400).json({ error: "Media file is required" });
    }

    // Upload media to Cloudinary
    const uploadResult = await uploadToCloud(mediaFile.buffer, {
      folder: "stories",
      resource_type: "auto",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
    });

    if (!uploadResult?.secure_url) {
      throw new Error("No secure URL received from Cloudinary");
    }

    // Set expiration time
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create story
    const story = await prisma.story.create({
      data: {
        MediaURL: uploadResult.secure_url,
        ExpiresAt: expiresAt,
        User: {
          connect: {
            UserID: UserID,
          },
        },
      },
      select: {
        StoryID: true,
        MediaURL: true,
        CreatedAt: true,
        ExpiresAt: true,
      },
    });

    // Clear cache
    await redis.del(`stories:${UserID}`);
    await redis.del(`stories:feed:${UserID}`);

    res.status(201).json(story);
  } catch (error) {
    handleServerError(res, error, "Failed to create story");
  }
};

/**
 * Fetches stories for a user
 * Includes privacy checks
 */
const getUserStories = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.UserID;

  try {
    // Verify user exists
    const userExists = await prisma.user.findUnique({
      where: { UserID: parseInt(userId) },
      select: { IsPrivate: true, UserID: true },
    });

    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check privacy for private accounts
    if (userExists.IsPrivate && userExists.UserID !== currentUserId) {
      const isFollowing = await prisma.follower.count({
        where: {
          UserID: parseInt(userId),
          FollowerUserID: currentUserId,
          Status: "ACCEPTED",
        },
      });

      if (!isFollowing) {
        return res.status(403).json({ error: "Private account" });
      }
    }

    // Fetch non-expired stories
    const stories = await prisma.story.findMany({
      where: {
        UserID: parseInt(userId),
        ExpiresAt: { gt: new Date() },
      },
      select: {
        StoryID: true,
      },
      orderBy: { CreatedAt: "desc" },
    });

    res.json(stories.map((story) => story.StoryID));
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

    // Verify story ownership
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

    // Fetch views
    const views = await prisma.storyView.findMany({
      where: { StoryID: parseInt(storyId) },
      include: {
        User: {
          select: { UserID: true, Username: true, ProfilePicture: true },
        },
      },
      orderBy: { ViewedAt: "desc" },
    });

    // Fetch likes
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
 * Prioritizes unviewed stories
 */
const getStoryFeed = async (req, res) => {
  const { UserID } = req.user;

  try {
    // Check cache
    const cacheKey = `stories:feed_ids:${UserID}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) return res.json(cachedData);

    // Get followed users
    const following = await prisma.follower.findMany({
      where: {
        FollowerUserID: UserID,
        Status: "ACCEPTED",
      },
      select: { UserID: true },
    });

    const followingIds = following.map((f) => f.UserID);
    followingIds.push(UserID);

    // Fetch stories with view status
    const stories = await prisma.story.findMany({
      where: {
        UserID: { in: followingIds },
        ExpiresAt: { gt: new Date() },
      },
      select: {
        UserID: true,
        StoryID: true,
        StoryViews: {
          where: { UserID: UserID },
          select: { ViewID: true },
        },
      },
      orderBy: { CreatedAt: "desc" },
    });

    // Group stories by user
    const usersWithStories = stories.reduce((acc, story) => {
      if (!acc[story.UserID]) {
        acc[story.UserID] = {
          userId: story.UserID,
          storyIds: [],
          viewedStoryIds: [],
        };
      }
      acc[story.UserID].storyIds.push(story.StoryID);
      if (story.StoryViews.length > 0) {
        acc[story.UserID].viewedStoryIds.push(story.StoryID);
      }
      return acc;
    }, {});

    // Format response
    const result = Object.values(usersWithStories).map((user) => ({
      userId: user.userId,
      hasUnviewedStories: user.storyIds.length > user.viewedStoryIds.length,
    }));

    // Sort by unviewed stories
    result.sort((a, b) => {
      if (a.hasUnviewedStories && !b.hasUnviewedStories) return -1;
      if (!a.hasUnviewedStories && b.hasUnviewedStories) return 1;
      return 0;
    });

    // Cache response
    await redis.set(cacheKey, result, 300);

    res.json(result);
  } catch (error) {
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
    // Fetch story details
    const story = await prisma.story.findUnique({
      where: {
        StoryID: parseInt(storyId),
      },
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
        _count: {
          select: {
            StoryLikes: true,
            StoryViews: true,
          },
        },
      },
    });

    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    // Check expiration for non-owners
    if (story.User.UserID !== UserID && story.ExpiresAt < new Date()) {
      return res.status(404).json({ error: "Story has expired" });
    }

    // Check privacy for private accounts
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

    // Record view for non-owners
    if (story.User.UserID !== UserID) {
      await prisma.storyView.upsert({
        where: {
          StoryID_UserID: {
            StoryID: parseInt(storyId),
            UserID: UserID,
          },
        },
        update: {},
        create: {
          StoryID: parseInt(storyId),
          UserID: UserID,
          ViewedAt: new Date(),
        },
      });

      // Clear cache
      await redis.del(`stories:${story.User.UserID}`);
      await redis.del(`stories:feed:${UserID}`);
    }

    // Check like status
    const hasLiked =
      (await prisma.storyLike.count({
        where: {
          StoryID: parseInt(storyId),
          UserID: UserID,
        },
      })) > 0;

    res.json({
      ...story,
      hasLiked,
    });
  } catch (error) {
    handleServerError(res, error, "Failed to fetch story");
  }
};

/**
 * Toggles like status on a story
 * Creates notifications
 */
const toggleStoryLike = async (req, res) => {
  const { storyId } = req.params;
  const { UserID } = req.user;

  try {
    // Verify story exists
    const story = await prisma.story.findUnique({
      where: { StoryID: parseInt(storyId) },
      select: { UserID: true, ExpiresAt: true },
    });

    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    // Check expiration
    if (story.ExpiresAt < new Date()) {
      return res.status(400).json({ error: "Story has expired" });
    }

    // Verify access for non-owners
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

    // Toggle like
    const existingLike = await prisma.storyLike.findUnique({
      where: {
        UserID_StoryID: {
          UserID: UserID,
          StoryID: parseInt(storyId),
        },
      },
    });

    let action;
    if (existingLike) {
      await prisma.storyLike.delete({
        where: {
          UserID_StoryID: {
            UserID: UserID,
            StoryID: parseInt(storyId),
          },
        },
      });
      action = "unliked";
    } else {
      await prisma.storyLike.create({
        data: {
          UserID: UserID,
          StoryID: parseInt(storyId),
        },
      });

      // Notify owner
      if (story.UserID !== UserID) {
        await prisma.notification.create({
          data: {
            UserID: story.UserID,
            Type: "STORY_LIKE",
            Content: `User ${req.user.Username} liked your story`,
            Metadata: {
              storyId: parseInt(storyId),
              likerId: UserID,
            },
          },
        });
      }
      action = "liked";
    }

    // Clear cache
    await redis.del(`stories:${story.UserID}`);
    await redis.del(`stories:feed:${UserID}`);

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
    // Verify story ownership
    const story = await prisma.story.findFirst({
      where: {
        StoryID: parseInt(storyId),
        UserID: UserID,
      },
    });

    if (!story) {
      return res.status(404).json({
        error: "Story not found or you don't have permission to delete it",
      });
    }

    // Delete related data
    await prisma.storyHighlight.deleteMany({
      where: { StoryID: parseInt(storyId) },
    });

    // Delete story
    await prisma.story.delete({
      where: { StoryID: parseInt(storyId) },
    });

    // Clear cache
    await redis.del(`stories:${UserID}`);
    await redis.del(`stories:feed:${UserID}`);

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
  toggleStoryLike,
  deleteStory,
};
