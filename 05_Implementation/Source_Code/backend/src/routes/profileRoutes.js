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
  getUserPosts,
  getUserStories,
  getUserSuggestions,
  getProfileByUsername,
} = require("../controllers/profileController");
const { validate } = require("../middleware/validationMiddleware");
const {
  updateProfileValidationRules,
  changePasswordValidationRules,
  updatePrivacySettingsValidationRules,
  userIdParamValidator,
  followActionValidator,
  suggestionsQueryValidator,
  usernameParamValidator,
} = require("../validators/profileValidators");
const { authMiddleware } = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         userId:
 *           type: integer
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         profilePicture:
 *           type: string
 *           nullable: true
 *         coverPicture:
 *           type: string
 *           nullable: true
 *         bio:
 *           type: string
 *           nullable: true
 *         address:
 *           type: string
 *           nullable: true
 *         jobTitle:
 *           type: string
 *           nullable: true
 *         dateOfBirth:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         isPrivate:
 *           type: boolean
 *         role:
 *           type: string
 *           enum: [USER, ADMIN]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         postCount:
 *           type: integer
 *         followerCount:
 *           type: integer
 *         followingCount:
 *           type: integer
 *         likeCount:
 *           type: integer
 */

/**
 * @swagger
 * /profile:
 *   get:
 *     tags: [Profile]
 *     summary: Get user profile
 *     description: Retrieve the user's profile information, including counts for posts, followers, following, and likes.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.get("/", authMiddleware, getProfile);

/**
 * @swagger
 * /profile/edit:
 *   put:
 *     tags: [Profile]
 *     summary: Update user profile
 *     description: Update the user's profile information (username, email, bio, address, job title, date of birth, profile picture, cover picture) using form data.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Unique username
 *               email:
 *                 type: string
 *                 description: Unique email address
 *               bio:
 *                 type: string
 *                 description: User biography
 *               address:
 *                 type: string
 *                 description: User's address
 *               jobTitle:
 *                 type: string
 *                 description: User's job title
 *               dateOfBirth:
 *                 type: string
 *                 description: User's date of birth (e.g., YYYY-MM-DD)
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture file to upload
 *               coverPicture:
 *                 type: string
 *                 format: binary
 *                 description: Cover picture file to upload
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
 *         description: Invalid input or duplicate username/email
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put(
  "/edit",
  authMiddleware,
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "coverPicture", maxCount: 1 },
  ]),
  updateProfileValidationRules,
  validate,
  updateProfile
);

/**
 * @swagger
 * /profile/change-password:
 *   put:
 *     tags: [Profile]
 *     summary: Change user password
 *     description: Change the user's password by verifying the old password using form data.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 description: New password
 *             required:
 *               - oldPassword
 *               - newPassword
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
 *       404:
 *         description: User not found
 */
router.put(
  "/change-password",
  authMiddleware,
  upload.none(),
  changePasswordValidationRules,
  validate,
  changePassword
);

/**
 * @swagger
 * /profile/privacy:
 *   put:
 *     tags: [Profile]
 *     summary: Update privacy settings
 *     description: Update the user's privacy settings (e.g., make account private or public) using form data.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               isPrivate:
 *                 type: boolean
 *                 description: Whether the account is private
 *             required:
 *               - isPrivate
 *     responses:
 *       200:
 *         description: Privacy settings updated successfully
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
  "/privacy",
  authMiddleware,
  upload.none(),
  updatePrivacySettingsValidationRules,
  validate,
  updatePrivacySettings
);

/**
 * @swagger
 * /profile:
 *   delete:
 *     tags: [Profile]
 *     summary: Delete user profile
 *     description: Delete the user's profile and all associated data.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/", authMiddleware, deleteProfile);

/**
 * @swagger
 * /profile/posts/{userId}:
 *   get:
 *     summary: Get all posts by a specific user
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user whose posts to retrieve
 *     responses:
 *       200:
 *         description: List of user posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid user ID format
 *       403:
 *         description: Private account
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/posts/:userId", authMiddleware, getUserPosts);

/**
 * @swagger
 * /profile/stories:
 *   get:
 *     tags: [Profile]
 *     summary: Get all stories for the user
 *     description: Retrieve a list of all stories (expired and active) belonging to the authenticated user, including StoryID, MediaURL, and CreatedAt.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of stories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 stories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       storyId:
 *                         type: integer
 *                       mediaUrl:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/stories", authMiddleware, getUserStories);

/**
 * @swagger
 * /profile/saved-posts:
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
 * /profile/follow/{userId}:
 *   post:
 *     tags: [Profile]
 *     summary: Follow a user
 *     description: Follow another user using form data. If the target account is private, this will send a follow request. For public accounts, the follow will be immediate.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to follow
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of the user to follow (optional, overrides path param)
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
  upload.none(),
  userIdParamValidator,
  followActionValidator,
  validate,
  followUser
);

/**
 * @swagger
 * /profile/follow-requests/pending:
 *   get:
 *     tags: [Profile]
 *     summary: Get pending follow requests
 *     description: Retrieve a list of pending follow requests for private accounts.
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
 *                 pendingRequests:
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
 * /profile/follow-requests/{requestId}/accept:
 *   put:
 *     tags: [Profile]
 *     summary: Accept follow request
 *     description: Accept a pending follow request for a private account using form data.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the follow request to accept
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               requestId:
 *                 type: integer
 *                 description: ID of the follow request (optional, overrides path param)
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
 *                 acceptedFollowers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Follow request not found or already processed
 */
