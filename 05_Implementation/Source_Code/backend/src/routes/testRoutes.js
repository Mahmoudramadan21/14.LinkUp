// Import express
const express = require("express");
const router = express.Router();

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Test API endpoint
 *     tags: [Test]
 *     description: Returns a test message
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Test endpoint working!
 */
router.get("/test", (req, res) => {
  res.json({ message: "Test endpoint working!" });
});

// Export the router
module.exports = router;
