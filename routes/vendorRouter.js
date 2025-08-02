import express from "express";
import {
  getAllVendors,
  getVendorById,
  getVendorBySlug,
  searchVendors,
  getVendorDashboard,
  updateVendorStatus,
  getVendorMenuItems,
  updateMenuItemAvailability,
  getVendorProfile,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getVendorOrders,
  updateOrderStatus,
  getPendingVendorRequests
} from "../controllers/vendorController.js";
import { isAuthenticated, isVendor, isVendorOrAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get all vendors
router.get("/", getAllVendors);

// Search vendors
router.get("/search", searchVendors);

// Get vendor by slug
router.get("/slug/:slug", getVendorBySlug);

// Get vendor dashboard data
router.get("/:vendorId/dashboard", getVendorDashboard);

// Get vendor menu items
router.get("/:vendorId/menu-items", getVendorMenuItems);

// Update vendor status
router.patch("/:vendorId/status", updateVendorStatus);

// Update menu item availability
router.patch("/:vendorId/menu-items/:itemId/availability", updateMenuItemAvailability);

// Get vendor by ID
router.get("/:id", getVendorById);

// Vendor-specific authenticated routes
router.get("/profile/me", isAuthenticated, isVendor, getVendorProfile);
router.get("/orders/my-orders", isAuthenticated, isVendor, getVendorOrders);
router.get("/orders/pending-requests", isAuthenticated, isVendor, getPendingVendorRequests);
router.put("/orders/:orderId/status", isAuthenticated, isVendor, updateOrderStatus);

// Menu item management for vendors
router.post("/menu-items", isAuthenticated, isVendor, addMenuItem);
router.put("/menu-items/:itemId", isAuthenticated, isVendor, updateMenuItem);
router.delete("/menu-items/:itemId", isAuthenticated, isVendor, deleteMenuItem);

export default router;
