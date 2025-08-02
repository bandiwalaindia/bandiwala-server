import express from "express";
import {
  createReview,
  getReviewsByTarget,
  getUserReviews,
  updateReview,
  deleteReview,
  flagReview,
  moderateReview,
  getPendingReviews,
  getOrderReviewStatus
} from "../controllers/reviewController.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// Create a new review (authenticated users only)
router.post("/", isAuthenticated, createReview);

// Get user's reviews (authenticated users only) - MUST come before /:targetType/:targetId
router.get("/user/my-reviews", isAuthenticated, getUserReviews);

// Get reviews for a specific target (MenuItem or Vendor)
router.get("/:targetType/:targetId", getReviewsByTarget);

// Update a review (authenticated users only)
router.put("/:reviewId", isAuthenticated, updateReview);

// Delete a review (authenticated users only)
router.delete("/:reviewId", isAuthenticated, deleteReview);

// Flag a review for moderation (authenticated users only)
router.post("/:reviewId/flag", isAuthenticated, flagReview);

// Moderate a review (admin only - you can add admin middleware here)
router.put("/:reviewId/moderate", isAuthenticated, moderateReview);

// Get pending reviews for moderation (admin only - you can add admin middleware here)
router.get("/moderation/pending", isAuthenticated, getPendingReviews);

// Get order review status (check which items can be reviewed from an order)
router.get("/order/:orderId/status", isAuthenticated, getOrderReviewStatus);

export default router;
