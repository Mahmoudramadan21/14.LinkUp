require("dotenv").config({ path: "../.env" });
const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const configureSocket = require("./server.js");
const routes = require("./routes/index.js");
const setupSwagger = require("./docs/swagger.js");

const app = express();
const httpServer = createServer(app);

// Log raw request body for debugging
app.use((req, res, next) => {
  if (
    req.method === "POST" &&
    req.headers["content-type"] === "application/json"
  ) {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      console.log("Raw request body:", data);
      req.rawBody = data;
    });
    next();
  } else {
    next();
  }
});

// Middleware
app.use(
  cors({
    origin: "http://localhost:3001",
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
  console.error("Error stack:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// Configure Socket.IO
const io = configureSocket(httpServer);

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO ready on port ${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});
