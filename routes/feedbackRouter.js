import express from "express";
import {
  submitFeedback,
  getUserFeedback,
  getFeedbackById,
  getAllFeedbackAdmin,
  getFeedbackByIdAdmin,
  updateFeedbackStatus,
  respondToFeedback,
  addInternalNote,
  deleteFeedback,
  getFeedbackStats
} from "../controllers/feedbackController.js";
import { isAuthenticated, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public routes (require authentication)
router.use(isAuthenticated);

// Submit feedback or complaint
router.post("/submit", submitFeedback);

// Get user's own feedback history
router.get("/my-feedback", getUserFeedback);

// Get specific feedback by ID (user's own)
router.get("/my-feedback/:id", getFeedbackById);

// Admin routes
router.use(isAdmin);

// Get all feedback with filters and pagination
router.get("/admin/all", getAllFeedbackAdmin);

// Get feedback statistics
router.get("/admin/stats", getFeedbackStats);

// Get specific feedback by ID (admin view)
router.get("/admin/:id", getFeedbackByIdAdmin);

// Update feedback status and priority
router.patch("/admin/:id/status", updateFeedbackStatus);

// Respond to feedback
router.post("/admin/:id/respond", respondToFeedback);

// Add internal note
router.post("/admin/:id/note", addInternalNote);

// Delete feedback (soft delete)
router.delete("/admin/:id", deleteFeedback);

export default router;
