const prisma = require("../utils/prisma");
const {
  validateHighlightInput,
  validateHighlightUpdate,
} = require("../validators/highlightValidators");
const { validationResult } = require("express-validator");

/**
 * Creates a new highlight after validating:
 * - User owns all stories being added
 * - Input meets validation requirements
 */
const createHighlight = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { title, coverImage, storyIds } = req.body;
  const userId = req.user.UserID;

  try {
    // Security check: Verify user owns all stories before creating highlight
    const validStories = await prisma.story.count({
      where: { StoryID: { in: storyIds }, UserID: userId },
    });

    if (validStories !== storyIds.length) {
      return res.status(403).json({ error: "Unauthorized story access" });
    }

    const highlight = await prisma.highlight.create({
      data: {
        Title: title,
        CoverImage: coverImage,
        UserID: userId,
        Stories: { connect: storyIds.map((id) => ({ StoryID: id })) },
      },
      include: { Stories: { select: { StoryID: true } } }, // Only return story IDs
    });

    res.status(201).json(highlight);
  } catch (error) {
    res.status(500).json({
      error: "Highlight creation failed",
      details: process.env.NODE_ENV === "development" ? error.message : null,
    });
  }
};

/**
 * Gets highlights with privacy considerations:
 * - Full access for owner
 * - Restricted based on account privacy and follow status
 */
const getUserHighlights = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const currentUserId = req.user?.UserID;
    const isOwner = userId === currentUserId;

    if (isOwner) {
      const highlights = await prisma.highlight.findMany({
        where: { UserID: userId },
        select: basicHighlightFields, // Reusable field selection
      });
      return res.json(highlights);
    }

    // Privacy check for non-owners
    const user = await prisma.user.findUnique({
      where: { UserID: userId },
      select: {
        IsPrivate: true,
        Followers: { where: { FollowerUserID: currentUserId } },
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.IsPrivate && user.Followers.length === 0) {
      return res.status(403).json({ error: "Private account" });
    }

    const highlights = await prisma.highlight.findMany({
      where: { UserID: userId },
      select: basicHighlightFields,
    });

    res.json(highlights);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch highlights",
      details: process.env.NODE_ENV === "development" ? error.message : null,
    });
  }
};

// Reusable field selection for highlight responses
const basicHighlightFields = {
  HighlightID: true,
  Title: true,
  CoverImage: true,
  _count: { select: { Stories: true } },
};

/**
 * Gets full highlight details with strict access control:
 * - Validates highlight ownership
 * - Checks follow status for private accounts
 */
const getHighlightDetails = async (req, res) => {
  try {
    const highlightId = parseInt(req.params.highlightId);
    if (isNaN(highlightId))
      return res.status(400).json({ error: "Invalid highlight ID" });

    const currentUserId = req.user?.UserID;
    if (!currentUserId)
      return res.status(401).json({ error: "Authentication required" });

    const highlight = await prisma.highlight.findUnique({
      where: { HighlightID: highlightId },
      include: {
        User: { select: { IsPrivate: true, UserID: true } },
        Stories: { select: { StoryID: true, MediaURL: true } },
      },
    });

    if (!highlight)
      return res.status(404).json({ error: "Highlight not found" });

    // Access control checks
    const isOwner = highlight.UserID === currentUserId;
    const isPrivate = highlight.User.IsPrivate;
    const isFollowing =
      isPrivate &&
      (await prisma.follower.count({
        where: { UserID: highlight.UserID, FollowerUserID: currentUserId },
      })) > 0;

    if (isOwner || !isPrivate || isFollowing) {
      return res.json(highlight);
    }

    return res.status(403).json({ error: "Private account - Follow to view" });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? error.message : null,
    });
  }
};

/**
 * Updates highlight with partial update support:
 * - Validates user ownership
 * - Checks story ownership when updating stories
 */
const updateHighlight = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { title, coverImage, storyIds } = req.body;
  const { highlightId } = req.params;
  const userId = req.user.UserID;

  try {
    // Verify highlight ownership
    const existingHighlight = await prisma.highlight.findUnique({
      where: { HighlightID: parseInt(highlightId) },
    });

    if (!existingHighlight || existingHighlight.UserID !== userId) {
      return res.status(404).json({ error: "Highlight not found" });
    }

    const updateData = {};
    if (typeof title !== "undefined") updateData.Title = title;
    if (typeof coverImage !== "undefined") updateData.CoverImage = coverImage;

    // Handle story updates with validation
    if (typeof storyIds !== "undefined") {
      if (storyIds.length === 0) {
        return res.status(400).json({ error: "Must include at least 1 story" });
      }

      const validStories = await prisma.story.count({
        where: { StoryID: { in: storyIds }, UserID: userId },
      });

      if (validStories !== storyIds.length) {
        return res.status(403).json({ error: "Invalid stories provided" });
      }

      updateData.Stories = { set: storyIds.map((id) => ({ StoryID: id })) };
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const updatedHighlight = await prisma.highlight.update({
      where: { HighlightID: parseInt(highlightId) },
      data: updateData,
      include: { Stories: { select: { StoryID: true } } },
    });

    res.json(updatedHighlight);
  } catch (error) {
    res.status(500).json({
      error: "Failed to update highlight",
      details: process.env.NODE_ENV === "development" ? error.message : null,
    });
  }
};

/**
 * Deletes highlight safely using transaction:
 * 1. Removes all story associations
 * 2. Deletes the highlight record
 */
const deleteHighlight = async (req, res) => {
  try {
    const highlightId = parseInt(req.params.highlightId);
    const userId = req.user.UserID;

    // Ownership verification
    const highlight = await prisma.highlight.findFirst({
      where: { HighlightID: highlightId, UserID: userId },
    });

    if (!highlight) {
      const exists = await prisma.highlight.count({
        where: { HighlightID: highlightId },
      });
      return res.status(exists ? 403 : 404).json({
        error: exists ? "You don't own this highlight" : "Highlight not found",
      });
    }

    // Atomic delete operation
    await prisma.$transaction([
      prisma.highlight.update({
        where: { HighlightID: highlightId },
        data: { Stories: { set: [] } },
      }),
      prisma.highlight.delete({ where: { HighlightID: highlightId } }),
    ]);

    res.json({
      success: true,
      message: "Highlight deleted successfully",
      deletedId: highlightId,
    });
  } catch (error) {
    res.status(500).json({
      error: "Deletion failed",
      details: process.env.NODE_ENV === "development" ? error.message : null,
    });
  }
};

module.exports = {
  createHighlight,
  getUserHighlights,
  getHighlightDetails,
  updateHighlight,
  deleteHighlight,
};
