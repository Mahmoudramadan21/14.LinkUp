require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const app = require("./src/app"); // Correct path to app.js
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
