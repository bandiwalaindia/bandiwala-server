import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import { User } from "../models/usermodel.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";

// Get delivery partner profile
export const getDeliveryPartnerProfile = catchAsyncError(async (req, res, next) => {
  try {
    const deliveryPartner = await User.findById(req.user._id).select('-password');

    if (!deliveryPartner) {
      return next(new ErrorHandler("Delivery partner not found", 404));
    }

    // Initialize deliveryPartnerData if it doesn't exist
    if (!deliveryPartner.deliveryPartnerData) {
      console.log(`⚠️ Initializing delivery partner data for ${deliveryPartner.name}`);
      deliveryPartner.deliveryPartnerData = {
        isAvailable: false,
        vehicleType: 'bike',
        totalDeliveries: 0,
        rating: 0,
        earnings: 0
      };
      await deliveryPartner.save();
    }

    console.log(`🔍 Delivery partner ${deliveryPartner.name} profile requested. Available: ${deliveryPartner.deliveryPartnerData.isAvailable}`);

    res.status(200).json({
      success: true,
      data: deliveryPartner
    });
  } catch (error) {
    console.error("Error in getDeliveryPartnerProfile:", error);
    return next(new ErrorHandler("Failed to get delivery partner profile", 500));
  }
});

// Update delivery partner profile
export const updateDeliveryPartnerProfile = catchAsyncError(async (req, res, next) => {
  try {
    const { name, phone, address, location } = req.body;
    
    const deliveryPartner = await User.findById(req.user._id);
    
    if (!deliveryPartner) {
      return next(new ErrorHandler("Delivery partner not found", 404));
    }

    // Update fields if provided
    if (name) deliveryPartner.name = name;
    if (phone) deliveryPartner.phone = phone;
    if (address) deliveryPartner.address = address;
    if (location) deliveryPartner.location = location;

    await deliveryPartner.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: deliveryPartner
    });
  } catch (error) {
    console.error("Error in updateDeliveryPartnerProfile:", error);
    return next(new ErrorHandler("Failed to update profile", 500));
  }
});

// Get assigned orders for delivery partner
export const getAssignedOrders = catchAsyncError(async (req, res, next) => {
  try {
    const deliveryPartnerId = req.user._id;
    
    // Find orders assigned to this delivery partner that are not delivered or cancelled
    const orders = await Order.find({
      deliveryPartner: deliveryPartnerId,
      orderStatus: { $in: ['confirmed', 'preparing', 'out_for_delivery'] }
    })
    .populate('user', 'name phone')
    .populate('items.vendorId', 'name phone address')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error("Error in getAssignedOrders:", error);
    return next(new ErrorHandler("Failed to get assigned orders", 500));
  }
});

// Get available orders for delivery partner to accept
export const getAvailableOrders = catchAsyncError(async (req, res, next) => {
  try {
    console.log("🔍 Getting available orders for delivery partner...");

    // Find orders that are ready for delivery but not assigned to any delivery partner
    const orders = await Order.find({
      orderStatus: 'preparing',
      $or: [
        { deliveryPartner: { $exists: false } },
        { deliveryPartner: null }
      ]
    })
    .populate('user', 'name phone')
    .sort({ createdAt: 1 }) // Oldest first
    .limit(10); // Limit to 10 available orders

    console.log(`📦 Found ${orders.length} available orders`);
    orders.forEach((order, index) => {
      console.log(`  ${index + 1}. Order ${order.orderNumber} - Status: ${order.orderStatus} - DeliveryPartner: ${order.deliveryPartner} - Created: ${order.createdAt}`);
    });

    // Double-check each order is still available (prevent race conditions)
    const validOrders = [];
    for (const order of orders) {
      // Re-fetch the order to ensure it's still available
      const freshOrder = await Order.findById(order._id);
      if (freshOrder && freshOrder.orderStatus === 'preparing' && !freshOrder.deliveryPartner) {
        validOrders.push(order);
      } else {
        console.log(`⚠️ Order ${order.orderNumber} is no longer available (Status: ${freshOrder?.orderStatus}, DeliveryPartner: ${freshOrder?.deliveryPartner})`);
      }
    }

    if (validOrders.length !== orders.length) {
      console.log(`📦 After validation: ${validOrders.length}/${orders.length} orders are still available`);
    }

    res.status(200).json({
      success: true,
      data: validOrders
    });
  } catch (error) {
    console.error("Error in getAvailableOrders:", error);
    return next(new ErrorHandler("Failed to get available orders", 500));
  }
});

