const { validationResult } = require("express-validator");
const prisma = require("../utils/prisma");
const {
  handleValidationError,
  handleServerError,
} = require("../utils/errorHandler");

/**
 * Handles search for users or posts based on query
 * Supports pagination and type (ALL, USERS, POSTS)
 * Returns filtered search results
 */
const search = async (req, res) => {
  // Check for validation errors in the request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return handleValidationError(res, errors);
  }

  // Extract query parameters (search term, type, page, limit)
  const { query, type = "ALL", page = 1, limit = 10 } = req.query;
  const userId = req.user.UserID;
  const skip = (page - 1) * limit; // Calculate records to skip for pagination

  try {
    let users = []; // Store user search results
    let posts = []; // Store post search results

    // Search for users if type is USERS or ALL
    if (type === "USERS" || type === "ALL") {
      // Find users matching the query, excluding the current user
      const foundUsers = await prisma.user.findMany({
        where: {
          OR: [
            { Username: { contains: query, mode: "insensitive" } },
            { Email: { contains: query, mode: "insensitive" } },
          ],
          NOT: {
            UserID: userId,
          },
        },
        select: {
          UserID: true,
          Username: true,
          ProfilePicture: true,
          Bio: true,
          IsPrivate: true,
        },
        skip,
        take: limit,
      });

      // Check if the current user follows each found user
      users = await Promise.all(
        foundUsers.map(async (user) => {
          const followStatus = await prisma.follower.findFirst({
            where: {
              UserID: user.UserID,
              FollowerUserID: userId,
              Status: "ACCEPTED",
            },
            select: { Status: true },
          });

          return {
            ...user,
            isFollowed: !!followStatus, // Add follow status to user data
          };
        })
      );
    }

    // Search for posts if type is POSTS or ALL
    if (type === "POSTS" || type === "ALL") {
      // Find posts matching the query with their owners
      const allPosts = await prisma.post.findMany({
        where: {
          Content: { contains: query, mode: "insensitive" },
          OR: [
            { privacy: "PUBLIC" },
            { privacy: "FOLLOWERS_ONLY" },
            { UserID: userId },
          ],
        },
        include: {
          User: {
            select: {
              UserID: true,
              Username: true,
              IsPrivate: true,
              Followers: {
                where: {
                  FollowerUserID: userId,
                  Status: "ACCEPTED",
                },
                select: { FollowerUserID: true },
              },
            },
          },
        },
        skip,
        take: limit,
      });

      // Filter posts based on privacy settings
      posts = allPosts.filter((post) => {
        const postOwner = post.User;
        if (post.UserID === userId) return true; // Show user's own posts
        if (post.privacy === "PUBLIC") return true; // Show public posts
        if (!postOwner.IsPrivate && post.privacy === "FOLLOWERS_ONLY")
          return true; // Show followers-only posts if account is not private
        // Show private or followers-only posts if user follows the owner
        return postOwner.Followers.some(
          (follower) => follower.FollowerUserID === userId
        );
      });
    }

    // Send the search results
    res.status(200).json({
      users,
      posts,
    });
  } catch (error) {
    // Handle server errors
    handleServerError(res, error, "Error while searching");
  }
};

/**
 * Handles search for users or messages in the messenger
 * Searches both if type is not specified, otherwise searches based on type (USER, MESSAGE)
 * Returns search results with optional message if no results found
 */
const messangerSearch = async (req, res) => {
  // Check for validation errors in the request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return handleValidationError(res, errors);
  }

  // Extract query parameters (search term, type)
  const { query, type } = req.query;
  const userId = req.user.UserID;

  try {
    let users = []; // Store user search results
    let messages = []; // Store message search results

    // Determine what to search based on type
    const shouldSearchUsers = !type || type === "USER"; // Search users if type is not specified or USER
    const shouldSearchMessages = !type || type === "MESSAGE"; // Search messages if type is not specified or MESSAGE

    // Search for users in conversations
    if (shouldSearchUsers) {
      // Find conversations involving the current user
      const conversations = await prisma.conversation.findMany({
        where: {
          participants: { some: { UserID: userId } },
        },
        select: {
          participants: {
            where: {
              UserID: { not: userId },
            },
            select: {
              UserID: true,
              Username: true,
              ProfilePicture: true,
            },
          },
        },
      });

      // Filter users by username matching the query
      const otherUsers = conversations
        .flatMap((conv) => conv.participants)
        .filter((user) =>
          user.Username.toLowerCase().includes(query.toLowerCase())
        );

      // Remove duplicate users
      users = Array.from(
        new Map(otherUsers.map((user) => [user.UserID, user])).values()
      );
    }

    // Search for messages in conversations
    if (shouldSearchMessages) {
      // Find messages matching the query in conversations involving the user
      const foundMessages = await prisma.message.findMany({
        where: {
          conversation: {
            participants: { some: { UserID: userId } },
          },
          content: { contains: query, mode: "insensitive" },
        },
        select: {
          content: true,
          createdAt: true,
          readAt: true,
          senderId: true,
          conversation: {
            select: {
              id: true,
              participants: {
                where: { UserID: { not: userId } },
                select: {
                  UserID: true,
                  Username: true,
                  ProfilePicture: true,
                },
              },
            },
          },
        },
      });

      // Format messages with other user's info
      messages = foundMessages
        .map((message) => {
          const otherUser = message.conversation.participants[0];
          if (!otherUser) {
            return null; // Skip if no other user found
          }

          return {
            content: message.content,
            createdAt: message.createdAt,
            isReaded: !!message.readAt,
            conversationId: message.conversation.id,
            otherUser: {
              UserID: otherUser.UserID,
              Username: otherUser.Username,
              ProfilePicture: otherUser.ProfilePicture,
            },
          };
        })
        .filter((message) => message !== null); // Remove invalid messages
    }

    // Send the search results with a message if no results found
    res.status(200).json({
      users,
      messages,
      message:
        users.length === 0 && messages.length === 0
          ? "No results found for your search."
          : undefined,
    });
  } catch (error) {
    // Handle server errors
    handleServerError(res, error, "Error while searching in messenger");
  }
};

module.exports = { search, messangerSearch };
