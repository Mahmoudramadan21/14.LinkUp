const prisma = require("../utils/prisma");
const redis = require("../utils/redis");
const { v4: uuidv4 } = require("uuid");
const LocalModeration = require("../services/localModeration");
const { uploadToCloud } = require("../services/cloudService");
const { handleServerError } = require("../utils/errorHandler");

// Constants for configuration
const POST_CACHE_TTL = 300; // 5 minutes cache duration
const ALLOWED_IMAGE_TYPES = ["jpg", "jpeg", "png", "gif", "webp"];
const ALLOWED_VIDEO_TYPES = ["mp4", "mov", "avi", "mkv", "webm"];

/**
 * Creates a new post with content moderation and media handling
  - Validates content safety
  - Processes media uploads (images/videos)
  - Handles both text and media posts
 */
const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const mediaFile = req.file;
    const userId = req.user.UserID;

    // Validate at least content or media exists
    if (!content && !mediaFile) {
      return res
        .status(400)
        .json({ error: "Either content or media is required" });
    }

    // Content safety check using moderation service
    if (content && !(await LocalModeration.checkText(content))) {
      return res.status(400).json({ error: "Content violates guidelines" });
    }

    let mediaUrl = null,
      isImage = false,
      isVideo = false;

    // Handle media upload if present
    if (mediaFile) {
      try {
        const uploadResult = await uploadToCloud(mediaFile.buffer, {
          folder: "posts",
          resource_type: "auto",
        });

        mediaUrl = uploadResult.secure_url || uploadResult;

        // Determine media type for proper storage
        const fileExt = mediaFile.originalname.split(".").pop().toLowerCase();
        isImage =
          ALLOWED_IMAGE_TYPES.includes(fileExt) ||
          mediaFile.mimetype.startsWith("image/");
        isVideo =
          ALLOWED_VIDEO_TYPES.includes(fileExt) ||
          mediaFile.mimetype.startsWith("video/");
      } catch (uploadError) {
        console.error("Upload failed:", uploadError);
        return res.status(500).json({ error: "Media upload failed" });
      }
    }

    // Create the post record
    const post = await prisma.post.create({
      data: {
        UserID: userId,
        Content: content || null,
        ImageURL: isImage ? mediaUrl : null,
        VideoURL: isVideo ? mediaUrl : null,
      },
      include: { User: { select: { UserID: true, Username: true } } },
    });

    res.status(201).json({ success: true, post });
  } catch (error) {
    console.error("Post creation error:", error);
    res.status(500).json({
      error: "Failed to create post",
      details: process.env.NODE_ENV === "development" ? error.message : null,
    });
  }
};

/**
 * Gets paginated posts from followed users with caching
  - Implements Redis caching layer
  - Handles private account visibility
  - Includes like/comment counts
 */
const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.UserID;

    // Cache key structure: posts:userId:page:limit
    const cacheKey = `posts:${userId}:${page}:${limit}`;
    const cachedPosts = await redis.get(cacheKey);
    if (cachedPosts) return res.json(cachedPosts);

    // Get IDs of followed users plus current user
    const followingIds = (
      await prisma.follower.findMany({
        where: { FollowerUserID: userId, Status: "ACCEPTED" },
        select: { UserID: true },
      })
    ).map((f) => f.UserID);
    followingIds.push(userId);

    // Fetch posts with privacy considerations
    const posts = await prisma.post.findMany({
      skip: offset,
      take: parseInt(limit),
      where: {
        UserID: { in: followingIds },
        User: { OR: [{ IsPrivate: false }, { UserID: userId }] },
      },
      orderBy: { CreatedAt: "desc" },
      include: {
        User: {
          select: {
            UserID: true,
            Username: true,
            ProfilePicture: true,
            IsPrivate: true,
          },
        },
        Likes: { where: { UserID: userId }, select: { UserID: true } },
        _count: { select: { Likes: true, Comments: true } },
      },
    });

    // Format response with additional metadata
    const response = posts.map((post) => ({
      ...post,
      isLiked: post.Likes.length > 0,
      likeCount: post._count.Likes,
      commentCount: post._count.Comments,
    }));

    // Cache the response
    await redis.set(cacheKey, response, POST_CACHE_TTL);
    res.json(response);
  } catch (error) {
    handleServerError(res, error, "Failed to fetch posts");
  }
};

