const prisma = require("./prisma");

// Validate username
const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/; // Alphanumeric and underscore, 3-20 characters
  return usernameRegex.test(username);
};

// Validate email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email format validation
  return emailRegex.test(email);
};

// Validate password
const validatePassword = (password) => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  // At least one uppercase, one lowercase, one number, one special character, and minimum 8 characters
  return passwordRegex.test(password);
};

const URL_REGEX = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i;
const IMAGE_EXT_REGEX = /\.(jpeg|jpg|png|webp)$/i;

// Validate image URL and image ext
const validateImageUrl = (url) => {
  if (!URL_REGEX.test(url)) return false;
  if (!IMAGE_EXT_REGEX.test(url)) return false;
  return true;
};

// Validate highlight title
const validateHighlightTitle = (title) => {
  return title.length >= 2 && title.length <= 50;
};

const isValidUserId = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { UserID: parseInt(userId) },
    select: { UserID: true },
  });
  return !!user;
};

module.exports = {
  validateUsername,
  validateEmail,
  validatePassword,
  validateImageUrl,
  validateHighlightTitle,
  isValidUserId,
};
