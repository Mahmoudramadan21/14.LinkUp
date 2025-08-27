require("dotenv").config({ path: "../.env" });
const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const configureSocket = require("./server.js");
const routes = require("./routes/index.js");
const setupSwagger = require("./docs/swagger.js");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { startRedisCleanup } = require("./utils/redisCleanup");

const app = express();
const httpServer = createServer(app);

// Add cookie-parser middleware
app.use(cookieParser());

// Parse JSON and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS configuration
app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:8000" ||
      "http://192.168.1.5:8000/",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true, // Allow cookies to be sent
  })
);

// Swagger setup
setupSwagger(app);

// Routes
app.use("/api", routes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "LinkUp Server is Running!" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error(
      "JSON parsing error:",
      err.message,
      "Body:",
      req.body,
      "Raw:",
      req.rawBody
    );
    return res.status(400).json({ error: "Invalid JSON format" });
  }
  console.error("Error stack:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// Socket.IO setup
const io = configureSocket(httpServer);
app.set("io", io);

// Start Redis cleanup job
startRedisCleanup();

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO ready on port ${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});
