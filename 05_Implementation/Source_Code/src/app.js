const express = require("express");
const authRoutes = require("./routes/authRoutes"); // Correct import
const errorHandler = require("./middleware/errorHandler"); // Import error handler

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Error handler (must be after all routes)
app.use(errorHandler);

module.exports = app;