// Accept an order assignment
export const acceptOrderAssignment = catchAsyncError(async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const deliveryPartnerId = req.user._id;

    console.log(`🔍 DEBUG: Delivery partner ${deliveryPartnerId} trying to accept order ${orderId}`);

    const order = await Order.findById(orderId).populate('user', 'name phone');

    console.log(`🔍 DEBUG: Order found: ${!!order}`);

    if (!order) {
      console.log(`❌ Order ${orderId} not found`);
      return next(new ErrorHandler("Order not found", 404));
    }

    console.log(`🔍 DEBUG: Order status: ${order.orderStatus}, Expected: preparing`);
    console.log(`🔍 DEBUG: Order delivery partner: ${order.deliveryPartner}`);
    console.log(`🔍 DEBUG: Order timeline: ${JSON.stringify(order.statusTimeline)}`);

    // Check if order is already assigned to this delivery partner
    if (order.deliveryPartner && order.deliveryPartner.toString() === deliveryPartnerId.toString()) {
      console.log(`⚠️ Order ${orderId} is already assigned to this delivery partner`);

      // If order is already out for delivery, return success with current state
      if (order.orderStatus === 'out_for_delivery') {
        return res.status(200).json({
          success: true,
          message: "Order is already assigned to you and out for delivery",
          data: {
            order: order,
            customerLocation: order.deliveryAddress.coordinates
          }
        });
      }

      // If order is in preparing but assigned to this partner, update to out_for_delivery
      if (order.orderStatus === 'preparing') {
        order.orderStatus = 'out_for_delivery';
        if (!order.statusTimeline.find(t => t.status === 'out_for_delivery')) {
          order.statusTimeline.push({
            status: 'out_for_delivery',
            timestamp: new Date()
          });
        }
        await order.save();

        console.log(`✅ Updated order ${order.orderNumber} status to out_for_delivery`);

        return res.status(200).json({
          success: true,
          message: "Order status updated to out for delivery",
          data: {
            order: order,
            customerLocation: order.deliveryAddress.coordinates
          }
        });
      }
    }

    // Check if order is already assigned to another delivery partner
    if (order.deliveryPartner && order.deliveryPartner.toString() !== deliveryPartnerId.toString()) {
      console.log(`❌ Order ${orderId} is already assigned to another delivery partner`);
      return next(new ErrorHandler("This order has already been accepted by a delivery partner", 400));
    }

    // Check if order is in the right status for assignment
    if (order.orderStatus !== 'preparing') {
      console.log(`❌ Order ${orderId} is not in preparing status. Current: ${order.orderStatus}`);

      // Provide specific error messages based on order status
      let errorMessage = `Order is not available for assignment. Current status: ${order.orderStatus}`;
      if (order.orderStatus === 'out_for_delivery') {
        errorMessage = "This order has already been accepted by a delivery partner";
      } else if (order.orderStatus === 'delivered') {
        errorMessage = "This order has already been delivered";
      } else if (order.orderStatus === 'cancelled') {
        errorMessage = "This order has been cancelled";
      }

      return next(new ErrorHandler(errorMessage, 400));
    }

    // Check if delivery partner exists and is available
    const deliveryPartner = await User.findById(deliveryPartnerId);
    console.log(`🔍 DEBUG: Delivery partner found: ${!!deliveryPartner}`);

    if (!deliveryPartner) {
      console.log(`❌ Delivery partner ${deliveryPartnerId} not found`);
      return next(new ErrorHandler("Delivery partner not found", 404));
    }

    console.log(`🔍 DEBUG: Delivery partner data: ${JSON.stringify(deliveryPartner.deliveryPartnerData)}`);

    // Initialize deliveryPartnerData if it doesn't exist
    if (!deliveryPartner.deliveryPartnerData) {
      console.log(`⚠️ Delivery partner data not found, initializing...`);
      deliveryPartner.deliveryPartnerData = { isAvailable: true };
      await deliveryPartner.save();
    }

    if (!deliveryPartner.deliveryPartnerData.isAvailable) {
      console.log(`❌ Delivery partner ${deliveryPartnerId} is not available`);
      return next(new ErrorHandler("You must be available to accept orders. Please toggle your availability status.", 400));
    }

    // Assign delivery partner and update status
    order.deliveryPartner = deliveryPartnerId;
    order.orderStatus = 'out_for_delivery';
    order.statusTimeline.push({
      status: 'out_for_delivery',
      timestamp: new Date()
    });

    await order.save();

    // Import socketService
    const { default: socketService } = await import('../services/socketService.js');

    // Notify user about delivery partner assignment
    socketService.notifyUserOrderUpdate(order.user._id.toString(), {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: 'out_for_delivery',
      message: 'Your order is out for delivery!',
      deliveryPartner: {
        name: deliveryPartner.name,
        phone: deliveryPartner.phone,
        vehicleType: deliveryPartner.deliveryPartnerData.vehicleType
      }
    });

    res.status(200).json({
      success: true,
      message: "Order accepted successfully",
      data: {
        order: order,
        customerLocation: order.deliveryAddress.coordinates
      }
    });
  } catch (error) {
    console.error("Error in acceptOrderAssignment:", error);
    return next(new ErrorHandler("Failed to accept order", 500));
  }
});

