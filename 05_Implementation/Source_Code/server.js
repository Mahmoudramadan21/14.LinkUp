require("dotenv").config(); // Load environment variables from .env file
const app = require("./src/app");
const PORT = process.env.PORT || 3000;

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
