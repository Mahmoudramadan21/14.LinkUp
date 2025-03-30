const prisma = require("../utils/prisma");
const {
  validateHighlightInput,
  validateHighlightUpdate,
} = require("../validators/highlightValidators");
const { validationResult } = require("express-validator");

// Create highlight with stories
const createHighlight = async (req, res) => {
  // First check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, coverImage, storyIds } = req.body;
  const userId = req.user.UserID;

  try {
    // Verify user owns all stories
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
      include: { Stories: { select: { StoryID: true } } },
    });

    res.status(201).json(highlight);
  } catch (error) {
    res.status(500).json({ error: "Highlight creation failed" });
  }
};

// Get highlights with privacy checks
const getUserHighlights = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const currentUserId = req.user?.UserID;
    const isOwner = userId === currentUserId;

    // Return all highlights without privacy checks for owner
    if (isOwner) {
      const highlights = await prisma.highlight.findMany({
        where: { UserID: userId },
        select: {
          HighlightID: true,
          Title: true,
          CoverImage: true,
          _count: { select: { Stories: true } },
        },
      });
      return res.json(highlights);
    }

    // Privacy checks for non-owners
    const user = await prisma.user.findUnique({
      where: { UserID: userId },
      select: {
        IsPrivate: true,
        Followers: { where: { FollowerUserID: currentUserId } },
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });
    const canView = !user.IsPrivate || user.Followers.length > 0;
    if (!canView) return res.status(403).json({ error: "Private account" });

    const highlights = await prisma.highlight.findMany({
      where: { UserID: userId },
      select: {
        HighlightID: true,
        Title: true,
        CoverImage: true,
        _count: { select: { Stories: true } },
      },
    });

    res.json(highlights);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch highlights" });
  }
};

// Get single highlight with full privacy validation
const getHighlightDetails = async (req, res) => {
  try {
    const highlightId = parseInt(req.params.highlightId);
    if (isNaN(highlightId)) {
      return res.status(400).json({ error: "Invalid highlight ID" });
    }

    if (!req.user?.UserID) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const currentUserId = req.user.UserID;

    const highlight = await prisma.highlight.findUnique({
      where: { HighlightID: highlightId },
      include: {
        User: { select: { IsPrivate: true, UserID: true } },
        Stories: { select: { StoryID: true, MediaURL: true } },
      },
    });

    if (!highlight) {
      return res.status(404).json({ error: "Highlight not found" });
    }

    // Access control
    const isOwner = highlight.UserID === currentUserId;
    if (isOwner) {
      return res.json(highlight);
    }

    if (highlight.User.IsPrivate) {
      const isFollowing =
        (await prisma.follower.count({
          where: {
            UserID: highlight.UserID,
            FollowerUserID: currentUserId,
          },
        })) > 0;

      if (!isFollowing) {
        return res
          .status(403)
          .json({ error: "Private account - Follow to view" });
      }
    }

    return res.json(highlight);
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update Highlight
const updateHighlight = async (req, res) => {
  // First check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, coverImage, storyIds } = req.body;
  const { highlightId } = req.params;
  const userId = req.user.UserID;

  try {
    // Verify highlight exists and belongs to user
    const existingHighlight = await prisma.highlight.findUnique({
      where: { HighlightID: parseInt(highlightId) },
    });

    if (!existingHighlight || existingHighlight.UserID !== userId) {
      return res.status(404).json({ error: "Highlight not found" });
    }

    // Prepare update data
    const updateData = {};

    // Handle title update
    if (typeof title !== "undefined") {
      updateData.Title = title;
    }

    // Handle coverImage update
    if (typeof coverImage !== "undefined") {
      updateData.CoverImage = coverImage;
    }

    // Handle stories update
    if (typeof storyIds !== "undefined") {
      if (storyIds.length === 0) {
        return res.status(400).json({ error: "Must include at least 1 story" });
      }

      const validStories = await prisma.story.count({
        where: {
          StoryID: { in: storyIds },
          UserID: userId,
        },
      });

      if (validStories !== storyIds.length) {
        return res.status(403).json({ error: "Invalid stories provided" });
      }

      updateData.Stories = { set: storyIds.map((id) => ({ StoryID: id })) };
    }

    // Perform the update only if there's something to update
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
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete Highlight
const deleteHighlight = async (req, res) => {
  try {
    const highlightId = parseInt(req.params.highlightId);
    const userId = req.user.UserID;

    // Verify highlight exists and belongs to user
    const highlight = await prisma.highlight.findFirst({
      where: {
        HighlightID: highlightId,
        UserID: userId,
      },
    });

    if (!highlight) {
      const exists = await prisma.highlight.count({
        where: { HighlightID: highlightId },
      });

      return res.status(exists ? 403 : 404).json({
        error: exists ? "You don't own this highlight" : "Highlight not found",
      });
    }

    // Delete using transaction for safety
    await prisma.$transaction([
      // First: Remove all story relations
      prisma.highlight.update({
        where: { HighlightID: highlightId },
        data: { Stories: { set: [] } },
      }),
      // Second: Delete the highlight
      prisma.highlight.delete({
        where: { HighlightID: highlightId },
      }),
    ]);

    res.json({
      success: true,
      message: "Highlight deleted successfully",
      deletedId: highlightId,
    });
  } catch (error) {
    res.status(500).json({
      error: "Deletion failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
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
