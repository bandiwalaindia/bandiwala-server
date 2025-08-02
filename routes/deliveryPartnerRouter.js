import express from "express";
import {
  getDeliveryPartnerProfile,
  updateDeliveryPartnerProfile,
  getAssignedOrders,
  updateOrderStatus,
  getOrderHistory,
  getDeliveryStats,
  toggleAvailability,
  getAvailableOrders,
  acceptOrder,
  acceptOrderAssignment,
  rejectOrderAssignment,
  getCurrentDelivery
} from "../controllers/deliveryPartnerController.js";
import { isAuthenticated, isDeliveryPartner } from "../middleware/auth.js";

const router = express.Router();

// All delivery partner routes require authentication and delivery partner role
router.use(isAuthenticated, isDeliveryPartner);

// Profile management
router.get("/profile", getDeliveryPartnerProfile);
router.put("/profile", updateDeliveryPartnerProfile);

// Order management
router.get("/orders/assigned", getAssignedOrders);
router.get("/orders/available", getAvailableOrders);
router.get("/orders/history", getOrderHistory);
router.get("/orders/current", getCurrentDelivery);
router.post("/orders/:orderId/accept", acceptOrder);
router.post("/orders/:orderId/accept-assignment", acceptOrderAssignment);
router.post("/orders/:orderId/reject-assignment", rejectOrderAssignment);
router.put("/orders/:orderId/status", updateOrderStatus);

// Stats and availability
router.get("/stats", getDeliveryStats);
router.put("/availability", toggleAvailability);

// Debug endpoints
router.get("/debug/connection-status", async (req, res) => {
  try {
    const { default: socketService } = await import('../services/socketService.js');
    const { User } = await import('../models/usermodel.js');

    const connectionStatus = socketService.getDeliveryPartnerConnectionStatus();

    // Get all delivery partners from database
    const allDeliveryPartners = await User.find({ role: 'deliveryPartner' })
      .select('name phone deliveryPartnerData')
      .lean();

    const availableDeliveryPartners = allDeliveryPartners.filter(dp =>
      dp.deliveryPartnerData?.isAvailable === true
    );

    res.json({
      success: true,
      data: {
        socket: connectionStatus,
        database: {
          totalDeliveryPartners: allDeliveryPartners.length,
          availableDeliveryPartners: availableDeliveryPartners.length,
          availablePartners: availableDeliveryPartners.map(dp => ({
            id: dp._id,
            name: dp.name,
            phone: dp.phone,
            isAvailable: dp.deliveryPartnerData?.isAvailable,
            isConnected: connectionStatus.connectedPartners.includes(dp._id.toString())
          }))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get debug info',
      error: error.message
    });
  }
});

router.post("/debug/trigger-assignment/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { default: socketService } = await import('../services/socketService.js');

    await socketService.debugAssignOrder(orderId);

    res.json({
      success: true,
      message: `Manually triggered delivery assignment for order ${orderId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger assignment',
      error: error.message
    });
  }
});

router.get("/debug/order-status/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const Order = (await import('../models/Order.js')).default;

    const order = await Order.findById(orderId)
      .populate('user', 'name phone')
      .populate('deliveryPartner', 'name phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        deliveryPartner: order.deliveryPartner,
        statusTimeline: order.statusTimeline,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get order status',
      error: error.message
    });
  }
});

// Debug endpoint to check current delivery partner status
router.get("/debug/my-status", async (req, res) => {
  try {
    const { User } = await import("../models/usermodel.js");
    const { default: socketService } = await import('../services/socketService.js');
    const Order = (await import('../models/Order.js')).default;

    const deliveryPartner = await User.findById(req.user._id);

    // Get current assigned orders
    const assignedOrders = await Order.find({
      deliveryPartner: req.user._id,
      orderStatus: { $in: ['out_for_delivery'] }
    }).select('orderNumber orderStatus createdAt');

    // Get available orders
    const availableOrders = await Order.find({
      orderStatus: 'preparing',
      $or: [
        { deliveryPartner: { $exists: false } },
        { deliveryPartner: null }
      ]
    }).select('orderNumber orderStatus createdAt').limit(5);

    res.json({
      success: true,
      data: {
        deliveryPartner: {
          id: deliveryPartner._id,
          name: deliveryPartner.name,
          phone: deliveryPartner.phone,
          role: deliveryPartner.role,
          deliveryPartnerData: deliveryPartner.deliveryPartnerData,
          isAuthenticated: true,
          isConnectedToSocket: socketService.isDeliveryPartnerOnline(deliveryPartner._id.toString()),
        },
        currentOrders: {
          assigned: assignedOrders,
          available: availableOrders
        },
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
