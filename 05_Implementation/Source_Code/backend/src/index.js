require("dotenv").config({ path: "../.env" });
const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const configureSocket = require("./server.js");
const routes = require("./routes/index.js");
const setupSwagger = require("./docs/swagger.js");
const bodyParser = require("body-parser");

const app = express();
const httpServer = createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

setupSwagger(app);
app.use("/api", routes);

app.get("/", (req, res) => {
  res.json({ status: "OK", message: "LinkUp Server is Running!" });
});

app.use((err, req, res, next) => {
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

const io = configureSocket(httpServer);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO ready on port ${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});
