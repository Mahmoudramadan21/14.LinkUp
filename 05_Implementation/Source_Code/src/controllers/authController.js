const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../utils/prisma"); // Import Prisma client
const { sendResetEmail } = require("../services/emailService"); // Import email service

// Sign-up logic
const signup = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if the email or username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ Email: email }, { Username: username }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email or username already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await prisma.user.create({
      data: {
        Username: username,
        Email: email,
        Password: hashedPassword,
      },
    });

    // Return success response
    res.status(201).json({
      message: "User registered successfully",
      userId: newUser.UserID,
    });
  } catch (error) {
    console.error("Error in signup:", error);
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
};

// Login logic
const login = async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  try {
    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ Username: usernameOrEmail }, { Email: usernameOrEmail }],
      },
    });

    // If user not found or password is incorrect, return a generic error message
    if (!user || !(await bcrypt.compare(password, user.Password))) {
      return res
        .status(401)
        .json({ message: "Invalid username/email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.UserID, email: user.Email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Return success response with token
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

// Forgot password logic
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { Email: email },
    });

    // If user exists, generate and save reset token
    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(20).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000); // Token valid for 1 hour

      // Save reset token and expiry in the database
      await prisma.user.update({
        where: { UserID: user.UserID },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      // Send reset link to the user's email
      const resetLink = `http://localhost:3000/api/auth/reset-password?token=${resetToken}`;
      await sendResetEmail(email, resetLink); // Call the email service
    }

    // Always return the same message, regardless of whether the email exists or not
    res.status(200).json({
      message: "If the email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res
      .status(500)
      .json({ message: "Error sending reset link", error: error.message });
  }
};

// Reset password logic
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Find user by reset token and check if it's still valid
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }, // Check if the token is still valid
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password and clear the reset token
    await prisma.user.update({
      where: { UserID: user.UserID },
      data: {
        Password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res
      .status(500)
      .json({ message: "Error resetting password", error: error.message });
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
};
