const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const setupSwagger = require("./docs/swagger.js");
const routes = require("./routes/index.js");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Setup Swagger UI (must come before catch-all routes)
setupSwagger(app);

// API Routes
app.use("/api", routes);

// Default route (keep this after Swagger and API routes)
app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to LinkUp API" });
});

// Catch-all route (must be the last route)
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

module.exports = app;
