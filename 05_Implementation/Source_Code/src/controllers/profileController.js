const prisma = require("../utils/prisma");
const bcrypt = require("bcryptjs");
const { RateLimiterPrisma } = require("rate-limiter-flexible");
const { validationResult } = require("express-validator");

// Get user profile
const getProfile = async (req, res) => {
  const userId = req.user.UserID;

  try {
    // Fetch user details from the database
    const user = await prisma.user.findUnique({
      where: { UserID: userId },
      select: {
        UserID: true,
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

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user's profile
    res.status(200).json({ profile: user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching profile", error: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  const { username, email, bio, profilePicture } = req.body;
  const userId = req.user.UserID;

  try {
    // Check if the new username already exists (excluding the current user)
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

    // Check if the new email already exists (excluding the current user)
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

    // Update the user's profile in the database
    const updatedUser = await prisma.user.update({
      where: { UserID: userId },
      data: {
        Username: username,
        Email: email,
        Bio: bio,
        ProfilePicture: profilePicture,
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

    // Return the updated profile
    res.status(200).json({
      message: "Profile updated successfully",
      profile: updatedUser,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating profile", error: error.message });
  }
};

// Change user password
const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.UserID;

  try {
    // Find the user in the database
    const user = await prisma.user.findUnique({ where: { UserID: userId } });

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify the old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.Password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
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

// Update user privacy settings
const updatePrivacySettings = async (req, res) => {
  const { isPrivate } = req.body;
  const userId = req.user.UserID;

  try {
    // Update the user's privacy settings in the database
    const updatedUser = await prisma.user.update({
      where: { UserID: userId },
      data: {
        IsPrivate: isPrivate,
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

    // Return the updated profile
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

// Delete user profile
const deleteProfile = async (req, res) => {
  const userId = req.user.UserID;

  try {
    // Delete the user from the database
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

// Get user's saved posts
const getSavedPosts = async (req, res) => {
  const userId = req.user.UserID;

  try {
    // Fetch the user's saved posts from the database
    const savedPosts = await prisma.savedPost.findMany({
      where: { UserID: userId },
      include: {
        Post: true, // Include the post details
      },
    });

    res.status(200).json({ savedPosts });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching saved posts", error: error.message });
  }
};

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

// Follow a user with enhanced follow request system
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

// Accept follow request - returns users who accepted follow requests
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

    // Get all accepted followers
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

// Get pending follow requests - returns users with pending requests
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

// Reject follow request - returns users who rejected follow requests
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

    // Get all rejected follow requests (stored in a separate table or as status)
    const rejectedFollows = await prisma.follower.findMany({
      where: {
        UserID: userId,
        Status: "REJECTED",
      },
      select: {
        FollowerUser: {
          select: {
            UserID: true,
            Username: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Follow request rejected",
      rejectedUsers: rejectedFollows.map((f) => f.FollowerUser),
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Unfollow a user
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

// Get user's followers with proper access control
const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.UserID;
    const parsedUserId = parseInt(userId);

    // Validate user ID
    if (isNaN(parsedUserId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // Get user privacy status and basic info
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

    // Check access rights
    const isOwner = currentUserId === user.UserID;
    let hasAccess = !user.IsPrivate || isOwner;

    // If account is private and user isn't owner, check if following
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

    // Handle access denial
    if (!hasAccess) {
      return res.status(403).json({
        error: "Private account",
        message: `You must follow @${user.Username} to view their followers`,
      });
    }

    // Get followers (only accepted follows)
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
            IsPrivate: true, // Include privacy status of followers
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

// Get users being followed
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
  getSavedPosts,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  acceptFollowRequest,
  rejectFollowRequest,
  getPendingFollowRequests,
};
