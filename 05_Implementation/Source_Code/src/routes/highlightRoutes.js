const {
  createHighlight,
  getUserHighlights,
  getHighlightDetails,
  updateHighlight,
  deleteHighlight,
} = require("../controllers/highlightController");
const authMiddleware = require("../middleware/authMiddleware");
const {
  validateHighlightInput,
  validateHighlightUpdate,
} = require("../validators/highlightValidators");
const express = require("express");
const router = express.Router();

// Create
router.post("/", authMiddleware, validateHighlightInput, createHighlight);

// Read
router.get("/user/:userId", authMiddleware, getUserHighlights);
router.get("/:highlightId", authMiddleware, getHighlightDetails);

// Update
router.put(
  "/:highlightId",
  authMiddleware,
  validateHighlightUpdate,
  updateHighlight
);

// Delete
router.delete("/:highlightId", authMiddleware, deleteHighlight);

module.exports = router;