/**
 * Gets single post with privacy checks
  - Validates post visibility
  - Handles private account access
  - Returns post with engagement metrics
 */
const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.UserID;

    const post = await prisma.post.findUnique({
      where: { PostID: parseInt(postId) },
      include: {
        User: {
          select: {
            UserID: true,
            Username: true,
            ProfilePicture: true,
            IsPrivate: true,
          },
        },
        Likes: { where: { UserID: userId }, select: { UserID: true } },
        _count: { select: { Likes: true, Comments: true } },
      },
    });

    if (!post) return res.status(404).json({ error: "Post not found" });

    // Privacy check for private accounts
    if (post.User.IsPrivate && post.User.UserID !== userId) {
      const isFollowing = await prisma.follower.count({
        where: { UserID: post.User.UserID, FollowerUserID: userId },
      });
      if (!isFollowing)
        return res.status(403).json({ error: "Private account" });
    }

    // Format response and remove internal fields
    const response = {
      ...post,
      isLiked: post.Likes.length > 0,
      Likes: post._count.Likes,
      Comments: post._count.Comments,
    };
    delete response._count;
    delete response.Likes;

    res.json(response);
  } catch (error) {
    handleServerError(res, error, "Failed to fetch post");
  }
};

/**
 * Updates post content with validation
  - Checks content safety
  - Clears relevant cache entries
  - Returns updated post
 */
const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.UserID;

    // Validate content if provided
    if (content && !(await LocalModeration.checkText(content))) {
      return res.status(400).json({ error: "Content violates guidelines" });
    }

    const updatedPost = await prisma.post.update({
      where: { PostID: parseInt(postId), UserID: userId },
      data: { Content: content },
      include: {
        User: {
          select: { UserID: true, Username: true, ProfilePicture: true },
        },
      },
    });

    // Clear cache for this post and all posts lists
    await redis.del("posts:*");
    await redis.del(`post:${postId}`);

    res.json(updatedPost);
  } catch (error) {
    handleServerError(res, error, "Failed to update post");
  }
};

/**
 * Deletes post and all related data
  - Uses transaction for data integrity
  - Clears cache entries
  - Creates audit log
  - Allows admin override
 */
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.UserID;
    const isAdmin = req.user.Role === "ADMIN";

    // Perform all deletions in a single transaction
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { PostID: parseInt(postId) } }),
      prisma.like.deleteMany({ where: { PostID: parseInt(postId) } }),
      prisma.savedPost.deleteMany({ where: { PostID: parseInt(postId) } }),
      prisma.report.deleteMany({ where: { PostID: parseInt(postId) } }),
      prisma.post.delete({
        where: {
          PostID: parseInt(postId),
          ...(isAdmin ? {} : { UserID: userId }),
        },
      }),
      prisma.auditLog.create({
        data: {
          action: "DELETE_POST",
          userId: userId,
          details: JSON.stringify({ postId, deletedByAdmin: isAdmin }),
        },
      }),
    ]);

    // Clear relevant cache
    await redis.del("posts:*");
    await redis.del(`post:${postId}`);

    res.json({ success: true });
  } catch (error) {
    handleServerError(res, error, "Failed to delete post");
  }
};

/**
 * Toggles like status on a post
  - Handles like/unlike actions
  - Creates notifications
  - Updates cache
 */
const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.UserID;

    // Verify post exists
    const postExists = await prisma.post.count({
      where: { PostID: parseInt(postId) },
    });
    if (!postExists) return res.status(404).json({ error: "Post not found" });

    // Check existing like status
    const existingLike = await prisma.like.findFirst({
      where: { PostID: parseInt(postId), UserID: userId },
    });

    if (existingLike) {
      await prisma.like.delete({ where: { LikeID: existingLike.LikeID } });
    } else {
      await prisma.like.create({
        data: { PostID: parseInt(postId), UserID: userId },
      });
      createLikeNotification(postId, userId).catch(console.error);
    }

    // Invalidate cache
    await redis.del(`post:${postId}`);
    await redis.del("posts:*");

    res.json({ success: true, action: existingLike ? "unliked" : "liked" });
  } catch (error) {
    handleServerError(res, error, "Failed to toggle like");
  }
};

/**
 * Adds comment to a post
  - Validates comment content
  - Creates notifications for post owner
  - Updates cache
 */