router.put(
  "/follow-requests/:requestId/accept",
  authMiddleware,
  upload.none(),
  acceptFollowRequest
);

/**
 * @swagger
 * /profile/follow-requests/{requestId}/reject:
 *   delete:
 *     tags: [Profile]
 *     summary: Reject follow request
 *     description: Reject a pending follow request for a private account.
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
 * /profile/unfollow/{userId}:
 *   delete:
 *     tags: [Profile]
 *     summary: Unfollow a user
 *     description: Stop following another user.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot unfollow yourself
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Follow relationship not found
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
 * /profile/followers/{userId}:
 *   get:
 *     tags: [Profile]
 *     summary: Get user's followers
 *     description: Retrieve a list of users who follow the specified user.
 *     security:
 *       - bearerAuth: []
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
 *                 count:
 *                   type: integer
 *                 followers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       403:
 *         description: Private account - cannot view followers
 *       404:
 *         description: User not found
 */
router.get(
  "/followers/:userId",
  authMiddleware,
  userIdParamValidator,
  validate,
  getFollowers
);

/**
 * @swagger
 * /profile/following/{userId}:
 *   get:
 *     tags: [Profile]
 *     summary: Get users followed by a user
 *     description: Retrieve a list of users that the specified user is following.
 *     security:
 *       - bearerAuth: []
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
 *                     $ref: '#/components/schemas/User'
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

/**
 * @swagger
 * /profile/suggestions:
 *   get:
 *     tags: [Profile]
 *     summary: Get user suggestions
 *     description: Retrieve a list of random users that the current user is not following, for follow suggestions.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 5
 *         description: Number of user suggestions to retrieve
 *     responses:
 *       200:
 *         description: List of user suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       profilePicture:
 *                         type: string
 *                         nullable: true
 *                       bio:
 *                         type: string
 *                         nullable: true
 *       400:
 *         description: Invalid limit parameter
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/suggestions",
  authMiddleware,
  suggestionsQueryValidator,
  validate,
  getUserSuggestions
);

/**
 * @swagger
 * /profile/{username}:
 *   get:
 *     tags: [Profile]
 *     summary: Get user profile by username
 *     description: Retrieve the profile of a user by their username, with privacy checks for private accounts.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the user whose profile to retrieve
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   $ref: '#/components/schemas/User'
 *       403:
 *         description: Private account - access denied
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get(
  "/:username",
  authMiddleware,
  usernameParamValidator,
  validate,
  getProfileByUsername
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         postId:
 *           type: integer
 *         content:
 *           type: string
 *         imageUrl:
 *           type: string
 *         videoUrl:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         user:
 *           type: object
 *           properties:
 *             UserID:
 *               type: integer
 *             Username:
 *               type: string
 *             ProfilePicture:
 *               type: string
 *         likeCount:
 *           type: integer
 *         commentCount:
 *           type: integer
 *     FollowRequest:
 *       type: object
 *       properties:
 *         requestId:
 *           type: integer
 *         user:
 *           type: object
 *           properties:
 *             UserID:
 *               type: integer
 *             Username:
 *               type: string
 *             ProfilePicture:
 *               type: string
 *             Bio:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

module.exports = router;
