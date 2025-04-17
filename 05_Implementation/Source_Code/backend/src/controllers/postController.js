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
 * Creates a new post with moderation
 * Supports text and media content
 */
const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const mediaFile = req.file;
    const userId = req.user.UserID;

    // Validate content or media presence
    if (!content && !mediaFile) {
      return res
        .status(400)
        .json({ error: "Either content or media is required" });
    }

    // Check content safety
    if (content && !(await LocalModeration.checkText(content))) {
      return res.status(400).json({ error: "Content violates guidelines" });
    }

    let mediaUrl = null,
      isImage = false,
      isVideo = false;

    // Handle media upload
    if (mediaFile) {
      const uploadResult = await uploadToCloud(mediaFile.buffer, {
        folder: "posts",
        resource_type: "auto",
      });

      mediaUrl = uploadResult.secure_url || uploadResult;

      // Determine media type
      const fileExt = mediaFile.originalname.split(".").pop().toLowerCase();
      isImage =
        ALLOWED_IMAGE_TYPES.includes(fileExt) ||
        mediaFile.mimetype.startsWith("image/");
      isVideo =
        ALLOWED_VIDEO_TYPES.includes(fileExt) ||
        mediaFile.mimetype.startsWith("video/");
    }

    // Create post
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
    handleServerError(res, error, "Failed to create post");
  }
};

/**
 * Fetches recent posts from followed users in random order
 * Respects privacy settings for private accounts
 */
const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.UserID;

    // Check cache
    const cacheKey = `posts:${userId}:${page}:${limit}`;
    const cachedPosts = await redis.get(cacheKey);
    if (cachedPosts) {
      console.log(`Cache hit for ${cacheKey}`);
      return res.json(cachedPosts);
    }
    console.log(`Cache miss for ${cacheKey}`);

    // Get followed users with accepted follow status
    const following = await prisma.follower.findMany({
      where: {
        FollowerUserID: userId,
        Status: "ACCEPTED",
      },
      select: {
        UserID: true,
        User: {
          select: {
            IsPrivate: true,
          },
        },
      },
    });

    const followingIds = following.map((f) => f.UserID);

    if (followingIds.length === 0) {
      await redis.set(cacheKey, [], POST_CACHE_TTL);
      return res.json([]);
    }

    // Fetch recent posts (within last 7 days) from followed users
    const posts = await prisma.post.findMany({
      skip: offset,
      take: parseInt(limit) * 2, // Fetch extra to allow shuffling
      where: {
        UserID: { in: followingIds },
        CreatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
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
        Likes: {
          where: { UserID: { in: followingIds } },
          take: 3,
          orderBy: { CreatedAt: "desc" },
          include: {
            User: {
              select: {
                Username: true,
                ProfilePicture: true,
              },
            },
          },
        },
        _count: { select: { Likes: true, Comments: true } },
      },
    });

    // Filter posts to respect private accounts (already ensured by followingIds)
    const filteredPosts = posts.filter((post) => {
      return !post.User.IsPrivate || followingIds.includes(post.User.UserID);
    });

    // Shuffle posts randomly
    const shuffledPosts = filteredPosts
      .map((post) => ({ post, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ post }) => post)
      .slice(0, parseInt(limit)); // Take only requested limit

    // Format response
    const response = shuffledPosts.map((post) => ({
      ...post,
      isLiked: post.Likes.some((like) => like.UserID === userId),
      likeCount: post._count.Likes,
      commentCount: post._count.Comments,
      likedBy: post.Likes.map((like) => ({
        username: like.User.Username,
        profilePicture: like.User.ProfilePicture,
      })),
    }));

    // Cache response
    try {
      await redis.set(cacheKey, response, POST_CACHE_TTL);
      console.log(`Cached posts for ${cacheKey}`);
    } catch (cacheError) {
      console.error(
        `Failed to cache posts for ${cacheKey}:`,
        cacheError.message
      );
    }

    res.json(response);
  } catch (error) {
    handleServerError(res, error, "Failed to fetch posts");
  }
};

/**
 * Fetches a single post
 * Includes privacy checks
 */
