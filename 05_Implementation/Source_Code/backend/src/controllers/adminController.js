const prisma = require("../utils/prisma");
const { handleServerError } = require("../utils/errorHandler");

/**
 * Get all reported posts with pagination and filtering
 * @param {page, limit, status} - Query params
 */
const getReportedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "PENDING" } = req.query;

    // Validate status
    if (!["PENDING", "RESOLVED", "DISMISSED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const reports = await prisma.report.findMany({
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      where: { Status: status },
      include: {
        Post: {
          include: {
            User: { select: { UserID: true, Username: true } },
          },
        },
        Reporter: { select: { UserID: true, Username: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.report.count({ where: { Status: status } });

    res.json({
      data: reports,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    handleServerError(res, error, "Failed to fetch reported posts");
  }
};

/**
 * Get all users with pagination and search
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const users = await prisma.user.findMany({
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      where: {
        OR: [
          { Username: { contains: search, mode: "insensitive" } },
          { Email: { contains: search, mode: "insensitive" } },
        ],
      },
      select: {
        UserID: true,
        Username: true,
        Email: true,
        CreatedAt: true,
        _count: {
          select: {
            Posts: true,
            Reports: true, // Reports filed by the user
          },
        },
      },
      orderBy: { CreatedAt: "desc" },
    });

    const total = await prisma.user.count();

    res.json({
      data: users,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    handleServerError(res, error, "Failed to fetch users");
  }
};

/**
 * Get detailed user information
 */
const getUserDetails = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

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
        lastActive: true,
        IsBanned: true,
        BanReason: true,
        Posts: {
          take: 5,
          orderBy: { CreatedAt: "desc" },
          include: { _count: { select: { Likes: true, Comments: true } } },
        },
        _count: {
          select: {
            Posts: true,
            Followers: true,
            Following: true,
            Reports: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ data: user });
  } catch (error) {
    handleServerError(res, error, "Failed to fetch user details");
  }
};

/**
 * Take administrative action
 */
const takeAction = async (req, res) => {
  try {
    const { actionType, postId, userId, reason } = req.body;
    const adminId = req.user.UserID;

    // Validate inputs
    if (!actionType || (!postId && !userId) || !reason) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate actionType
    const validActions = [
      "DELETE_POST",
      "WARN_USER",
      "BAN_USER",
      "DISMISS_REPORT",
    ];
    if (!validActions.includes(actionType)) {
      return res.status(400).json({ error: "Invalid action type" });
    }

    // Create audit log
    const auditLog = await prisma.auditLog.create({
      data: {
        Action: actionType,
        AdminID: adminId,
        Details: JSON.stringify({ postId, userId, reason }),
      },
    });

    switch (actionType) {
      case "DELETE_POST":
        if (!postId) {
          return res
            .status(400)
            .json({ error: "Post ID required for DELETE_POST" });
        }
        const postExists = await prisma.post.findUnique({
          where: { PostID: parseInt(postId) },
        });
        if (!postExists) {
          return res.status(404).json({ error: "Post not found" });
        }
        await prisma.$transaction([
          prisma.post.delete({ where: { PostID: parseInt(postId) } }),
          prisma.report.updateMany({
            where: { PostID: parseInt(postId) },
            data: { Status: "RESOLVED" },
          }),
        ]);
        break;

      case "WARN_USER":
        if (!userId) {
          return res
            .status(400)
            .json({ error: "User ID required for WARN_USER" });
        }
        const userExistsWarn = await prisma.user.findUnique({
          where: { UserID: parseInt(userId) },
        });
        if (!userExistsWarn) {
          return res.status(404).json({ error: "User not found" });
        }
        await prisma.notification.create({
          data: {
            UserID: parseInt(userId),
            Type: "ADMIN_WARNING", // Ensure this is added to NotificationType enum
            Content: reason,
            Metadata: { AdminID: adminId, AuditLogID: auditLog.AuditLogID },
          },
        });
        break;

      case "BAN_USER":
        if (!userId) {
          return res
            .status(400)
            .json({ error: "User ID required for BAN_USER" });
        }
        const userExistsBan = await prisma.user.findUnique({
          where: { UserID: parseInt(userId) },
        });
        if (!userExistsBan) {
          return res.status(404).json({ error: "User not found" });
        }
        await prisma.user.update({
          where: { UserID: parseInt(userId) },
          data: { Role: "BANNED", Bio: `Banned: ${reason}` }, // Using Role or Bio as a workaround
        });
        break;

      case "DISMISS_REPORT":
        if (!postId) {
          return res
            .status(400)
            .json({ error: "Post ID required for DISMISS_REPORT" });
        }
        const reportExists = await prisma.report.findFirst({
          where: { PostID: parseInt(postId) },
        });
        if (!reportExists) {
          return res.status(404).json({ error: "Report not found" });
        }
        await prisma.report.updateMany({
          where: { PostID: parseInt(postId) },
          data: { Status: "DISMISSED" },
        });
        break;

      default:
        return res.status(400).json({ error: "Invalid action type" });
    }

    res.json({ success: true, auditLogId: auditLog.AuditLogID });
  } catch (error) {
    handleServerError(res, error, "Failed to execute admin action");
  }
};

module.exports = {
  getReportedPosts,
  getAllUsers,
  getUserDetails,
  takeAction,
};
