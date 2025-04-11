const prisma = require("../utils/prisma");
const redis = require("../utils/redis");
const { uploadToCloud } = require("../services/cloudService");
const { handleServerError } = require("../utils/errorHandler");

/**
 * Creates a new story with media upload and automatic expiration
 * @param {Object} req - Express request object with user and file
 * @param {Object} res - Express response object
 */
const createStory = async (req, res) => {
  try {
    const { UserID } = req.user;
    const mediaFile = req.file;

    if (!mediaFile) {
      return res.status(400).json({ error: "Media file is required" });
    }

    console.log("Uploading file for user:", UserID);

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

    await redis.del(`stories:${UserID}`);
    await redis.del(`stories:feed:${UserID}`);

    console.log("Story created successfully:", story.StoryID);
    return res.status(201).json(story);
  } catch (error) {
    console.error("Error creating story:", error);
    return res.status(500).json({
      error: "Failed to create story",
      details: process.env.NODE_ENV === "development" ? error.message : null,
    });
  }
};

/**
 * Gets all active stories for a specific user
 * @param {Object} req - Express request object with user ID param
 * @param {Object} res - Express response object
 */
const getUserStories = async (req, res) => {
  const { UserID } = req.params;
  const currentUserId = req.user?.UserID;

  try {
    // Check if requested user exists
    const userExists = await prisma.user.findUnique({
      where: { UserID: parseInt(UserID) },
      select: { IsPrivate: true, UserID: true },
    });

    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userExists.IsPrivate && userExists.UserID !== currentUserId) {
      console.log(userExists);
      console.log(userExists.UserID);
      console.log(currentUserId);
      const isFollowing = await prisma.follower.count({
        where: {
          UserID: parseInt(UserID),
          FollowerUserID: currentUserId,
          Status: "ACCEPTED",
        },
      });

      if (!isFollowing) {
        return res.status(403).json({ error: "Private account" });
      }
    }

    // Get non-expired stories
    const stories = await prisma.story.findMany({
      where: {
        UserID: parseInt(UserID),
        ExpiresAt: { gt: new Date() },
      },
      orderBy: { CreatedAt: "desc" },
      select: {
        StoryID: true,
        MediaURL: true,
        CreatedAt: true,
        User: {
          select: {
            UserID: true,
            Username: true,
            ProfilePicture: true,
          },
        },
      },
    });

    res.json(stories);
  } catch (error) {
    console.error("Error fetching stories:", error);
    res.status(500).json({
      error: "Failed to fetch stories",
      details: process.env.NODE_ENV === "development" ? error.message : null,
    });
  }
};

/**
 * Gets stories from users that the current user follows (story feed)
 * @param {Object} req - Express request object with authenticated user
 * @param {Object} res - Express response object
 */
const getStoryFeed = async (req, res) => {
  const { UserID } = req.user;

  try {
    // Check cache first
    const cacheKey = `stories:feed:${UserID}`;
    const cachedStories = await redis.get(cacheKey);
    if (cachedStories) return res.json(cachedStories);

    // Get IDs of followed users
    const following = await prisma.follower.findMany({
      where: {
        FollowerUserID: UserID,
        Status: "ACCEPTED",
      },
      select: { UserID: true },
    });

    const followingIds = following.map((f) => f.UserID);
    followingIds.push(UserID); // Include current user's stories

    // Get active stories from followed users
    const stories = await prisma.story.findMany({
      where: {
        UserID: { in: followingIds },
        ExpiresAt: { gt: new Date() },
      },
      orderBy: { CreatedAt: "desc" },
      select: {
        StoryID: true,
        MediaURL: true,
        CreatedAt: true,
        User: {
          select: {
            UserID: true,
            Username: true,
            ProfilePicture: true,
          },
        },
      },
    });

    // Group stories by user
    const storiesByUser = stories.reduce((acc, story) => {
      if (!acc[story.User.UserID]) {
        acc[story.User.UserID] = {
          user: story.User,
          stories: [],
        };
      }
      acc[story.User.UserID].stories.push(story);
      return acc;
    }, {});

    // Cache for 5 minutes
    await redis.set(cacheKey, storiesByUser, 300);

    res.json(storiesByUser);
  } catch (error) {
    handleServerError(res, error, "Failed to fetch story feed");
  }
};

/**
 * Deletes a story if the user owns it
 * @param {Object} req - Express request object with story ID param
 * @param {Object} res - Express response object
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

    // Delete from database
    await prisma.story.delete({
      where: { StoryID: parseInt(storyId) },
    });

    // Invalidate caches
    await redis.del(`stories:${UserID}`);
    await redis.del(`stories:feed:${UserID}`);

    res.json({ success: true, message: "Story deleted successfully" });
  } catch (error) {
    handleServerError(res, error, "Failed to delete story");
  }
};

module.exports = {
  createStory,
  getUserStories,
  getStoryFeed,
  deleteStory,
};
