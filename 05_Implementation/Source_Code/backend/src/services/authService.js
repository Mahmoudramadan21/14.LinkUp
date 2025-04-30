const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const prisma = require("../utils/prisma");
const redis = require("../utils/redis");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");

// Encryption key (should be stored in environment variables in production)
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "your-32-char-long-secret-key-here";
const IV_LENGTH = 16;

// Fixed cookie name for sessionId (obfuscated but constant)
const SESSION_COOKIE_NAME = "qkz7m4p8v2";

/**
 * Encrypts the given text using AES-256-CBC
 * @param {string} text - The text to encrypt
 * @returns {string} The encrypted text with IV
 */
const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

/**
 * Decrypts the given encrypted text using AES-256-CBC
 * @param {string} text - The encrypted text with IV
 * @returns {string} The decrypted text
 */
const decrypt = (text) => {
  const [iv, encryptedText] = text
    .split(":")
    .map((part) => Buffer.from(part, "hex"));
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

/**
 * Generates a random string in UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
 * @returns {string} Random string in UUID format
 */
const generateRandomString = () => {
  const chars = "0123456789abcdef";
  const segments = [8, 4, 4, 4, 12]; // UUID segment lengths
  const randomSegment = (length) =>
    Array.from({ length }, () => chars[Math.floor(Math.random() * 16)]).join(
      ""
    );
  return segments.map(randomSegment).join("-");
};

/**
 * Generates a random cookie name (10 characters, lowercase letters and numbers)
 * @returns {string} Random cookie name
 */
const generateRandomCookieName = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length: 10 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
};

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
 * @param {Object} params - Object containing profileName, username, email, password, gender, and dateOfBirth
 * @returns {Object} Created user object
 */
const register = async ({
  profileName,
  username,
  email,
  password,
  gender,
  dateOfBirth,
}) => {
  try {
    // Normalize dateOfBirth to UTC midnight to avoid timezone issues
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      throw new Error("Invalid date of birth format");
    }
    const normalizedDate = new Date(
      Date.UTC(dob.getFullYear(), dob.getMonth(), dob.getDate())
    );

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        ProfileName: profileName,
        Username: username,
        Email: email,
        Password: hashedPassword,
        Gender: gender,
        DateOfBirth: normalizedDate, // Use normalized date
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
 * Authenticates a user, stores tokens in Redis with a session ID, sets session ID as a secure cookie with a fixed name,
 * and adds dummy cookies for obfuscation
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

  // Generate a unique session ID
  const sessionId = uuidv4();

  // Generate a random cookie name for additional obfuscation
  const randomCookieName = generateRandomCookieName();

  // Encrypt the tokens before storing in Redis
  const encryptedAccessToken = encrypt(accessToken);
  const encryptedRefreshToken = encrypt(refreshToken);

  // Store encrypted tokens and the random cookie name in Redis with the session ID
  await redis.set(
    `session:${sessionId}`,
    JSON.stringify({
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      userId: user.UserID,
      randomCookieName: randomCookieName, // Store the random cookie name for logout
    }),
    "EX",
    7 * 24 * 60 * 60 // 7 days in seconds
  );

  // Set session ID as a secure cookie with the fixed name
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  // Set the sessionId in a cookie with a fixed, obfuscated name
  res.cookie(SESSION_COOKIE_NAME, sessionId, cookieOptions);

  // Also set the sessionId in a cookie with a random name for obfuscation
  res.cookie(randomCookieName, sessionId, cookieOptions);

  // Add dummy cookies for obfuscation (same format as sessionId)
  const dummyCookieNames = Array.from({ length: 5 }, () =>
    generateRandomCookieName()
  );
  dummyCookieNames.forEach((name) => {
    const dummyValue = generateRandomString(); // Generate a UUID-like string
    res.cookie(name, dummyValue, cookieOptions);
  });

  return {
    user: { UserID: user.UserID, Username: user.Username },
  };
};

/**
 * Removes a user's session from Redis and clears session ID cookie and dummy cookies
 * @param {number} userId - ID of the user to logout
 * @param {Object} res - Express response object to clear cookies
 */
const logout = async (userId, res) => {
  try {
    const sessionId = res.req.cookies[SESSION_COOKIE_NAME];
    if (sessionId) {
      const sessionData = await redis.get(`session:${sessionId}`);
      if (sessionData) {
        const { randomCookieName } = JSON.parse(sessionData);
        await redis.del(`session:${sessionId}`);
        console.log(`Deleted session:${sessionId} from Redis`);

        // Clear the fixed session ID cookie
        res.clearCookie(SESSION_COOKIE_NAME);

        // Clear the random cookie that also contains the sessionId
        if (randomCookieName) {
          res.clearCookie(randomCookieName);
        }

        // Clear all other cookies (since all other cookie names are random, we assume they are dummy)
        Object.keys(res.req.cookies).forEach((cookieName) => {
          if (
            cookieName !== SESSION_COOKIE_NAME &&
            cookieName !== randomCookieName
          ) {
            res.clearCookie(cookieName);
          }
        });
      }
    }
  } catch (error) {
    console.error("Logout error:", error.message);
    throw new Error(`Logout failed: ${error.message}`);
  }
};

module.exports = { register, login, logout };
