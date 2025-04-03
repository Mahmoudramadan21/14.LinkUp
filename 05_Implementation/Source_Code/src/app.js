const express = require("express");
const swaggerSetup = require("./docs/swagger");
const routes = require("./routes/index");
const app = express();

/**
 * Configures Swagger for API documentation
 * @param {Express} app - The Express application instance
 */
swaggerSetup(app);

// Middleware to parse JSON requests
app.use(express.json());

/**
 * Mounts all API routes under the /api prefix
 * Routes are defined in the routes/index module
 */
app.use("/api", routes);

// Export the app for use in server.js or testing
module.exports = app;
