const express = require("express");
const {
  updateProfile,
  changePassword,
  getProfile,
  updatePrivacySettings,
  deleteProfile,
  getSavedPosts,
} = require("../controllers/profileController");
const { validate } = require("../middleware/validationMiddleware");
const {
  updateProfileValidationRules,
  changePasswordValidationRules,
  updatePrivacySettingsValidationRules,
} = require("../validators/profileValidators");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the user's profile information.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
// Route to get user profile
router.get("/", authMiddleware, getProfile);

/**
 * @swagger
 * /api/profile/edit:
 *   put:
 *     summary: Update user profile
 *     description: Update the user's profile information (username, email, bio, profile picture).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               bio:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 profile:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
// Route to update user profile
router.put(
  "/edit",
  authMiddleware,
  updateProfileValidationRules,
  validate,
  updateProfile
);

/**
 * @swagger
 * /api/profile/change-password:
 *   put:
 *     summary: Change user password
 *     description: Change the user's password by verifying the old password.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input or old password is incorrect
 *       401:
 *         description: Unauthorized
 */
// Route to change user password
router.put(
  "/change-password",
  authMiddleware,
  changePasswordValidationRules,
  validate,
  changePassword
);

/**
 * @swagger
 * /api/profile/privacy:
 *   put:
 *     summary: Update privacy settings
 *     description: Update the user's privacy settings (e.g., make account private or public).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPrivate:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Privacy settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
// Route to update privacy settings
router.put(
  "/privacy",
  authMiddleware,
  updatePrivacySettingsValidationRules,
  validate,
  updatePrivacySettings
);

/**
 * @swagger
 * /api/profile:
 *   delete:
 *     summary: Delete user profile
 *     description: Delete the user's profile and all associated data.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
// Route to delete user profile
router.delete("/", authMiddleware, deleteProfile);

/**
 * @swagger
 * /api/profile/saved-posts:
 *   get:
 *     summary: Get saved posts
 *     description: Retrieve the posts saved by the user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       401:
 *         description: Unauthorized
 */
// Route to get saved posts
router.get("/saved-posts", authMiddleware, getSavedPosts);

module.exports = router;
