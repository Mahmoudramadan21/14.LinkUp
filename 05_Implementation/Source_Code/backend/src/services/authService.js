const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const prisma = require("../utils/prisma");
const redis = require("../utils/redis");

/**
 * Generates access and refresh tokens for a user
 * @param {Object} user - User object with UserID
 * @returns {Object} Object containing accessToken and refreshToken
 */
const generateTokens = (user) => {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT secrets not configured");
  }

  const accessToken = jwt.sign(
    { userId: user.UserID },
    process.env.JWT_SECRET,
    { expiresIn: "15m", issuer: "linkup-api" }
  );

  const refreshToken = jwt.sign(
    { userId: user.UserID },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d", issuer: "linkup-api" }
  );

  return { accessToken, refreshToken };
};

/**
 * Registers a new user with hashed password
 * @param {Object} params - Object containing username, email, and password
 * @returns {Object} Created user object
 */
const register = async ({ username, email, password }) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        Username: username,
        Email: email,
        Password: hashedPassword,
        Role: "USER",
      },
    });
    return { user };
  } catch (error) {
    console.error("Register error:", error.message);
    throw new Error(`Registration failed: ${error.message}`);
  }
};

/**
 * Authenticates a user, stores refresh token in Redis, and sets tokens as secure cookies
 * @param {string} usernameOrEmail - Username or email of the user
 * @param {string} password - User's password
 * @param {Object} res - Express response object to set cookies
 * @returns {Object} Object containing user data
 */
const login = async (usernameOrEmail, password, res) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { Username: usernameOrEmail },
        { Email: { equals: usernameOrEmail, mode: "insensitive" } },
      ],
    },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.Password);
  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const { accessToken, refreshToken } = generateTokens(user);

  // Store refresh token in Redis
  await redis.set(
    `refresh_token:${user.UserID}`,
    refreshToken,
    7 * 24 * 60 * 60
  );

  // Set secure cookies
  const cookieOptionsAccessToken = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
  };

  const cookieOptionsRefreshToken = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  };

  res.cookie("accessToken", accessToken, cookieOptionsAccessToken);
  res.cookie("refreshToken", refreshToken, cookieOptionsRefreshToken);

  return {
    user: { UserID: user.UserID, Username: user.Username },
  };
};

/**
 * Removes a user's refresh token from Redis and clears cookies
 * @param {number} userId - ID of the user to logout
 * @param {Object} res - Express response object to clear cookies
 */
const logout = async (userId, res) => {
  try {
    await redis.del(`refresh_token:${userId}`);
    console.log(`Deleted refresh_token:${userId} from Redis`);

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
  } catch (error) {
    console.error("Logout error:", error.message);
    throw new Error(`Logout failed: ${error.message}`);
  }
};

module.exports = { register, login, logout };