// Reject an order assignment
export const rejectOrderAssignment = catchAsyncError(async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const deliveryPartnerId = req.user._id;

    const order = await Order.findById(orderId);

    if (!order) {
      return next(new ErrorHandler("Order not found", 404));
    }

    if (order.orderStatus !== 'preparing') {
      return next(new ErrorHandler("Order is not available for assignment", 400));
    }

    if (order.deliveryPartner && order.deliveryPartner.toString() !== deliveryPartnerId.toString()) {
      return next(new ErrorHandler("Order is assigned to another delivery partner", 400));
    }

    // Import socketService
    const { default: socketService } = await import('../services/socketService.js');

    // Find next available delivery partner
    await socketService.assignOrderToNextDeliveryPartner(order._id.toString(), deliveryPartnerId.toString());

    res.status(200).json({
      success: true,
      message: "Order rejected successfully"
    });
  } catch (error) {
    console.error("Error in rejectOrderAssignment:", error);
    return next(new ErrorHandler("Failed to reject order", 500));
  }
});

// Accept an available order (legacy method - keeping for backward compatibility)
export const acceptOrder = catchAsyncError(async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const deliveryPartnerId = req.user._id;

    const order = await Order.findById(orderId);

    if (!order) {
      return next(new ErrorHandler("Order not found", 404));
    }

    if (order.orderStatus !== 'preparing') {
      return next(new ErrorHandler("Order is not available for pickup", 400));
    }

    if (order.deliveryPartner) {
      return next(new ErrorHandler("Order already assigned to another delivery partner", 400));
    }

    // Assign delivery partner and update status
    order.deliveryPartner = deliveryPartnerId;
    order.orderStatus = 'out_for_delivery';
    order.statusTimeline.push({
      status: 'out_for_delivery',
      timestamp: new Date()
    });
    
    await order.save();

    // Populate the order with user and vendor details
    await order.populate('user', 'name phone');
    await order.populate('items.vendorId', 'name phone address coordinates');

    res.status(200).json({
      success: true,
      message: "Order accepted successfully",
      data: order
    });
  } catch (error) {
    console.error("Error in acceptOrder:", error);
    return next(new ErrorHandler("Failed to accept order", 500));
  }
});

// Update order status (for delivery partner)
export const updateOrderStatus = catchAsyncError(async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;
    const deliveryPartnerId = req.user._id;

    // Validate order status for delivery partner
    const validStatuses = ['out_for_delivery', 'delivered'];
    if (!validStatuses.includes(orderStatus)) {
      return next(new ErrorHandler("Invalid order status for delivery partner", 400));
    }

    const order = await Order.findById(orderId).populate('user', 'name phone');

    if (!order) {
      return next(new ErrorHandler("Order not found", 404));
    }

    // Check if order is assigned to this delivery partner
    if (!order.deliveryPartner || order.deliveryPartner.toString() !== deliveryPartnerId.toString()) {
      return next(new ErrorHandler("Order not assigned to you", 403));
    }

    // Update order status
    order.orderStatus = orderStatus;
    order.statusTimeline.push({
      status: orderStatus,
      timestamp: new Date()
    });

    await order.save();

    // Get delivery partner details for notifications
    const deliveryPartner = req.user;

    // Import socketService for real-time notifications
    const { default: socketService } = await import('../services/socketService.js');

    // Notify user about status update
    socketService.notifyUserOrderUpdate(order.user._id.toString(), {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: orderStatus,
      message: getStatusMessage(orderStatus),
      timestamp: new Date(),
      deliveryPartner: {
        name: deliveryPartner.name,
        phone: deliveryPartner.phone,
        vehicleType: deliveryPartner.deliveryPartnerData?.vehicleType || 'bike'
      }
    });

    // If order is delivered, update delivery partner stats
    if (orderStatus === 'delivered') {
      deliveryPartner.deliveryPartnerData.totalDeliveries += 1;
      deliveryPartner.deliveryPartnerData.earnings += (order.deliveryCharge || 20); // Add delivery fee to earnings
      await deliveryPartner.save();

      console.log(`🎉 Order ${order.orderNumber} delivered successfully by ${deliveryPartner.name}`);
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order
    });
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    return next(new ErrorHandler("Failed to update order status", 500));
  }
});

