const prisma = require("../utils/prisma");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const cloudinary = require("cloudinary").v2;
const {
  setWithTracking,
  get,
  del,
  clearUserCache,
} = require("../utils/redisUtils");

// Salt rounds for password hashing - recommended value
const SALT_ROUNDS = 10;

/**
 * Fisher-Yates Shuffle algorithm to randomize an array in place
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Retrieves user profile with counts and additional details
 * Returns 404 if user not found
 */
const getProfile = async (req, res) => {
  const userId = req.user.UserID;

  try {
    const user = await prisma.user.findUnique({
      where: { UserID: userId },
      select: {
        UserID: true,
        Username: true,
        Email: true,
        ProfilePicture: true,
        CoverPicture: true,
        Bio: true,
        Address: true,
        JobTitle: true,
        DateOfBirth: true,
        IsPrivate: true,
        Role: true,
        CreatedAt: true,
        UpdatedAt: true,
        ProfileName: true,
        _count: {
          select: {
            Posts: true,
            Likes: true,
            Followers: { where: { Status: "ACCEPTED" } },
            Following: { where: { Status: "ACCEPTED" } },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Format response with counts
    const response = {
      userId: user.UserID,
      username: user.Username,
      email: user.Email,
      profilePicture: user.ProfilePicture,
      coverPicture: user.CoverPicture,
      bio: user.Bio,
      address: user.Address,
      jobTitle: user.JobTitle,
      dateOfBirth: user.DateOfBirth,
      isPrivate: user.IsPrivate,
      role: user.Role,
      createdAt: user.CreatedAt,
      updatedAt: user.UpdatedAt,
      postCount: user._count.Posts,
      followerCount: user._count.Followers,
      followingCount: user._count.Following,
      likeCount: user._count.Likes,
      profileName: user.ProfileName,
    };

    res.status(200).json({ profile: response });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching profile", error: error.message });
  }
};

/**
 * Normalizes email for uniqueness check while preserving the original email
 * Removes dots from the local part for Gmail addresses
 * @param {string} email - The email to normalize
 * @returns {string} - Normalized email for uniqueness check
 */
const normalizeEmailForCheck = (email) => {
  const [localPart, domain] = email.split("@");
  if (domain.toLowerCase().includes("gmail.com")) {
    return `${localPart.replace(/\./g, "")}@${domain.toLowerCase()}`;
  }
  return email.toLowerCase();
};

/**
 * Updates user profile with validation for duplicates and new fields
 * Supports profile and cover picture uploads
 * Returns updated profile data
 */
const updateProfile = async (req, res) => {
  const {
    username,
    email: originalEmail, // Renamed to distinguish from normalized email
    bio,
    address,
    jobTitle,
    dateOfBirth,
    isPrivate,
    firstName,
    lastName,
  } = req.body;
  const userId = req.user.UserID;
  let profilePictureUrl, coverPictureUrl;

  // Handle multiple file uploads (profilePicture and coverPicture)
  const files = req.files || {};
  const profilePictureFile = files.profilePicture
    ? files.profilePicture[0]
    : null;
  const coverPictureFile = files.coverPicture ? files.coverPicture[0] : null;

  try {
    // Fetch current user data to get the old username for cache invalidation
    const currentUser = await prisma.user.findUnique({
      where: { UserID: userId },
      select: { Username: true },
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const oldUsername = currentUser.Username;

    // Upload profile picture if provided
    if (profilePictureFile) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "profile_pictures",
            public_id: `user_${userId}_profile`,
            overwrite: true,
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(profilePictureFile.buffer);
      });
      profilePictureUrl = uploadResult.secure_url;
    }

    // Upload cover picture if provided
    if (coverPictureFile) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "cover_pictures",
            public_id: `user_${userId}_cover`,
            overwrite: true,
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(coverPictureFile.buffer);
      });
      coverPictureUrl = uploadResult.secure_url;
    }

    // Validate username uniqueness if provided
    if (username) {
      const existingUsername = await prisma.user.findFirst({
        where: {
          Username: username,
          UserID: { not: userId },
        },
      });
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    // Validate email uniqueness if provided
    if (originalEmail) {
      // Normalize email only for uniqueness check
      const normalizedEmail = normalizeEmailForCheck(originalEmail);
      const existingEmail = await prisma.user.findFirst({
        where: {
          Email: {
            in: [normalizedEmail, originalEmail], // Check both normalized and original to cover all cases
          },
          UserID: { not: userId },
        },
      });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Validate dateOfBirth if provided
    if (dateOfBirth) {
      const parsedDate = new Date(dateOfBirth);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Invalid date of birth" });
      }
    }

    // Validate isPrivate if provided
    let parsedIsPrivate;
    if (typeof isPrivate !== "undefined") {
      parsedIsPrivate = isPrivate === "true" || isPrivate === true;
      if (typeof parsedIsPrivate !== "boolean") {
        return res
          .status(400)
          .json({ message: "isPrivate must be a boolean (true or false)" });
      }
    }

    // Generate profileName from firstName and lastName if provided
    let profileName;
    if (firstName || lastName) {
      profileName = `${firstName || ""} ${lastName || ""}`.trim();
      if (profileName === "") {
        return res.status(400).json({
          message:
            "First name or last name must be provided to generate profileName",
        });
      }
    }

    // Update the user's profile, preserving the original email
    const updatedUser = await prisma.user.update({
      where: { UserID: userId },
      data: {
        Username: username,
        Email: originalEmail, // Save the original email as provided
        Bio: bio,
        Address: address,
        JobTitle: jobTitle,
        DateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        ProfilePicture: profilePictureUrl,
        CoverPicture: coverPictureUrl,
        IsPrivate: parsedIsPrivate,
        ProfileName: profileName,
      },
      select: {
        UserID: true,
        Username: true,
        Email: true,
        ProfilePicture: true,
        CoverPicture: true,
        Bio: true,
        Address: true,
        JobTitle: true,
        DateOfBirth: true,
        IsPrivate: true,
        Role: true,
        CreatedAt: true,
        UpdatedAt: true,
        ProfileName: true,
      },
    });

    // Invalidate Redis cache for both old and new username (if changed)
    const newUsername = updatedUser.Username;
    const oldCacheKey = `profile:username:${oldUsername}`;
    await del(oldCacheKey, userId?.toString());
    console.log(`Cache invalidated for old profile: ${oldCacheKey}`);

    if (oldUsername !== newUsername) {
      const newCacheKey = `profile:username:${newUsername}`;
      await del(newCacheKey, userId?.toString());
      console.log(`Cache invalidated for new profile: ${newCacheKey}`);
    }

    // Respond with the updated profile
    res.status(200).json({
      message: "Profile updated successfully",
      profile: {
        userId: updatedUser.UserID,
        username: updatedUser.Username,
        email: updatedUser.Email,
        profilePicture: updatedUser.ProfilePicture,
        coverPicture: updatedUser.CoverPicture,
        bio: updatedUser.Bio,
        address: updatedUser.Address,
        jobTitle: updatedUser.JobTitle,
        dateOfBirth: updatedUser.DateOfBirth,
        isPrivate: updatedUser.IsPrivate,
        role: updatedUser.Role,
        createdAt: updatedUser.CreatedAt,
        updatedAt: updatedUser.UpdatedAt,
        profileName: updatedUser.ProfileName,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating profile", error: error.message });
  }
};

/**
 * Changes user password after verifying old password
 * Uses bcrypt for secure password hashing
 */
const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.UserID;

  try {
    const user = await prisma.user.findUnique({ where: { UserID: userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify old password matches stored hash
    const isPasswordValid = await bcrypt.compare(oldPassword, user.Password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Hash new password with current salt rounds
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { UserID: userId },
      data: {
        Password: hashedPassword,
      },
    });

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error changing password", error: error.message });
  }
};

/**
 * Updates user privacy setting (public/private account)
 * Returns updated profile information
 */
const updatePrivacySettings = async (req, res) => {
  const { isPrivate } = req.body;
  const userId = req.user.UserID;

  try {
    const isPrivateBoolean = isPrivate === "true";

    const currentUser = await prisma.user.findUnique({
      where: { UserID: userId },
      select: { IsPrivate: true, Username: true },
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { UserID: userId },
        data: { IsPrivate: isPrivateBoolean },
        select: {
          Username: true,
          Email: true,
          ProfilePicture: true,
          Bio: true,
          IsPrivate: true,
          Role: true,
          CreatedAt: true,
          UpdatedAt: true,
        },
      }),
      prisma.post.updateMany({
        where: { UserID: userId },
        data: { privacy: isPrivateBoolean ? "FOLLOWERS_ONLY" : "PUBLIC" },
      }),
      ...(currentUser.IsPrivate && !isPrivateBoolean
        ? [
            prisma.follower.updateMany({
              where: { UserID: userId, Status: "PENDING" },
              data: { Status: "ACCEPTED", UpdatedAt: new Date() },
            }),
            prisma.notification.createMany({
              data: await prisma.follower
                .findMany({
                  where: { UserID: userId, Status: "ACCEPTED" },
                  select: { FollowerUserID: true },
                })
                .then((followers) =>
                  followers.map((follower) => ({
                    UserID: follower.FollowerUserID,
                    Type: "FOLLOW_ACCEPTED",
                    Content: `Your follow request to ${currentUser.Username} has been automatically approved.`,
                    Metadata: { FollowedUserID: userId },
                    CreatedAt: new Date(),
                  }))
                ),
            }),
          ]
        : []),
    ]);

    // Invalidate Redis caches
    await del(`posts:user:${userId}`, userId);
    await del(`followers:user:${userId}`, userId);
    const profileCacheKey = `profile:username:${currentUser.Username}`;
    await del(profileCacheKey, userId?.toString());
    console.log(`Cache invalidated for profile: ${profileCacheKey}`);

    // Emit privacy update event via Socket.IO if the instance is available
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${userId}`).emit("privacyUpdated", {
        userId,
        isPrivate: isPrivateBoolean,
        timestamp: new Date(),
      });

      if (currentUser.IsPrivate && !isPrivateBoolean) {
        const approvedFollowers = await prisma.follower.findMany({
          where: { UserID: userId, Status: "ACCEPTED" },
          select: { FollowerUserID: true },
        });
        approvedFollowers.forEach((follower) => {
          io.to(`user_${follower.FollowerUserID}`).emit("followAccepted", {
            followedUserId: userId,
            timestamp: new Date(),
          });
        });
      }
    } else {
      console.warn(
        "Socket.IO instance not found. Real-time privacy update emission skipped."
      );
    }

    res.status(200).json({
      message: "Privacy settings updated successfully",
      profile: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating privacy settings",
      error: error.message,
    });
  }
};

/**
 * Permanently deletes user account and all associated data
 * Requires authentication
 */
const deleteProfile = async (req, res) => {
  const userId = req.user.UserID;

  try {
    await prisma.user.delete({
      where: { UserID: userId },
    });

    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting profile", error: error.message });
  }
};

/**
 * Retrieves all posts by a specific user with privacy checks
 * Includes detailed post data, comments, likes, and replies
 * Similar to getPosts structure with user-specific enhancements
 */
const getUserPosts = async (req, res) => {
  try {
    console.log("getUserPosts: Starting", {
      userId: req.params.userId,
      currentUserId: req.user?.UserID,
    });
    const { userId } = req.params;
    const currentUserId = req.user?.UserID;
    const parsedUserId = parseInt(userId);

    if (isNaN(parsedUserId)) {
      console.log("getUserPosts: Invalid userId");
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    console.log("getUserPosts: Fetching user", { parsedUserId });
    const user = await prisma.user.findUnique({
      where: { UserID: parsedUserId },
      select: {
        IsPrivate: true,
        Username: true,
        UserID: true,
      },
    });

    if (!user) {
      console.log("getUserPosts: User not found");
      return res.status(404).json({ error: "User not found" });
    }

    console.log("getUserPosts: User found", { user });
    const isOwner = currentUserId === user.UserID;
    let hasAccess = !user.IsPrivate || isOwner;

    if (user.IsPrivate && !isOwner && currentUserId) {
      console.log("getUserPosts: Checking follow relationship", {
        userId: user.UserID,
        followerId: currentUserId,
      });
      const followRelationship = await prisma.follower.findFirst({
        where: {
          UserID: user.UserID,
          FollowerUserID: currentUserId,
          Status: "ACCEPTED",
        },
      });
      hasAccess = followRelationship !== null;
      console.log("getUserPosts: Follow check result", { hasAccess });
    }

    if (!hasAccess) {
      console.log("getUserPosts: Access denied");
      return res.status(403).json({
        error: "Private account",
        message: `You must follow @${user.Username} to view their posts`,
      });
    }

    console.log("getUserPosts: Fetching posts for user", {
      userId: user.UserID,
    });
    const posts = await prisma.post.findMany({
      where: {
        UserID: user.UserID,
      },
      orderBy: {
        CreatedAt: "desc",
      },
      include: {
        User: {
          select: {
            UserID: true,
            Username: true,
            ProfilePicture: true,
          },
        },
        Likes: {
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
        Comments: {
          where: { ParentCommentID: null }, // Only top-level comments
          take: 3,
          orderBy: { CreatedAt: "desc" },
          include: {
            User: {
              select: {
                Username: true,
                ProfilePicture: true,
              },
            },
            CommentLikes: {
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
            Replies: {
              take: 3,
              orderBy: { CreatedAt: "desc" },
              include: {
                User: {
                  select: {
                    Username: true,
                    ProfilePicture: true,
                  },
                },
                CommentLikes: {
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
              },
            },
            _count: { select: { CommentLikes: true, Replies: true } },
          },
        },
        _count: { select: { Likes: true, Comments: true } },
      },
    });

    console.log("getUserPosts: Posts fetched", { postCount: posts.length });

    // Fetch like status for the current user
    const postIds = posts.map((post) => post.PostID);
    const userLikes = await prisma.like.findMany({
      where: {
        PostID: { in: postIds },
        UserID: currentUserId,
      },
      select: {
        PostID: true,
      },
    });
    const likedPostIds = new Set(userLikes.map((like) => like.PostID));

    // Format response similar to getPosts
    const response = posts.map((post) => ({
      postId: post.PostID,
      content: post.Content,
      imageUrl: post.ImageURL,
      videoUrl: post.VideoURL,
      createdAt: post.CreatedAt,
      updatedAt: post.UpdatedAt,
      user: post.User,
      isLiked: likedPostIds.has(post.PostID),
      likeCount: post._count.Likes,
      commentCount: post._count.Comments,
      likedBy: post.Likes.map((like) => ({
        username: like.User.Username,
        profilePicture: like.User.ProfilePicture,
      })),
      Comments: (post.Comments || []).map((comment) => ({
        ...comment,
        isLiked: (comment.CommentLikes || []).some(
          (like) => like.UserID === currentUserId
        ),
        likeCount: comment._count?.CommentLikes || 0,
        replyCount: comment._count?.Replies || 0,
        likedBy: (comment.CommentLikes || []).map((like) => ({
          username: like.User.Username,
          profilePicture: like.User.ProfilePicture,
        })),
        Replies: (comment.Replies || []).map((reply) => ({
          ...reply,
          isLiked: (reply.CommentLikes || []).some(
            (like) => like.UserID === currentUserId
          ),
          likeCount: reply._count?.CommentLikes || 0,
          replyCount: reply._count?.Replies || 0,
          likedBy: (reply.CommentLikes || []).map((like) => ({
            username: like.User.Username,
            profilePicture: like.User.ProfilePicture,
          })),
        })),
      })),
    }));

    res.status(200).json({
      count: response.length,
      posts: response,
    });
  } catch (error) {
    console.error("getUserPosts error:", error);
    res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Retrieves user's saved posts with full post details
 * Returns empty array if no posts saved
 */
const getSavedPosts = async (req, res) => {
  const userId = req.user.UserID;

  try {
    const savedPosts = await prisma.savedPost.findMany({
      where: { UserID: userId },
      include: {
        Post: {
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
              select: {
                LikeID: true,
                PostID: true,
                UserID: true,
                CreatedAt: true,
                User: {
                  select: {
                    Username: true,
                    ProfilePicture: true,
                  },
                },
              },
            },
            Comments: {
              include: {
                User: {
                  select: {
                    Username: true,
                    ProfilePicture: true,
                  },
                },
                CommentLikes: {
                  select: {
                    LikeID: true,
                    CommentID: true,
                    UserID: true,
                    CreatedAt: true,
                    User: {
                      select: {
                        Username: true,
                        ProfilePicture: true,
                      },
                    },
                  },
                },
                Replies: {
                  include: {
                    User: {
                      select: {
                        Username: true,
                        ProfilePicture: true,
                      },
                    },
                    CommentLikes: {
                      select: {
                        LikeID: true,
                        CommentID: true,
                        UserID: true,
                        CreatedAt: true,
                        User: {
                          select: {
                            Username: true,
                            ProfilePicture: true,
                          },
                        },
                      },
                    },
                  },
                },
                _count: {
                  select: {
                    CommentLikes: true,
                    Replies: true,
                  },
                },
              },
            },
            _count: {
              select: {
                Likes: true,
                Comments: true,
              },
            },
          },
        },
      },
    });

    // Format the response to match the desired structure
    const formattedPosts = savedPosts.map((savedPost) => {
      const post = savedPost.Post;
      const isLiked = post.Likes.some((like) => like.UserID === userId);
      const likedBy = post.Likes.map((like) => ({
        username: like.User.Username,
        profilePicture: like.User.ProfilePicture,
      }));

      const formattedComments = post.Comments.map((comment) => {
        const commentIsLiked = comment.CommentLikes.some(
          (like) => like.UserID === userId
        );
        const commentLikedBy = comment.CommentLikes.map((like) => ({
          username: like.User.Username,
          profilePicture: like.User.ProfilePicture,
        }));

        const formattedReplies = comment.Replies.map((reply) => {
          const replyIsLiked = reply.CommentLikes.some(
            (like) => like.UserID === userId
          );
          const replyLikedBy = reply.CommentLikes.map((like) => ({
            username: like.User.Username,
            profilePicture: like.User.ProfilePicture,
          }));

          return {
            CommentID: reply.CommentID,
            PostID: reply.PostID,
            UserID: reply.UserID,
            Content: reply.Content,
            CreatedAt: reply.CreatedAt,
            ParentCommentID: reply.ParentCommentID,
            User: {
              Username: reply.User.Username,
              ProfilePicture: reply.User.ProfilePicture,
            },
            CommentLikes: reply.CommentLikes,
            isLiked: replyIsLiked,
            likeCount: reply.CommentLikes.length,
            replyCount: 0, // Replies to replies are not supported in this schema
            likedBy: replyLikedBy,
          };
        });

        return {
          CommentID: comment.CommentID,
          PostID: comment.PostID,
          UserID: comment.UserID,
          Content: comment.Content,
          CreatedAt: comment.CreatedAt,
          ParentCommentID: comment.ParentCommentID,
          User: {
            Username: comment.User.Username,
            ProfilePicture: comment.User.ProfilePicture,
          },
          CommentLikes: comment.CommentLikes,
          Replies: formattedReplies,
          _count: {
            CommentLikes: comment._count.CommentLikes,
            Replies: comment._count.Replies,
          },
          isLiked: commentIsLiked,
          likeCount: comment._count.CommentLikes,
          replyCount: comment._count.Replies,
          likedBy: commentLikedBy,
        };
      });

      return {
        PostID: post.PostID,
        UserID: post.UserID,
        Content: post.Content,
        ImageURL: post.ImageURL,
        VideoURL: post.VideoURL,
        CreatedAt: post.CreatedAt,
        UpdatedAt: post.UpdatedAt,
        privacy: post.privacy,
        User: {
          UserID: post.User.UserID,
          Username: post.User.Username,
          ProfilePicture: post.User.ProfilePicture,
          IsPrivate: post.User.IsPrivate,
        },
        Likes: post.Likes,
        Comments: formattedComments,
        _count: {
          Likes: post._count.Likes,
          Comments: post._count.Comments,
        },
        isLiked: isLiked,
        likeCount: post._count.Likes,
        commentCount: post._count.Comments,
        likedBy: likedBy,
      };
    });

    res.status(200).json({ savedPosts: formattedPosts });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching saved posts",
      error: error.message,
    });
  }
};

/**
 * Retrieves all stories for the authenticated user with StoryID, MediaURL, and CreatedAt
 * Includes both expired and active stories
 */
const getUserStories = async (req, res) => {
  const userId = req.user.UserID;

  try {
    const stories = await prisma.story.findMany({
      where: { UserID: userId },
      select: {
        StoryID: true,
        MediaURL: true,
        CreatedAt: true,
      },
      orderBy: {
        CreatedAt: "desc",
      },
    });

    res.status(200).json({
      count: stories.length,
      stories: stories.map((story) => ({
        storyId: story.StoryID,
        mediaUrl: story.MediaURL,
        createdAt: story.CreatedAt,
      })),
    });
  } catch (error) {
    console.error("getUserStoryIds error:", error);
    res.status(500).json({
      error: "Failed to fetch stories",
      details: process.env.NODE_ENV === "development" ? error.message : null,
    });
  }
};

/**
 * Custom rate limiter implementation using in-memory storage
 * Limits requests to 5 per minute per IP
 */
class RateLimiter {
  constructor() {
    this.limits = new Map();
    setInterval(() => this.cleanup(), 60000);
  }

  cleanup() {
    const now = Date.now();
    for (const [ip, entries] of this.limits.entries()) {
      const filtered = entries.filter((time) => now - time < 60000);
      if (filtered.length > 0) {
        this.limits.set(ip, filtered);
      } else {
        this.limits.delete(ip);
      }
    }
  }

  async consume(ip) {
    const now = Date.now();
    if (!this.limits.has(ip)) {
      this.limits.set(ip, []);
    }

    const requests = this.limits.get(ip);
    const windowStart = now - 60000;
    const recentRequests = requests.filter((t) => t > windowStart);

    if (recentRequests.length >= 5) {
      const error = new Error("Too many requests");
      error.remainingPoints = 0;
      throw error;
    }

    requests.push(now);
    return { remainingPoints: 5 - recentRequests.length - 1 };
  }
}

const rateLimiter = new RateLimiter();

/**
 * Handles follow requests with support for private accounts
 * Implements rate limiting to prevent abuse
 */
const followUser = async (req, res) => {
  try {
    await rateLimiter.consume(req.ip);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const followerId = req.user.UserID;

    if (userId === followerId) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { UserID: parseInt(userId) },
      select: {
        IsPrivate: true,
        Username: true,
        NotificationPreferences: true,
      },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingFollow = await prisma.follower.findFirst({
      where: {
        UserID: parseInt(userId),
        FollowerUserID: followerId,
      },
    });

    if (existingFollow) {
      const statusMap = {
        PENDING: "Your follow request is still pending",
        ACCEPTED: "You are already following this user",
        REJECTED: "Your previous follow request was rejected",
      };
      return res.status(409).json({
        error:
          statusMap[existingFollow.Status] || "Already following this user",
        status: existingFollow.Status,
      });
    }

    const follow = await prisma.follower.create({
      data: {
        UserID: parseInt(userId),
        FollowerUserID: followerId,
        Status: targetUser.IsPrivate ? "PENDING" : "ACCEPTED",
      },
    });

    const shouldNotify =
      !targetUser.NotificationPreferences ||
      !targetUser.NotificationPreferences.NotificationTypes ||
      (targetUser.IsPrivate
        ? targetUser.NotificationPreferences.NotificationTypes.includes(
            "FOLLOW_REQUEST"
          )
        : targetUser.NotificationPreferences.NotificationTypes.includes(
            "FOLLOW"
          ));

    if (shouldNotify) {
      if (targetUser.IsPrivate) {
        await prisma.notification.create({
          data: {
            UserID: parseInt(userId),
            SenderID: followerId,
            Type: "FOLLOW_REQUEST",
            Content: `${req.user.Username} wants to follow you`,
            Metadata: {
              requestId: follow.FollowerID,
              requesterId: followerId,
              requesterUsername: req.user.Username,
            },
          },
        });
        return res.status(201).json({
          message: "Follow request sent",
          status: "PENDING",
        });
      }

      await prisma.notification.create({
        data: {
          UserID: parseInt(userId),
          SenderID: followerId,
          Type: "FOLLOW",
          Content: `${req.user.Username} started following you`,
          Metadata: {
            followerId: followerId,
            followerUsername: req.user.Username,
          },
        },
      });
    }

    // Invalidate Redis cache for the target user's profile
    const cacheKey = `profile:username:${targetUser.Username}`;
    await del(cacheKey, followerId?.toString());
    console.log(`Cache invalidated for profile: ${cacheKey} after follow`);

    res.status(201).json({
      message: "Successfully followed user",
      status: "ACCEPTED",
    });
  } catch (error) {
    if (error.remainingPoints === 0) {
      return res.status(429).json({ error: "Too many requests" });
    }
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

/**
 * Removes follow relationship between users
 * Validates user IDs to prevent self-unfollow
 */
const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.UserID;

    if (userId === followerId) {
      return res.status(400).json({ error: "Cannot unfollow yourself" });
    }

    const result = await prisma.follower.deleteMany({
      where: {
        UserID: parseInt(userId),
        FollowerUserID: followerId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Follow relationship not found" });
    }

    // Invalidate Redis cache for the unfollowed user's profile
    const unfollowedUser = await prisma.user.findUnique({
      where: { UserID: parseInt(userId) },
      select: { Username: true },
    });
    if (unfollowedUser) {
      const cacheKey = `profile:username:${unfollowedUser.Username}`;
      await del(cacheKey, followerId?.toString());
      console.log(`Cache cleared for profile: ${cacheKey} after unfollow`);
    }

    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Removes a follower from the current user's followers list
 * Validates user ownership and deletes the follow relationship
 */
const removeFollower = async (req, res) => {
  try {
    const { followerId } = req.params; // ID of the user to remove as a follower
    const userId = req.user.UserID; // Current authenticated user (profile owner)

    // Validate that the followerId is a valid number
    const parsedFollowerId = parseInt(followerId);
    if (isNaN(parsedFollowerId)) {
      return res.status(400).json({ error: "Invalid follower ID format" });
    }

    // Check if the follower relationship exists
    const followRelationship = await prisma.follower.findFirst({
      where: {
        UserID: userId,
        FollowerUserID: parsedFollowerId,
        Status: "ACCEPTED",
      },
    });

    if (!followRelationship) {
      return res.status(404).json({ error: "Follower relationship not found" });
    }

    // Delete the follower relationship
    await prisma.follower.delete({
      where: {
        FollowerID: followRelationship.FollowerID,
      },
    });

    // Invalidate Redis cache for the current user's profile and followers list
    const cacheKeyProfile = `profile:username:${req.user.Username}`;
    await del(cacheKeyProfile, userId?.toString());
    console.log(
      `Cache cleared for profile: ${cacheKeyProfile} after removing follower`
    );

    const cacheKeyFollowers = `followers:user:${userId}`;
    await del(cacheKeyFollowers, userId?.toString());
    console.log(
      `Cache cleared for followers: ${cacheKeyFollowers} after removing follower`
    );

    res.status(200).json({ message: "Follower removed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

/**
 * Accepts pending follow request and returns updated followers list
 * Validates request ownership before processing
 */
const acceptFollowRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.UserID;

    const updatedFollow = await prisma.follower.update({
      where: {
        FollowerID: parseInt(requestId),
        UserID: userId,
        Status: "PENDING",
      },
      data: {
        Status: "ACCEPTED",
        UpdatedAt: new Date(),
      },
      include: {
        FollowerUser: {
          select: {
            UserID: true,
            Username: true,
            ProfilePicture: true,
          },
        },
      },
    });

    if (!updatedFollow) {
      return res.status(404).json({
        error: "Follow request not found or already processed",
      });
    }

    const acceptedFollowers = await prisma.follower.findMany({
      where: {
        UserID: userId,
        Status: "ACCEPTED",
      },
      select: {
        FollowerUser: {
          select: {
            UserID: true,
            Username: true,
            ProfilePicture: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Follow request accepted",
      acceptedFollowers: acceptedFollowers.map((f) => f.FollowerUser),
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Retrieves pending follow requests for the current user
 * Includes basic requester information
 */
const getPendingFollowRequests = async (req, res) => {
  try {
    const userId = req.user.UserID;

    const requests = await prisma.follower.findMany({
      where: {
        UserID: userId,
        Status: "PENDING",
      },
      include: {
        FollowerUser: {
          select: {
            UserID: true,
            Username: true,
            ProfilePicture: true,
            Bio: true,
          },
        },
      },
      orderBy: {
        CreatedAt: "desc",
      },
    });

    res.status(200).json({
      count: requests.length,
      pendingRequests: requests.map((r) => ({
        requestId: r.FollowerID,
        user: r.FollowerUser,
        createdAt: r.CreatedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Rejects follow request and removes the follow relationship
 * Validates request ownership before processing
 */
const rejectFollowRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.UserID;

    const deletedFollow = await prisma.follower.delete({
      where: {
        FollowerID: parseInt(requestId),
        UserID: userId,
        Status: "PENDING",
      },
      include: {
        FollowerUser: {
          select: {
            UserID: true,
            Username: true,
          },
        },
      },
    });

    if (!deletedFollow) {
      return res.status(404).json({
        error: "Follow request not found or already processed",
      });
    }

    res.status(200).json({
      message: "Follow request rejected",
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Retrieves user's followers with privacy checks
 * For private accounts, verifies follow status before showing
 */
const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.UserID;
    const parsedUserId = parseInt(userId);

    if (isNaN(parsedUserId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const user = await prisma.user.findUnique({
      where: { UserID: parsedUserId },
      select: {
        IsPrivate: true,
        Username: true,
        UserID: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isOwner = currentUserId === user.UserID;
    let hasAccess = !user.IsPrivate || isOwner;

    if (user.IsPrivate && !isOwner && currentUserId) {
      const followRelationship = await prisma.follower.findFirst({
        where: {
          UserID: user.UserID,
          FollowerUserID: currentUserId,
          Status: "ACCEPTED",
        },
      });
      hasAccess = followRelationship !== null;
    }

    if (!hasAccess) {
      return res.status(403).json({
        error: "Private account",
        message: `You must follow @${user.Username} to view their followers`,
      });
    }

    const followers = await prisma.follower.findMany({
      where: {
        UserID: user.UserID,
        Status: "ACCEPTED",
      },
      select: {
        FollowerUser: {
          select: {
            UserID: true,
            Username: true,
            ProfileName: true,
            ProfilePicture: true,
            IsPrivate: true,
            Bio: true, // Include Bio since we're returning it in the response
          },
        },
        CreatedAt: true,
      },
      orderBy: {
        CreatedAt: "desc",
      },
      take: 100,
    });

    res.status(200).json({
      count: followers.length,
      followers: followers.map((follower) => ({
        userId: follower.FollowerUser.UserID,
        username: follower.FollowerUser.Username,
        profileName: follower.FollowerUser.ProfileName,
        profilePicture: follower.FollowerUser.ProfilePicture,
        isPrivate: follower.FollowerUser.IsPrivate,
        bio: follower.FollowerUser.Bio,
      })),
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Retrieves users being followed with privacy checks
 * For private accounts, verifies follow status before showing
 */
const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.UserID;
    const parsedUserId = parseInt(userId);

    if (isNaN(parsedUserId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await prisma.user.findUnique({
      where: { UserID: parsedUserId },
      select: { IsPrivate: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isOwner = currentUserId === parsedUserId;
    const hasAccess =
      !user.IsPrivate ||
      isOwner ||
      (currentUserId &&
        (await prisma.follower.count({
          where: {
            UserID: parsedUserId,
            FollowerUserID: currentUserId,
            Status: "ACCEPTED",
          },
        })) > 0);

    if (!hasAccess) {
      return res.status(403).json({ error: "Private account" });
    }

    const following = await prisma.follower.findMany({
      where: {
        FollowerUserID: parsedUserId,
        Status: "ACCEPTED",
      },
      select: {
        User: {
          select: {
            UserID: true,
            Username: true,
            ProfileName: true,
            ProfilePicture: true,
            Bio: true,
            IsPrivate: true,
          },
        },
      },
      take: 100,
    });

    res.status(200).json({
      count: following.length,
      following: following.map((f) => ({
        userId: f.User.UserID,
        username: f.User.Username,
        profileName: f.User.ProfileName,
        profilePicture: f.User.ProfilePicture,
        isPrivate: f.User.IsPrivate,
        bio: f.User.Bio,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Retrieves random user suggestions that the current user is not following
 * Excludes the current user and banned users
 * Caches results in Redis for performance
 */
const getUserSuggestions = async (req, res) => {
  try {
    const currentUserId = req.user.UserID;
    const limit = parseInt(req.query.limit) || 5;

    if (limit < 1 || limit > 50) {
      return res.status(400).json({ error: "Limit must be between 1 and 50" });
    }

    // Check Redis cache
    const cacheKey = `suggestions:user:${currentUserId}:limit:${limit}`;
    const cachedSuggestions = await get(cacheKey);
    if (cachedSuggestions) {
      return res.status(200).json(cachedSuggestions);
    }

    // Get IDs of users the current user is following
    const following = await prisma.follower.findMany({
      where: {
        FollowerUserID: currentUserId,
        Status: "ACCEPTED",
      },
      select: {
        UserID: true,
      },
    });
    const followingIds = following.map((f) => f.UserID);

    // Get all eligible user IDs (excluding current user, banned users, and followed users)
    const eligibleUsers = await prisma.user.findMany({
      where: {
        UserID: {
          notIn: [currentUserId, ...followingIds],
        },
        IsBanned: false,
      },
      select: {
        UserID: true,
      },
    });

    if (eligibleUsers.length === 0) {
      return res.status(200).json({
        count: 0,
        suggestions: [],
      });
    }

    // Shuffle user IDs to ensure true randomness
    const shuffledUserIds = shuffleArray(
      eligibleUsers.map((user) => user.UserID)
    );
    const selectedUserIds = shuffledUserIds.slice(0, limit);

    // Fetch user details for the selected IDs
    const users = await prisma.user.findMany({
      where: {
        UserID: {
          in: selectedUserIds,
        },
      },
      select: {
        UserID: true,
        Username: true,
        ProfilePicture: true,
        Bio: true,
      },
    });

    // Ensure the response order matches the shuffled order
    const orderedUsers = selectedUserIds
      .map((id) => users.find((user) => user.UserID === id))
      .filter((user) => user); // Remove any undefined entries

    const response = {
      count: orderedUsers.length,
      suggestions: orderedUsers.map((user) => ({
        userId: user.UserID,
        username: user.Username,
        profilePicture: user.ProfilePicture,
        bio: user.Bio,
      })),
    };

    // Cache the result in Redis for 5 minutes
    await setWithTracking(cacheKey, response, 300, currentUserId.toString());

    res.status(200).json(response);
  } catch (error) {
    console.error("getUserSuggestions error:", error);
    res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Retrieves user profile by username with privacy checks
 * Returns profile if account is public or if private and followed by current user
 */
const getProfileByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user?.UserID;

    // Check Redis cache
    const cacheKey = `profile:username:${username}`;
    const cachedProfile = await get(cacheKey);
    if (cachedProfile) {
      return res.status(200).json(cachedProfile);
    }

    const user = await prisma.user.findUnique({
      where: { Username: username },
      select: {
        UserID: true,
        Username: true,
        ProfilePicture: true,
        CoverPicture: true,
        Bio: true,
        Address: true,
        JobTitle: true,
        DateOfBirth: true,
        IsPrivate: true,
        Role: true,
        CreatedAt: true,
        UpdatedAt: true,
        ProfileName: true,
        IsBanned: true,
        _count: {
          select: {
            Posts: true,
            Followers: { where: { Status: "ACCEPTED" } },
            Following: { where: { Status: "ACCEPTED" } },
            Likes: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.IsBanned) {
      return res.status(403).json({ error: "User is banned" });
    }

    // Check if the current user is following this user and get follow status
    let isFollowing = false;
    let followStatus = "NONE";
    if (currentUserId && currentUserId !== user.UserID) {
      const followStatusQuery = await prisma.follower.findFirst({
        where: {
          UserID: user.UserID,
          FollowerUserID: currentUserId,
        },
      });
      if (followStatusQuery) {
        isFollowing = followStatusQuery.Status === "ACCEPTED";
        followStatus = followStatusQuery.Status;
      }
    }

    const response = {
      profile: {
        userId: user.UserID,
        username: user.Username,
        profilePicture: user.ProfilePicture,
        coverPicture: user.CoverPicture,
        bio: user.Bio,
        address: user.Address,
        jobTitle: user.JobTitle,
        dateOfBirth: user.DateOfBirth,
        isPrivate: user.IsPrivate,
        role: user.Role,
        createdAt: user.CreatedAt,
        updatedAt: user.UpdatedAt,
        postCount: user._count.Posts,
        followerCount: user._count.Followers,
        followingCount: user._count.Following,
        likeCount: user._count.Likes,
        isFollowing: isFollowing,
        profileName: user.ProfileName,
        followStatus: followStatus, // Added to indicate follow status
      },
    };

    // Cache the result in Redis for 5 minutes
    await setWithTracking(cacheKey, response, 300, currentUserId?.toString());
    console.log(`Cache set for profile: ${cacheKey}`);

    res.status(200).json(response);
  } catch (error) {
    console.error("getProfileByUsername error:", error);
    res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  updatePrivacySettings,
  deleteProfile,
  getUserPosts,
  getSavedPosts,
  getUserStories,
  followUser,
  unfollowUser,
  removeFollower,
  getFollowers,
  getFollowing,
  acceptFollowRequest,
  rejectFollowRequest,
  getPendingFollowRequests,
  getUserSuggestions,
  getProfileByUsername,
};
