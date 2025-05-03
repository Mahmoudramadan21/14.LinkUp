const logger = require("../utils/logger");
const prisma = require("../utils/prisma");
const redis = require("../utils/redis");
const { v4: uuidv4 } = require("uuid");
const { uploadToCloud } = require("../services/cloudService");
const { handleServerError } = require("../utils/errorHandler");

// Constants for configuration
const POST_CACHE_TTL = 300; // 5 minutes cache duration
const ALLOWED_IMAGE_TYPES = ["jpg", "jpeg", "png", "gif", "webp"];
const ALLOWED_VIDEO_TYPES = ["mp4", "mov", "avi", "mkv", "webm"];

/**
 * Creates a new post with moderation
 * Supports text, image, and video content
 */
const createPost = async (req, res) => {
  const { content } = req.body;
  const userId = req.user.UserID;
  const imageFile = req.file; // Assuming multer is used for file uploads

  try {
    // Fetch user's IsPrivate status
    const user = await prisma.user.findUnique({
      where: { UserID: userId },
      select: { IsPrivate: true },
    });

    // Upload image or video to Cloudinary (if provided)
    let imageUrl = null;
    let videoUrl = null;
    if (imageFile) {
      // Combine ALLOWED_IMAGE_TYPES and ALLOWED_VIDEO_TYPES
      const ALLOWED_MEDIA_TYPES = [
        ...ALLOWED_IMAGE_TYPES,
        ...ALLOWED_VIDEO_TYPES,
      ];
      logger.info(
        `Uploading media: ${imageFile.mimetype}, size: ${
          imageFile.size
        }, allowed formats: ${ALLOWED_MEDIA_TYPES.join(", ")}`
      );
      const uploadResult = await uploadToCloud(imageFile.buffer, {
        folder: "posts",
        resource_type: "auto",
        allowed_formats: ALLOWED_MEDIA_TYPES,
      });

      // Determine if the uploaded file is an image or video
      if (uploadResult.resource_type === "video") {
        videoUrl = uploadResult.secure_url;
        logger.info(`Video uploaded successfully: ${videoUrl}`);
      } else {
        imageUrl = uploadResult.secure_url;
        logger.info(`Image uploaded successfully: ${imageUrl}`);
      }
    }

    // Create post with privacy based on user's IsPrivate status
    const post = await prisma.post.create({
      data: {
        UserID: userId,
        Content: content,
        ImageURL: imageUrl,
        VideoURL: videoUrl,
        privacy: user.IsPrivate ? "FOLLOWERS_ONLY" : "PUBLIC",
      },
      include: {
        User: {
          select: {
            UserID: true,
            Username: true,
            ProfilePicture: true,
            IsPrivate: true,
          },
        },
      },
    });

    logger.info(
      `Post created successfully: PostID ${post.PostID} by UserID ${userId}`
    );
    res.status(201).json({
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    logger.error(`Error creating post: ${error.message}`);
    res.status(500).json({
      message: "Error creating post",
      error: error.message,
    });
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
      logger.info(`Cache hit for posts: ${cacheKey}`);
      return res.json(cachedPosts); // Already parsed by redis.get
    }
    logger.info(`Cache miss for posts: ${cacheKey}`);

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
      logger.info(
        `No followed users for user ${userId}, returning empty posts`
      );
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

    // Filter posts to respect private accounts
    const filteredPosts = posts.filter(
      (post) => !post.User.IsPrivate || followingIds.includes(post.User.UserID)
    );

    // Shuffle posts randomly
    const shuffledPosts = filteredPosts
      .map((post) => ({ post, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ post }) => post)
      .slice(0, parseInt(limit));

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
    await redis.set(cacheKey, response, POST_CACHE_TTL);
    logger.info(`Cached posts for ${cacheKey}`);

    res.json(response);
  } catch (error) {
    logger.error(
      `Error fetching posts for user ${req.user.UserID}: ${error.message}`
    );
    handleServerError(res, error, "Failed to fetch posts");
  }
};

/**
 * Fetches a single post
 * Includes privacy checks
 */
const getPostById = async (req, res) => {
  const { postId } = req.params;
  const viewerId = req.user ? req.user.UserID : null;

  try {
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
        Likes: { select: { UserID: true } },
        _count: { select: { Likes: true, Comments: true } },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if post is accessible based on privacy
    if (post.privacy === "FOLLOWERS_ONLY") {
      if (!viewerId) {
        return res.status(403).json({ message: "Authentication required" });
      }
      const isFollower = await prisma.follower.findFirst({
        where: {
          FollowerUserID: viewerId,
          FollowingUserID: post.UserID,
          Status: "ACCEPTED",
        },
      });
      if (!isFollower && viewerId !== post.UserID) {
        return res.status(403).json({ message: "Post is private" });
      }
    }

    // Add computed fields
    post.isLiked = viewerId
      ? post.Likes.some((like) => like.UserID === viewerId)
      : false;
    post.likeCount = post._count.Likes;
    post.commentCount = post._count.Comments;
    post.likedBy = post.Likes.map((like) => like.UserID);

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving post",
      error: error.message,
    });
  }
};

/**
 * Updates post content
 * Validates content safety via middleware
 * Restricts for private accounts
 */
