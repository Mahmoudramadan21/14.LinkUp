const express = require("express");
const {
  getProfile,
  updateProfile,
  changePassword,
  updatePrivacySettings,
  deleteProfile,
  getSavedPosts,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  acceptFollowRequest,
  rejectFollowRequest,
  getPendingFollowRequests,
} = require("../controllers/profileController");
const { validate } = require("../middleware/validationMiddleware");
const {
  updateProfileValidationRules,
  changePasswordValidationRules,
  updatePrivacySettingsValidationRules,
  userIdParamValidator,
  followActionValidator,
} = require("../validators/profileValidators");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile management
 */

/**
 * @swagger
 * /api/profile:
 *   get:
 *     tags: [Profile]
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
router.get("/", authMiddleware, getProfile);

/**
 * @swagger
 * /api/profile/edit:
 *   put:
 *     tags: [Profile]
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
 *     tags: [Profile]
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
 *     tags: [Profile]
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
 *     tags: [Profile]
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
router.delete("/", authMiddleware, deleteProfile);

/**
 * @swagger
 * /api/profile/saved-posts:
 *   get:
 *     tags: [Profile]
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
router.get("/saved-posts", authMiddleware, getSavedPosts);

/**
 * @swagger
 * /api/profile/follow/{userId}:
 *   post:
 *     tags: [Profile]
 *     summary: Follow a user
 *     description: |
 *       Follow another user. If the target account is private, this will send a follow request.
 *       For public accounts, the follow will be immediate.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to follow
 *     responses:
 *       201:
 *         description: Followed successfully or request sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [PENDING, ACCEPTED]
 *       400:
 *         description: Validation error or cannot follow yourself
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Private account
 *       404:
 *         description: User not found
 *       409:
 *         description: Already following or request pending
 *       429:
 *         description: Too many requests
 */
router.post(
  "/follow/:userId",
  authMiddleware,
  userIdParamValidator,
  followActionValidator,
  validate,
  followUser
);

/**
 * @swagger
 * /api/profile/follow-requests/pending:
 *   get:
 *     tags: [Profile]
 *     summary: Get pending follow requests
 *     description: Retrieve a list of pending follow requests for private accounts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending follow requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 requests:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FollowRequest'
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/follow-requests/pending",
  authMiddleware,
  getPendingFollowRequests
);

/**
 * @swagger
 * /api/profile/follow-requests/{requestId}/accept:
 *   put:
 *     tags: [Profile]
 *     summary: Accept follow request
 *     description: Accept a pending follow request for a private account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the follow request to accept
 *     responses:
 *       200:
 *         description: Follow request accepted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 follower:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Follow request not found or already processed
 */
router.put(
  "/follow-requests/:requestId/accept",
  authMiddleware,
  acceptFollowRequest
);

/**
 * @swagger
 * /api/profile/follow-requests/{requestId}/reject:
 *   delete:
 *     tags: [Profile]
 *     summary: Reject follow request
 *     description: Reject a pending follow request for a private account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the follow request to reject
 *     responses:
 *       200:
 *         description: Follow request rejected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 followerId:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Follow request not found or already processed
 */
router.delete(
  "/follow-requests/:requestId/reject",
  authMiddleware,
  rejectFollowRequest
);

/**
 * @swagger
 * /api/profile/unfollow/{userId}:
 *   delete:
 *     tags: [Profile]
 *     summary: Unfollow a user
 *     description: Stop following another user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to unfollow
 *     responses:
 *       200:
 *         description: Unfollowed successfully
 *       400:
 *         description: Cannot unfollow yourself
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Relationship not found
 */
router.delete(
  "/unfollow/:userId",
  authMiddleware,
  userIdParamValidator,
  validate,
  unfollowUser
);

/**
 * @swagger
 * /api/profile/followers/{userId}:
 *   get:
 *     tags: [Profile]
 *     summary: Get user's followers
 *     description: Retrieve a list of users who follow the specified user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user whose followers to retrieve
 *     responses:
 *       200:
 *         description: List of followers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 followers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Follower'
 *       403:
 *         description: Private account - cannot view followers
 *       404:
 *         description: User not found
 */
router.get(
  "/followers/:userId",
  userIdParamValidator,
  authMiddleware,
  validate,
  getFollowers
);

/**
 * @swagger
 * /api/profile/following/{userId}:
 *   get:
 *     tags: [Profile]
 *     summary: Get users followed by a user
 *     description: Retrieve a list of users that the specified user is following
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user whose following list to retrieve
 *     responses:
 *       200:
 *         description: List of followed users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 following:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Follower'
 *       403:
 *         description: Private account - cannot view following list
 *       404:
 *         description: User not found
 */
router.get(
  "/following/:userId",
  authMiddleware,
  userIdParamValidator,
  validate,
  getFollowing
);

module.exports = router;
