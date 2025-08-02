import express from "express";
import {
  getUserOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getOrderTimer,
  updateUserLocation,
  getUserLocation,
  getTrackingStatus
} from "../controllers/orderController.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// All order routes require authentication
router.use(isAuthenticated);

// Get all orders for the authenticated user
router.get("/", getUserOrders);

// Get a specific order by ID
router.get("/:id", getOrderById);

// Create a new order
router.post("/", createOrder);

// Update order status (for testing/admin purposes)
router.put("/:id/status", isAuthenticated, updateOrderStatus);

// Debug endpoint to manually trigger delivery assignment
router.post("/:id/assign-delivery", isAuthenticated, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { default: socketService } = await import('../services/socketService.js');

    console.log(`🔧 Manual delivery assignment triggered for order ${id}`);
    await socketService.assignOrderToDeliveryPartners(id);

    res.json({
      success: true,
      message: 'Delivery assignment triggered'
    });
  } catch (error) {
    console.error('Error in manual delivery assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger delivery assignment'
    });
  }
});

// Get order timer (remaining time until delivery)
router.get("/:id/timer", isAuthenticated, getOrderTimer);

// Real-time location tracking
router.post("/update-user-location", updateUserLocation);
router.get("/:orderId/user-location", getUserLocation);
router.get("/:orderId/tracking-status", getTrackingStatus);

// Cancel functionality removed as per requirements

export default router;
