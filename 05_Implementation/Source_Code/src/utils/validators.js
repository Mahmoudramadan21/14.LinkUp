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

module.exports = { validateUsername, validateEmail, validatePassword };
