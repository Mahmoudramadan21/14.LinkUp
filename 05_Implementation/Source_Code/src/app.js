require("dotenv").config();

const express = require("express");
const swaggerSetup = require("./docs/swagger");
const routes = require("./routes/index");
const app = express();

// Add these essential middlewares BEFORE your routes
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing form data

// Configure Swagger
swaggerSetup(app);

// Mount your routes
app.use("/api", routes); // Make sure this matches your curl request path

module.exports = app;