const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.UserID;

    // Fetch post with details
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
        Comments: {
          select: {
            CommentID: true,
            Content: true,
            CreatedAt: true,
            User: {
              select: {
                UserID: true,
                Username: true,
                ProfilePicture: true,
              },
            },
          },
          orderBy: { CreatedAt: "desc" },
        },
        _count: { select: { Likes: true, Comments: true } },
      },
    });

    if (!post) return res.status(404).json({ error: "Post not found" });

    // Verify privacy for private accounts
    if (post.User.IsPrivate && post.User.UserID !== userId) {
      const isFollowing = await prisma.follower.count({
        where: {
          UserID: post.User.UserID,
          FollowerUserID: userId,
          Status: "ACCEPTED",
        },
      });
      if (!isFollowing)
        return res.status(403).json({ error: "Private account" });
    }

    // Format response
    const response = {
      ...post,
      isLiked: post.Likes.length > 0,
      likeCount: post._count.Likes,
      commentCount: post._count.Comments,
      comments: post.Comments.map((comment) => ({
        commentId: comment.CommentID,
        content: comment.Content,
        createdAt: comment.CreatedAt,
        user: {
          userId: comment.User.UserID,
          username: comment.User.Username,
          profilePicture: comment.User.ProfilePicture,
        },
      })),
    };
    delete response._count;
    delete response.Likes;
    delete response.Comments;

    res.json(response);
  } catch (error) {
    handleServerError(res, error, "Failed to fetch post");
  }
};

/**
 * Updates post content
 * Validates content safety and restricts for private accounts
 */
const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.UserID;

    // Check content safety
    if (content && !(await LocalModeration.checkText(content))) {
      return res.status(400).json({ error: "Content violates guidelines" });
    }

    // Verify post exists and get owner details
    const post = await prisma.post.findUnique({
      where: { PostID: parseInt(postId) },
      select: {
        UserID: true,
        User: {
          select: {
            IsPrivate: true,
            Username: true,
          },
        },
      },
    });

    if (!post) return res.status(404).json({ error: "Post not found" });

    // Check access for private accounts
    if (post.User.IsPrivate && post.UserID !== userId) {
      const isFollowing = await prisma.follower.count({
        where: {
          UserID: post.UserID,
          FollowerUserID: userId,
          Status: "ACCEPTED",
        },
      });
      if (!isFollowing) {
        return res.status(403).json({
          error: "Private account",
          message: `You must follow @${post.User.Username} to update their posts`,
        });
      }
    }

    // Ensure only the post owner can update
    if (post.UserID !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to update this post" });
    }

    // Update post
    const updatedPost = await prisma.post.update({
      where: { PostID: parseInt(postId) },
      data: { Content: content },
      include: {
        User: {
          select: { UserID: true, Username: true, ProfilePicture: true },
        },
      },
    });

    // Clear cache
    await redis.del("posts:*");
    await redis.del(`post:${postId}`);

    res.json(updatedPost);
  } catch (error) {
    handleServerError(res, error, "Failed to update post");
  }
};

/**
 * Deletes a post and related data
 * Only allows the post owner to delete
 */
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.UserID;

    // Validate postId
    if (!postId || isNaN(parseInt(postId))) {
      console.log(`Invalid postId received: ${postId}`);
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const parsedPostId = parseInt(postId);
    console.log(`Attempting to delete post ${parsedPostId} by user ${userId}`);

    // Verify post exists and get owner details
    const post = await prisma.post.findUnique({
      where: { PostID: parsedPostId },
      select: {
        UserID: true,
        User: {
          select: {
            Username: true,
          },
        },
      },
    });

    if (!post) {
      console.log(`Post ${parsedPostId} not found`);
      return res.status(404).json({ error: "Post not found" });
    }

    // Validate user is the post owner
    if (post.UserID !== userId) {
      console.log(
        `User ${userId} is not authorized to delete post ${parsedPostId}`
      );
      return res
        .status(403)
        .json({ error: "Only the post owner can delete this post" });
    }

    // Delete post and related data in a transaction
    console.log(`Deleting post ${parsedPostId} and related data`);
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { PostID: parsedPostId } }),
      prisma.like.deleteMany({ where: { PostID: parsedPostId } }),
      prisma.savedPost.deleteMany({ where: { PostID: parsedPostId } }),
      prisma.report.deleteMany({ where: { PostID: parsedPostId } }),
      prisma.post.delete({
        where: { PostID: parsedPostId },
      }),
      prisma.auditLog.create({
        data: {
          Action: "DELETE_POST",
          UserID: userId,
          Details: JSON.stringify({
            postId: parsedPostId,
            deletedBy: "owner",
          }),
        },
      }),
    ]);

    // Clear cache
    console.log(`Clearing cache for post ${parsedPostId}`);
    await redis.del("posts:*");
    await redis.del(`post:${parsedPostId}`);

    res.json({ success: true });
  } catch (error) {
    console.error(`Error deleting post ${postId || "unknown"}:`, error);
    handleServerError(res, error, "Failed to delete post");
  }
};