// Helper function to get status message
function getStatusMessage(status) {
  switch (status) {
    case 'placed':
      return 'Your order has been placed successfully!';
    case 'confirmed':
      return 'Your order has been confirmed by the restaurant!';
    case 'preparing':
      return 'Your order is being prepared!';
    case 'out_for_delivery':
      return 'Your order is out for delivery!';
    case 'delivered':
      return 'Your order has been delivered! Enjoy your meal!';
    case 'cancelled':
      return 'Your order has been cancelled.';
    default:
      return 'Order status updated.';
  }
}

// Get order history for delivery partner
export const getOrderHistory = catchAsyncError(async (req, res, next) => {
  try {
    const deliveryPartnerId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const orders = await Order.find({
      deliveryPartner: deliveryPartnerId,
      orderStatus: { $in: ['delivered', 'cancelled'] }
    })
    .populate('user', 'name phone')
    .populate('items.vendorId', 'name phone address')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments({
      deliveryPartner: deliveryPartnerId,
      orderStatus: { $in: ['delivered', 'cancelled'] }
    });

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNext: skip + orders.length < totalOrders,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error in getOrderHistory:", error);
    return next(new ErrorHandler("Failed to get order history", 500));
  }
});

// Get current active delivery
export const getCurrentDelivery = catchAsyncError(async (req, res, next) => {
  try {
    const deliveryPartnerId = req.user._id;
    
    const currentOrder = await Order.findOne({
      deliveryPartner: deliveryPartnerId,
      orderStatus: 'out_for_delivery'
    })
    .populate('user', 'name phone')
    .populate('items.vendorId', 'name phone address');

    res.status(200).json({
      success: true,
      data: currentOrder
    });
  } catch (error) {
    console.error("Error in getCurrentDelivery:", error);
    return next(new ErrorHandler("Failed to get current delivery", 500));
  }
});

// Get delivery stats for delivery partner
export const getDeliveryStats = catchAsyncError(async (req, res, next) => {
  try {
    const deliveryPartnerId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Today's stats
    const todayOrders = await Order.find({
      deliveryPartner: deliveryPartnerId,
      orderStatus: 'delivered',
      createdAt: { $gte: today }
    });

    // Total stats
    const totalDelivered = await Order.countDocuments({
      deliveryPartner: deliveryPartnerId,
      orderStatus: 'delivered'
    });

    // Calculate earnings (assuming delivery fee is ₹30 per order)
    const todayEarnings = todayOrders.length * 30;
    const totalEarnings = totalDelivered * 30;

    // Average rating (placeholder - you can implement rating system later)
    const averageRating = 4.5;

    res.status(200).json({
      success: true,
      data: {
        today: {
          deliveries: todayOrders.length,
          earnings: todayEarnings,
          rating: averageRating
        },
        total: {
          deliveries: totalDelivered,
          earnings: totalEarnings,
          rating: averageRating
        }
      }
    });
  } catch (error) {
    console.error("Error in getDeliveryStats:", error);
    return next(new ErrorHandler("Failed to get delivery stats", 500));
  }
});

// Toggle delivery partner availability
export const toggleAvailability = catchAsyncError(async (req, res, next) => {
  try {
    const { isAvailable } = req.body;
    const deliveryPartner = await User.findById(req.user._id);
    
    if (!deliveryPartner) {
      return next(new ErrorHandler("Delivery partner not found", 404));
    }

    // Add availability field if it doesn't exist
    if (!deliveryPartner.deliveryPartnerData) {
      deliveryPartner.deliveryPartnerData = {};
    }
    
    deliveryPartner.deliveryPartnerData.isAvailable = isAvailable;
    await deliveryPartner.save();

    res.status(200).json({
      success: true,
      message: `Availability ${isAvailable ? 'enabled' : 'disabled'} successfully`,
      data: { isAvailable }
    });
  } catch (error) {
    console.error("Error in toggleAvailability:", error);
    return next(new ErrorHandler("Failed to toggle availability", 500));
  }
});
