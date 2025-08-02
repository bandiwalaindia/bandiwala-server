import express from "express";
import {
  getDashboardStats,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
  getReportsData,
  exportReportsData,
  getAppSettings,
  updateAppSettings,
  getAllVendorsAdmin,
  approveVendor,
  rejectVendor,
  blockVendor,
  unblockVendor,
  deleteVendor,
  getAllMenuItemsAdmin,
  updateMenuItemAdmin,
  deleteMenuItemAdmin,
  getAllReviewsAdmin,
  moderateReviewAdmin,
  deleteReviewAdmin,
  getVendorDetails,
} from "../controllers/adminController.js";
import {
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

// All admin routes require authentication and admin role
router.use(isAuthenticated, isAdmin);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// Orders Management
router.get("/orders", getAllOrdersAdmin);
router.put("/orders/:orderId/status", updateOrderStatusAdmin);

// Vendors Management
router.get("/vendors", getAllVendorsAdmin);
router.get("/vendors/:vendorId", getVendorDetails);
router.put("/vendors/:vendorId/approve", approveVendor);
router.put("/vendors/:vendorId/reject", rejectVendor);
router.put("/vendors/:vendorId/block", blockVendor);
router.put("/vendors/:vendorId/unblock", unblockVendor);
router.delete("/vendors/:vendorId", deleteVendor);

// Items Management
router.get("/items", getAllMenuItemsAdmin);
router.put("/items/:itemId", updateMenuItemAdmin);
router.delete("/items/:itemId", deleteMenuItemAdmin);

// Reviews Management
router.get("/reviews", getAllReviewsAdmin);
router.put("/reviews/:reviewId/moderate", moderateReviewAdmin);
router.delete("/reviews/:reviewId", deleteReviewAdmin);

// Feedback & Complaints Management
router.get("/feedback", getAllFeedbackAdmin);
router.get("/feedback/stats", getFeedbackStats);
router.get("/feedback/:id", getFeedbackByIdAdmin);
router.patch("/feedback/:id/status", updateFeedbackStatus);
router.post("/feedback/:id/respond", respondToFeedback);
router.post("/feedback/:id/note", addInternalNote);
router.delete("/feedback/:id", deleteFeedback);

// Reports
router.get("/reports", getReportsData);
router.get("/reports/export", exportReportsData);

// Settings
router.get("/settings", getAppSettings);
router.put("/settings", updateAppSettings);

export default router;
