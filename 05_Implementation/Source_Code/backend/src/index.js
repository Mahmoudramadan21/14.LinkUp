const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") }); // Load .env from the root directory
const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const configureSocket = require("./server.js");
const routes = require("./routes/index.js");
const setupSwagger = require("./docs/swagger.js");
const {
  handleServerError,
  handleValidationError,
} = require("./utils/errorHandler");

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(express.json());

// Setup Swagger UI and JSON endpoints
setupSwagger(app);

// Routes
app.use("/api", routes);

// Default route
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "LinkUp Server is Running!" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    return handleValidationError(res, err);
  }
  handleServerError(res, err);
});

// Configure Socket.IO
const io = configureSocket(httpServer);
app.set("io", io); // Make io accessible to controllers

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO ready on port ${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});
