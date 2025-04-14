const prisma = require("../utils/prisma");
const {
  validateHighlightInput,
  validateHighlightUpdate,
} = require("../validators/highlightValidators");
const { validationResult } = require("express-validator");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");

/**
 * Creates a new highlight after validating:
 * - User owns all stories being added
 * - Input meets validation requirements
 * - Uploads cover image to Cloudinary
 */
const createHighlight = async (req, res) => {
  console.log("Request body:", req.body, "Files:", req.files); // Debug
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { title, storyIds } = req.body;
  const userId = req.user.UserID;
  let coverImageUrl;

  try {
    // Handle cover image upload
    const files = req.files || {};
    const coverImageFile = files.coverImage ? files.coverImage[0] : null;

    if (!coverImageFile) {
      return res.status(400).json({ error: "Cover image file is required" });
    }

    // Upload to Cloudinary
    await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "linkup/highlights", resource_type: "image" },
        (error, result) => {
          if (error) {
            console.error("Cloudinary error:", error);
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          }
          coverImageUrl = result.secure_url;
          resolve();
        }
      );

      const bufferStream = new Readable();
      bufferStream.push(coverImageFile.buffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream);
    });

    // Validate storyIds
    if (!Array.isArray(storyIds) || storyIds.length === 0) {
      return res
        .status(400)
        .json({ error: "storyIds must be a non-empty array" });
    }

    const parsedStoryIds = storyIds
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));
    if (parsedStoryIds.length !== storyIds.length) {
      return res.status(400).json({ error: "Invalid story IDs provided" });
    }

    // Verify user owns all stories
    console.log("Validating storyIds:", parsedStoryIds); // Debug
    const validStories = await prisma.story.count({
      where: { StoryID: { in: parsedStoryIds }, UserID: userId },
    });

    console.log("Valid stories count:", validStories); // Debug
    if (validStories !== parsedStoryIds.length) {
      return res.status(403).json({ error: "Unauthorized story access" });
    }

    // Create highlight
    const highlight = await prisma.highlight.create({
      data: {
        Title: title,
        CoverImage: coverImageUrl,
        UserID: userId,
        StoryHighlights: {
          create: parsedStoryIds.map((id) => ({ StoryID: id })),
        },
      },
      include: { StoryHighlights: { select: { StoryID: true } } },
    });

    res.status(201).json({
      ...highlight,
      Stories: highlight.StoryHighlights.map((sh) => ({ StoryID: sh.StoryID })),
    });
  } catch (error) {
    console.error("Create highlight error:", error);
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
        select: {
          HighlightID: true,
          Title: true,
          CoverImage: true,
          _count: { select: { StoryHighlights: true } },
        },
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
      select: {
        HighlightID: true,
        Title: true,
        CoverImage: true,
        _count: { select: { StoryHighlights: true } },
      },
    });

    res.json(highlights);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch highlights",
      details: process.env.NODE_ENV === "development" ? error.message : null,
    });
  }
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
        StoryHighlights: {
          include: { Story: { select: { StoryID: true, MediaURL: true } } },
        },
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
      return res.json({
        ...highlight,
        Stories: highlight.StoryHighlights.map((sh) => ({
          StoryID: sh.Story.StoryID,
          MediaURL: sh.Story.MediaURL,
        })),
      });
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

      updateData.StoryHighlights = {
        deleteMany: { HighlightID: parseInt(highlightId) },
        create: storyIds.map((id) => ({ StoryID: id })),
      };
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const updatedHighlight = await prisma.highlight.update({
      where: { HighlightID: parseInt(highlightId) },
      data: updateData,
      include: { StoryHighlights: { select: { StoryID: true } } },
    });

    res.json({
      ...updatedHighlight,
      Stories: updatedHighlight.StoryHighlights.map((sh) => ({
        StoryID: sh.StoryID,
      })),
    });
  } catch (error) {
    console.error("Update highlight error:", error);
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
      prisma.storyHighlight.deleteMany({ where: { HighlightID: highlightId } }),
      prisma.highlight.delete({ where: { HighlightID: highlightId } }),
    ]);

    res.json({
      success: true,
      message: "Highlight deleted successfully",
      deletedId: highlightId,
    });
  } catch (error) {
    console.error("Delete highlight error:", error);
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
