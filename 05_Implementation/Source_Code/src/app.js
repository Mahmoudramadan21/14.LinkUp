const express = require("express");
const swaggerSetup = require("./docs/swagger");
const routes = require("./routes/index");
const app = express();

// Setup Swagger for API documentation
swaggerSetup(app);

// Middleware to parse JSON requests
app.use(express.json());

// Use the routes defined in the routes folder
app.use("/api", routes);

// Export the app for use in server.js
module.exports = app;