const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
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

    if (!post) {
      logger.info(`Post ${postId} not found for update by user ${userId}`);
      return res.status(404).json({ error: "Post not found" });
    }

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
        logger.info(
          `User ${userId} denied access to update private post ${postId}`
        );
        return res.status(403).json({
          error: "Private account",
          message: `You must follow @${post.User.Username} to update their posts`,
        });
      }
    }

    // Ensure only the post owner can update
    if (post.UserID !== userId) {
      logger.info(`User ${userId} unauthorized to update post ${postId}`);
      return res
        .status(403)
        .json({ error: "Unauthorized to update this post" });
    }

    // Update post
    const updatedPost = await prisma.post.update({
      where: { PostID: parseInt(postId) },
      data: { Content: content || null },
      include: {
        User: {
          select: { UserID: true, Username: true, ProfilePicture: true },
        },
      },
    });

    // Clear cache
    await redis.del("posts:*");
    await redis.del(`post:${postId}`);
    logger.info(`Post ${postId} updated successfully by user ${userId}`);

    res.json(updatedPost);
  } catch (error) {
    logger.error(`Error updating post ${req.params.postId}: ${error.message}`);
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
      logger.info(`Invalid postId received: ${postId} by user ${userId}`);
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const parsedPostId = parseInt(postId);
    logger.info(`Attempting to delete post ${parsedPostId} by user ${userId}`);

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
      logger.info(
        `Post ${parsedPostId} not found for deletion by user ${userId}`
      );
      return res.status(404).json({ error: "Post not found" });
    }

    // Validate user is the post owner
    if (post.UserID !== userId) {
      logger.info(`User ${userId} unauthorized to delete post ${parsedPostId}`);
      return res
        .status(403)
        .json({ error: "Only the post owner can delete this post" });
    }

    // Delete post and related data in a transaction
    logger.info(`Deleting post ${parsedPostId} and related data`);
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
    logger.info(`Clearing cache for post ${parsedPostId}`);
    await redis.del("posts:*");
    await redis.del(`post:${parsedPostId}`);

    res.json({ success: true });
  } catch (error) {
    logger.error(
      `Error deleting post ${req.params.postId || "unknown"}: ${error.message}`
    );
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

    if (!post) {
      logger.info(`Post ${postId} not found for like by user ${userId}`);
      return res.status(404).json({ error: "Post not found" });
    }

    // Check access for private accounts
    logger.info(
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
      logger.info(`Is user ${userId} following ${post.UserID}? ${isFollowing}`);
      if (!isFollowing) {
        logger.info(
          `User ${userId} denied access to like private post ${postId}`
        );
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
      logger.info(`User ${userId} unliked post ${postId}`);
    } else {
      await prisma.like.create({
        data: { PostID: parseInt(postId), UserID: userId },
      });
      await createLikeNotification(postId, userId, req.user.Username);
      logger.info(`User ${userId} liked post ${postId}`);
    }

    // Clear cache
    await redis.del(`post:${postId}`);
    await redis.del("posts:*");

    res.json({ success: true, action: existingLike ? "unliked" : "liked" });
  } catch (error) {
    logger.error(
      `Error toggling like for post ${req.params.postId}: ${error.message}`
    );
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

    if (!post) {
      logger.info(`Post ${postId} not found for comment by user ${userId}`);
      return res.status(404).json({ error: "Post not found" });
    }

    // Check access for private accounts
    logger.info(
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
      logger.info(`Is user ${userId} following ${post.UserID}? ${isFollowing}`);
      if (!isFollowing) {
        logger.info(
          `User ${userId} denied access to comment on private post ${postId}`
        );
        return res.status(403).json({
          error: "Private account",
          message: `You must follow @${post.User.Username} to comment on their posts`,
        });
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        PostID: parseInt(postId),
        UserID: userId,
        Content: content || null,
      },
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
      logger.info(
        `Notification sent for comment on post ${postId} by user ${userId}`
      );
    }

    // Clear cache
    await redis.del(`post:${postId}`);
    logger.info(
      `Comment added successfully to post ${postId} by user ${userId}`
    );

    res.status(201).json(comment);
  } catch (error) {
    logger.error(
      `Error adding comment to post ${req.params.postId}: ${error.message}`
    );
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

    if (!post) {
      logger.info(`Post ${postId} not found for save by user ${userId}`);
      return res.status(404).json({ error: "Post not found" });
    }

    // Check access for private accounts
    logger.info(
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
      logger.info(`Is user ${userId} following ${post.UserID}? ${isFollowing}`);
      if (!isFollowing) {
        logger.info(
          `User ${userId} denied access to save private post ${postId}`
        );
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
      logger.info(`User ${userId} unsaved post ${postId}`);
    } else {
      await prisma.savedPost.create({
        data: { PostID: parseInt(postId), UserID: userId },
      });
      logger.info(`User ${userId} saved post ${postId}`);
    }

    res.json({ success: true, action: existingSave ? "unsaved" : "saved" });
  } catch (error) {
    logger.error(
      `Error toggling save for post ${req.params.postId}: ${error.message}`
    );
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
      logger.info(`Invalid postId ${postId} for report by user ${userId}`);
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
      logger.info(
        `Post ${parsedPostId} not found for report by user ${userId}`
      );
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
      logger.info(
        `User ${userId} denied access to report private post ${parsedPostId}`
      );
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
      logger.info(`User ${userId} already reported post ${parsedPostId}`);
      return res
        .status(400)
        .json({ error: "You have already reported this post" });
    }

    // Validate reason
    if (!reason || typeof reason !== "string" || reason.trim() === "") {
      logger.info(
        `Invalid reason for report on post ${parsedPostId} by user ${userId}`
      );
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
    logger.info(`Post ${parsedPostId} reported successfully by user ${userId}`);

    res.status(201).json({
      message: "Post reported successfully",
      reportId: report.ReportID,
    });
  } catch (error) {
    logger.error(`Error reporting post ${req.params.postId}: ${error.message}`);
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
    logger.info(
      `Like notification created for post ${postId} by user ${likerId}`
    );
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
    logger.info(
      `Comment notification created for post ${postId} by user ${commenterId}`
    );
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
  logger.info(
    `Admins notified about report on post ${postId} by user ${reporterId}`
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
