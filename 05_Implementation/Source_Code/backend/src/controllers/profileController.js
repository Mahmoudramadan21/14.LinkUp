const prisma = require("../utils/prisma");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const cloudinary = require("cloudinary").v2;

// Salt rounds for password hashing - recommended value
const SALT_ROUNDS = 10;

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
        _count: {
          select: {
            Posts: true, // Count of user's posts
            Likes: true, // Count of likes given by user
            Followers: { where: { Status: "ACCEPTED" } }, // Count of accepted followers
            Following: { where: { Status: "ACCEPTED" } }, // Count of users followed
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
    };

    res.status(200).json({ profile: response });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching profile", error: error.message });
  }
};

/**
 * Updates user profile with validation for duplicates and new fields
 * Supports profile and cover picture uploads
 * Returns updated profile data
 */
const updateProfile = async (req, res) => {
  const { username, email, bio, address, jobTitle, dateOfBirth } = req.body;
  const userId = req.user.UserID;
  let profilePictureUrl, coverPictureUrl;

  // Handle multiple file uploads (profilePicture and coverPicture)
  const files = req.files || {};
  const profilePictureFile = files.profilePicture
    ? files.profilePicture[0]
    : null;
  const coverPictureFile = files.coverPicture ? files.coverPicture[0] : null;

  try {
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
    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          Email: email,
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

    // Update the user's profile
    const updatedUser = await prisma.user.update({
      where: { UserID: userId },
      data: {
        Username: username,
        Email: email,
        Bio: bio,
        Address: address,
        JobTitle: jobTitle,
        DateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        ProfilePicture: profilePictureUrl,
        CoverPicture: coverPictureUrl,
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
      },
    });

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
    // Convert string "true"/"false" to boolean
    const isPrivateBoolean = isPrivate === "true";

    const updatedUser = await prisma.user.update({
      where: { UserID: userId },
      data: {
        IsPrivate: isPrivateBoolean,
      },
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
    });

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
      .storyId(500)
      .json({ message: "Error deleting profile", error: error.message });
  }
};

/**
 * Retrieves all posts by a specific user with privacy checks
 * For private accounts, verifies follow status before showing
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
      select: {
        PostID: true,
        Content: true,
        ImageURL: true,
        VideoURL: true,
        CreatedAt: true,
        UpdatedAt: true,
        User: {
          select: {
            UserID: true,
            Username: true,
            ProfilePicture: true,
          },
        },
        _count: {
          select: {
            Likes: true,
            Comments: true,
          },
        },
      },
      orderBy: {
        CreatedAt: "desc",
      },
    });

    console.log("getUserPosts: Posts fetched", { postCount: posts.length });
    res.status(200).json({
      count: posts.length,
      posts: posts.map((post) => ({
        postId: post.PostID,
        content: post.Content,
        imageUrl: post.ImageURL,
        videoUrl: post.VideoURL,
        createdAt: post.CreatedAt,
        updatedAt: post.UpdatedAt,
        user: post.User,
        likeCount: post._count.Likes,
        commentCount: post._count.Comments,
      })),
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
        Post: true,
      },
    });

    res.status(200).json({ savedPosts });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching saved posts", error: error.message });
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
      select: { IsPrivate: true, Username: true },
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

    if (targetUser.IsPrivate) {
      await prisma.notification.create({
        data: {
          UserID: parseInt(userId),
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
        Type: "FOLLOW",
        Content: `${req.user.Username} started following you`,
        Metadata: {
          followerId: followerId,
        },
      },
    });

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

    res.status(200).json({ message: "Unfollowed successfully" });
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
            ProfilePicture: true,
            IsPrivate: true,
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
      followers: followers.map((f) => ({
        ...f.FollowerUser,
        followedAt: f.CreatedAt,
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
            ProfilePicture: true,
          },
        },
      },
      take: 100,
    });

    res.status(200).json({
      following: following.map((f) => f.User),
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
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
  getFollowers,
  getFollowing,
  acceptFollowRequest,
  rejectFollowRequest,
  getPendingFollowRequests,
};