/**
 * Toggles like status on a post
 * Creates notifications, restricts for private accounts
 */
const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.UserID;

    // Verify post exists and get owner details
    const post = await prisma.post.findUnique({
      where: { PostID: parseInt(postId) },
      select: {
        UserID: true,
        User: {
          select: {
            IsPrivate: true,
            Username: true,
          },
        },
      },
    });

    if (!post) return res.status(404).json({ error: "Post not found" });

    // Check access for private accounts
    console.log(
      `Checking privacy for like on post ${postId} by user ${userId}`
    );
    if (post.User.IsPrivate && post.UserID !== userId) {
      const isFollowing = await prisma.follower.count({
        where: {
          UserID: post.UserID,
          FollowerUserID: userId,
          Status: "ACCEPTED",
        },
      });
      console.log(`Is user ${userId} following ${post.UserID}? ${isFollowing}`);
      if (!isFollowing) {
        return res.status(403).json({
          error: "Private account",
          message: `You must follow @${post.User.Username} to like their posts`,
        });
      }
    }

    // Toggle like
    const existingLike = await prisma.like.findFirst({
      where: { PostID: parseInt(postId), UserID: userId },
    });

    if (existingLike) {
      await prisma.like.delete({ where: { LikeID: existingLike.LikeID } });
    } else {
      await prisma.like.create({
        data: { PostID: parseInt(postId), UserID: userId },
      });
      await createLikeNotification(postId, userId, req.user.Username);
    }

    // Clear cache
    await redis.del(`post:${postId}`);
    await redis.del("posts:*");

    res.json({ success: true, action: existingLike ? "unliked" : "liked" });
  } catch (error) {
    handleServerError(res, error, "Failed to toggle like");
  }
};

/**
 * Adds a comment to a post
 * Notifies post owner, restricts for private accounts
 */
const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.UserID;

    // Check comment safety
    if (!(await LocalModeration.checkText(content))) {
      return res.status(400).json({ error: "Comment violates guidelines" });
    }

    // Verify post exists and get owner details
    const post = await prisma.post.findUnique({
      where: { PostID: parseInt(postId) },
      select: {
        UserID: true,
        User: {
          select: {
            IsPrivate: true,
            Username: true,
          },
        },
      },
    });

    if (!post) return res.status(404).json({ error: "Post not found" });

    // Check access for private accounts
    console.log(
      `Checking privacy for comment on post ${postId} by user ${userId}`
    );
    if (post.User.IsPrivate && post.UserID !== userId) {
      const isFollowing = await prisma.follower.count({
        where: {
          UserID: post.UserID,
          FollowerUserID: userId,
          Status: "ACCEPTED",
        },
      });
      console.log(`Is user ${userId} following ${post.UserID}? ${isFollowing}`);
      if (!isFollowing) {
        return res.status(403).json({
          error: "Private account",
          message: `You must follow @${post.User.Username} to comment on their posts`,
        });
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: { PostID: parseInt(postId), UserID: userId, Content: content },
      include: {
        User: {
          select: { UserID: true, Username: true, ProfilePicture: true },
        },
      },
    });

    // Notify post owner
    if (post.UserID !== userId) {
      await createCommentNotification(
        postId,
        userId,
        post.UserID,
        req.user.Username
      );
    }

    // Clear cache
    await redis.del(`post:${postId}`);

    res.status(201).json(comment);
  } catch (error) {
    handleServerError(res, error, "Failed to add comment");
  }
};

/**
 * Toggles save status on a post
 * Restricts for private accounts
 */
const savePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.UserID;

    // Verify post exists and get owner details
    const post = await prisma.post.findUnique({
      where: { PostID: parseInt(postId) },
      select: {
        UserID: true,
        User: {
          select: {
            IsPrivate: true,
            Username: true,
          },
        },
      },
    });

    if (!post) return res.status(404).json({ error: "Post not found" });

    // Check access for private accounts
    console.log(
      `Checking privacy for save on post ${postId} by user ${userId}`
    );
    if (post.User.IsPrivate && post.UserID !== userId) {
      const isFollowing = await prisma.follower.count({
        where: {
          UserID: post.UserID,
          FollowerUserID: userId,
          Status: "ACCEPTED",
        },
      });
      console.log(`Is user ${userId} following ${post.UserID}? ${isFollowing}`);
      if (!isFollowing) {
        return res.status(403).json({
          error: "Private account",
          message: `You must follow @${post.User.Username} to save their posts`,
        });
      }
    }

    // Toggle save
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
 * Prevents duplicate reports
 */
const reportPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;
    const userId = req.user.UserID;

    // Validate post ID
    const parsedPostId = parseInt(postId);
    if (isNaN(parsedPostId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    // Fetch post with owner details
    const post = await prisma.post.findUnique({
      where: { PostID: parsedPostId },
      select: {
        PostID: true,
        UserID: true,
        User: {
          select: {
            IsPrivate: true,
            Username: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check access for private accounts
    const isOwner = userId === post.UserID;
    let hasAccess = !post.User.IsPrivate || isOwner;

    if (post.User.IsPrivate && !isOwner) {
      const followRelationship = await prisma.follower.findFirst({
        where: {
          UserID: post.UserID,
          FollowerUserID: userId,
          Status: "ACCEPTED",
        },
      });
      hasAccess = followRelationship !== null;
    }

    if (!hasAccess) {
      return res.status(403).json({
        error: "Private account",
        message: `You must follow @${post.User.Username} to report their posts`,
      });
    }

    // Prevent duplicate reports
    const existingReport = await prisma.report.findFirst({
      where: {
        PostID: parsedPostId,
        ReporterID: userId,
      },
    });

    if (existingReport) {
      return res
        .status(400)
        .json({ error: "You have already reported this post" });
    }

    // Validate reason
    if (!reason || typeof reason !== "string" || reason.trim() === "") {
      return res.status(400).json({ error: "Reason is required" });
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        PostID: parsedPostId,
        ReporterID: userId,
        Reason: reason.trim(),
        Status: "PENDING",
      },
    });

    // Notify admins
    await notifyAdminsAboutReport(
      parsedPostId,
      userId,
      reason.trim(),
      req.user.Username
    );

    res.status(201).json({
      message: "Post reported successfully",
      reportId: report.ReportID,
    });
  } catch (error) {
    handleServerError(res, error, "Failed to report post");
  }
};

/**
 * Creates notification for post like
 */
async function createLikeNotification(postId, likerId, likerUsername) {
  const post = await prisma.post.findUnique({
    where: { PostID: parseInt(postId) },
    select: { UserID: true },
  });

  if (!post || post.UserID === likerId) return;

  // Check recipient's notification preferences
  const recipient = await prisma.user.findUnique({
    where: { UserID: post.UserID },
    select: { NotificationPreferences: true },
  });

  const shouldNotify =
    !recipient.NotificationPreferences ||
    !recipient.NotificationPreferences.NotificationTypes ||
    recipient.NotificationPreferences.NotificationTypes.includes("LIKE");

  if (shouldNotify) {
    await prisma.notification.create({
      data: {
        UserID: post.UserID,
        SenderID: likerId,
        Type: "LIKE",
        Content: `${likerUsername} liked your post`,
        Metadata: {
          postId: parseInt(postId),
          likerId,
          likerUsername,
        },
      },
    });
  }
}

/**
 * Creates notification for post comment
 */
async function createCommentNotification(
  postId,
  commenterId,
  postOwnerId,
  commenterUsername
) {
  // Check recipient's notification preferences
  const recipient = await prisma.user.findUnique({
    where: { UserID: postOwnerId },
    select: { NotificationPreferences: true },
  });

  const shouldNotify =
    !recipient.NotificationPreferences ||
    !recipient.NotificationPreferences.NotificationTypes ||
    recipient.NotificationPreferences.NotificationTypes.includes("COMMENT");

  if (shouldNotify) {
    await prisma.notification.create({
      data: {
        UserID: postOwnerId,
        SenderID: commenterId,
        Type: "COMMENT",
        Content: `${commenterUsername} commented on your post`,
        Metadata: {
          postId: parseInt(postId),
          commenterId,
          commenterUsername,
        },
      },
    });
  }
}

/**
 * Notifies admins about reported post
 */
async function notifyAdminsAboutReport(
  postId,
  reporterId,
  reason,
  reporterUsername
) {
  const admins = await prisma.user.findMany({
    where: { Role: "ADMIN" },
    select: { UserID: true, NotificationPreferences: true },
  });

  await Promise.all(
    admins.map((admin) => {
      const shouldNotify =
        !admin.NotificationPreferences ||
        !admin.NotificationPreferences.NotificationTypes ||
        admin.NotificationPreferences.NotificationTypes.includes("REPORT");

      if (shouldNotify) {
        return prisma.notification.create({
          data: {
            UserID: admin.UserID,
            SenderID: reporterId,
            Type: "REPORT",
            Content: `${reporterUsername} reported a post: ${reason}`,
            Metadata: {
              postId,
              reporterId,
              reason,
              reporterUsername,
            },
          },
        });
      }
    })
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
