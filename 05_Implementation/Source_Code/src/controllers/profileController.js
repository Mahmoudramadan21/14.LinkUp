const prisma = require("../utils/prisma");
const bcrypt = require("bcryptjs");

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

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  updatePrivacySettings,
  deleteProfile,
  getSavedPosts,
};
