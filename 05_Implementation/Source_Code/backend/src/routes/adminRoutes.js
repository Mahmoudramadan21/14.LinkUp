const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { validate } = require("../middleware/validationMiddleware");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ReportedPost:
 *       type: object
 *       properties:
 *         postId:
 *           type: integer
 *         content:
 *           type: string
 *         reportCount:
 *           type: integer
 *         reporterUsernames:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     UserDetails:
 *       type: object
 *       properties:
 *         userId:
 *           type: integer
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [USER, ADMIN]
 *         isBanned:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     AdminAction:
 *       type: object
 *       properties:
 *         actionType:
 *           type: string
 *           enum: [DELETE_POST, WARN_USER, BAN_USER, DISMISS_REPORT]
 *         postId:
 *           type: integer
 *         userId:
 *           type: integer
 *         reason:
 *           type: string
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /admin/reports:
 *   get:
 *     summary: Get all reported posts
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reported posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ReportedPost'
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (not an admin)
 */
router.get("/reports", adminController.getReportedPosts);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserDetails'
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (not an admin)
 */
router.get("/users", adminController.getAllUsers);

/**
 * @swagger
 * /admin/users/{userId}:
 *   get:
 *     summary: Get user details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to retrieve
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserDetails'
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (not an admin)
 *       404:
 *         description: User not found
 */
router.get("/users/:userId", adminController.getUserDetails);

/**
 * @swagger
 * /admin/actions:
 *   post:
 *     summary: Take admin action
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminAction'
 *     responses:
 *       200:
 *         description: Action completed successfully
 *       400:
 *         description: Invalid action request
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (not an admin)
 *       404:
 *         description: Target not found (user/post)
 */
router.post("/actions", validate, adminController.takeAction);

module.exports = router;