const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.UserID;

    // Validate comment content
    if (!(await LocalModeration.checkText(content))) {
      return res.status(400).json({ error: "Comment violates guidelines" });
    }

    const post = await prisma.post.findUnique({
      where: { PostID: parseInt(postId) },
      select: { UserID: true },
    });
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = await prisma.comment.create({
      data: { PostID: parseInt(postId), UserID: userId, Content: content },
      include: {
        User: {
          select: { UserID: true, Username: true, ProfilePicture: true },
        },
      },
    });

    // Notify post owner if it's not their own comment
    if (post.UserID !== userId) {
      createCommentNotification(postId, userId, post.UserID).catch(
        console.error
      );
    }

    // Invalidate cache for this post
    await redis.del(`post:${postId}`);

    res.status(201).json(comment);
  } catch (error) {
    handleServerError(res, error, "Failed to add comment");
  }
};

/**
 * Toggles save status on a post
  - Handles save/unsave actions
  - Returns current save status
 */
const savePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.UserID;

    // Verify post exists
    const postExists = await prisma.post.count({
      where: { PostID: parseInt(postId) },
    });
    if (!postExists) return res.status(404).json({ error: "Post not found" });

    // Check existing save status
    const existingSave = await prisma.savedPost.findFirst({
      where: { PostID: parseInt(postId), UserID: userId },
    });

    if (existingSave) {
      await prisma.savedPost.delete({
        where: { SavedPostID: existingSave.SavedPostID },
      });
    } else {
      await prisma.savedPost.create({
        data: { PostID: parseInt(postId), UserID: userId },
      });
    }

    res.json({ success: true, action: existingSave ? "unsaved" : "saved" });
  } catch (error) {
    handleServerError(res, error, "Failed to toggle save");
  }
};

/**
 * Reports a post to admins
  - Validates post exists
  - Prevents duplicate reports
  - Notifies all admins
 */
const reportPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;
    const userId = req.user.UserID;

    const post = await prisma.post.findUnique({
      where: { PostID: parseInt(postId) },
      select: { UserID: true },
    });
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Prevent duplicate reports
    const existingReport = await prisma.report.findFirst({
      where: { PostID: parseInt(postId), UserID: userId },
    });
    if (existingReport) {
      return res.status(400).json({ error: "Post already reported" });
    }

    await prisma.report.create({
      data: { PostID: parseInt(postId), UserID: userId, Reason: reason },
    });

    // Notify all admin users
    notifyAdminsAboutReport(postId, userId, reason).catch(console.error);

    res.json({ success: true });
  } catch (error) {
    handleServerError(res, error, "Failed to report post");
  }
};

/**
 * Creates a like notification for post owner
 * @param {number} postId - The ID of the post being liked
 * @param {number} likerId - The ID of the user who liked the post
 */
async function createLikeNotification(postId, likerId) {
  const post = await prisma.post.findUnique({
    where: { PostID: parseInt(postId) },
    select: { UserID: true },
  });

  // Only notify if the liker is not the post owner
  if (post && post.UserID !== likerId) {
    await prisma.notification.create({
      data: {
        UserID: post.UserID,
        Type: "LIKE",
        Content: JSON.stringify({ postId, userId: likerId }),
      },
    });
  }
}

/**
 * Creates a comment notification for post owner
 * @param {number} postId - The ID of the commented post
 * @param {number} commenterId - The ID of the commenter
 * @param {number} postOwnerId - The ID of the post owner
 */
async function createCommentNotification(postId, commenterId, postOwnerId) {
  await prisma.notification.create({
    data: {
      UserID: postOwnerId,
      Type: "COMMENT",
      Content: JSON.stringify({ postId, userId: commenterId }),
    },
  });
}

/**
 * Notifies all admin users about a reported post
 * @param {number} postId - The ID of the reported post
 * @param {number} reporterId - The ID of the reporting user
 * @param {string} reason - The reason for the report
 */
async function notifyAdminsAboutReport(postId, reporterId, reason) {
  const admins = await prisma.user.findMany({
    where: { Role: "ADMIN" },
    select: { UserID: true },
  });

  await Promise.all(
    admins.map((admin) =>
      prisma.notification.create({
        data: {
          UserID: admin.UserID,
          Type: "REPORT",
          Content: JSON.stringify({ postId, reporterId, reason }),
        },
      })
    )
  );
}

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  addComment,
  savePost,
  reportPost,
};
