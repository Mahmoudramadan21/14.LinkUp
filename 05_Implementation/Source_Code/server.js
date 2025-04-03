require("dotenv").config(); // Load environment variables from .env file
const app = require("./src/app");

/**
 * Server configuration and startup
 * - Uses PORT from environment variables or defaults to 3000
 * - Sets up process warning handlers
 * - Adjusts EventEmitter listener limit for scalability
 */
const PORT = process.env.PORT || 3000; // Default to port 3000 if not specified

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle process warnings (memory leaks, deprecations, etc.)
process.on("warning", (warning) => {
  console.warn(warning);
});

// Increase default EventEmitter listener limit to prevent warning spam
require("events").EventEmitter.defaultMaxListeners = 20;
