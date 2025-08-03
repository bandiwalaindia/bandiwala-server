import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import Order from "../models/Order.js";
import orderStatusService from "../services/orderStatusService.js";
import socketService from "../services/socketService.js";
import mongoose from "mongoose";
import { applyPromoCode, recordPromoCodeUsage } from './promoCodeController.js';

// Service area configuration (same as cart controller)
const SERVICE_AREA_CENTER = { lat: 17.49328, lng: 78.39433 };
const SERVICE_AREA_RADIUS_KM = 1.001;

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(coords1, coords2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coords2.lat - coords1.lat);
  const dLng = toRadians(coords2.lng - coords1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coords1.lat)) * Math.cos(toRadians(coords2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function isWithinDeliveryArea(userCoords) {
  const distance = calculateDistance(userCoords, SERVICE_AREA_CENTER);
  return distance <= SERVICE_AREA_RADIUS_KM;
}

// Helper function to calculate estimated delivery time
function calculateEstimatedDeliveryTime(cartItems) {
  // Base delivery time in minutes
  let baseTime = 25;

  // Add time based on number of items (1 minute per item after first 3)
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  if (itemCount > 3) {
    baseTime += (itemCount - 3) * 1;
  }

  // Add time based on number of different vendors (5 minutes per additional vendor)
  const uniqueVendors = new Set(cartItems.map(item => item.vendorId?.toString()).filter(Boolean));
  if (uniqueVendors.size > 1) {
    baseTime += (uniqueVendors.size - 1) * 5;
  }

  // Calculate range (±5 minutes)
  const minTime = Math.max(15, baseTime - 5); // Minimum 15 minutes
  const maxTime = baseTime + 5;

  return `${minTime}-${maxTime} min`;
}

// Get all orders for the authenticated user
export const getUserOrders = catchAsyncError(async (req, res, next) => {
  try {
    const user = req.user;

    // Find all orders for this user, sorted by creation date (newest first)
    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      data: orders
    });
  } catch (error) {
    console.error("Error in getUserOrders:", error);
    return next(new ErrorHandler("Failed to retrieve orders", 500));
  }
});

// Get a specific order by ID (supports both MongoDB ObjectId and custom orderNumber)
export const getOrderById = catchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    console.log('getOrderById called with id:', id, 'user:', user?._id);

    // Check if it's a temporary order ID (used for email purposes only)
    if (id.startsWith('TEMP-')) {
      console.log('Temporary order ID detected:', id);
      return next(new ErrorHandler("This is a temporary order ID used for email purposes only. The actual order may still be processing or may have failed. Please check your orders list for the confirmed order.", 404));
    }

    let order;

    // Try to find by orderNumber first (for custom order numbers like BW-20241220-143022-001)
    if (id.startsWith('BW-')) {
      console.log('Searching by orderNumber:', id);
      order = await Order.findOne({ orderNumber: id });
    }
    // If it's a valid MongoDB ObjectId, search by _id
    else if (mongoose.Types.ObjectId.isValid(id)) {
      console.log('Searching by ObjectId:', id);
      order = await Order.findById(id);
    }
    // If it's neither, try searching by orderNumber anyway (in case format changes)
    else {
      console.log('Searching by orderNumber (fallback):', id);
      order = await Order.findOne({ orderNumber: id });
    }

    if (!order) {
      console.log('Order not found for id:', id);
      return next(new ErrorHandler("Order not found", 404));
    }

    console.log('Found order:', order._id, 'orderNumber:', order.orderNumber);

    // Ensure the order belongs to the authenticated user
    if (order.user.toString() !== user._id.toString()) {
      console.log('Unauthorized access attempt. Order user:', order.user.toString(), 'Request user:', user._id.toString());
      return next(new ErrorHandler("Unauthorized access to this order", 403));
    }

    res.status(200).json({
      success: true,
      message: "Order retrieved successfully",
      data: order
    });
  } catch (error) {
    console.error("Error in getOrderById:", error);
    return next(new ErrorHandler("Failed to retrieve order", 500));
  }
});

// Create a new order
export const createOrder = catchAsyncError(async (req, res, next) => {
  try {
    const user = req.user;
    const { deliveryAddress, paymentMethod, promoCode } = req.body;

    console.log('createOrder called with user:', user?._id);
    console.log('Request body:', { deliveryAddress, paymentMethod, promoCode });

    // Validate required fields
    if (!deliveryAddress || !paymentMethod) {
      return next(new ErrorHandler("Delivery address and payment method are required", 400));
    }

    // Validate delivery address coordinates
    if (!deliveryAddress.coordinates || !deliveryAddress.coordinates.lat || !deliveryAddress.coordinates.lng) {
      return next(new ErrorHandler("Delivery address must include valid coordinates", 400));
    }

    // Validate delivery area during order placement
    const isWithinArea = isWithinDeliveryArea(deliveryAddress.coordinates);
    console.log("Delivery address:", deliveryAddress.coordinates);
    console.log("Is within delivery area:", isWithinArea);

    if (!isWithinArea) {
      const distance = calculateDistance(deliveryAddress.coordinates, SERVICE_AREA_CENTER);
      console.log("Order placement blocked - outside delivery area. Distance:", distance, "km");
      return next(new ErrorHandler(
        `Delivery address is outside our service area. Your location is ${distance.toFixed(2)}km from our service center, but we only deliver within ${SERVICE_AREA_RADIUS_KM}km radius.`,
        400
      ));
    }

    // Get the user's cart
    if (!user.cart || !user.cart.items || user.cart.items.length === 0) {
      return next(new ErrorHandler("Cart is empty", 400));
    }

    console.log('Creating order with cart items:', user.cart.items.length);

    // Calculate estimated delivery time based on order complexity and vendor locations
    const estimatedDeliveryTime = calculateEstimatedDeliveryTime(user.cart.items);

    // Calculate subtotal first for promo code validation
    const subtotal = user.cart.items.reduce((total, item) => {
      return total + (item.selectedSubcategory.price * item.quantity);
    }, 0);

    // Apply promo code if provided
    let deliveryCharge = 20; // Default delivery charge
    let discount = 0;
    let promoType = null;

    if (promoCode) {
      try {
        const promoResult = await applyPromoCode(user._id, promoCode, subtotal, deliveryCharge);
        deliveryCharge = promoResult.deliveryCharge;
        discount = promoResult.discountAmount;
        promoType = promoResult.promoType;
        console.log('Promo code applied:', { promoCode, discount, deliveryCharge, promoType });
      } catch (error) {
        console.error('Promo code application failed:', error.message);
        return next(new ErrorHandler(error.message, 400));
      }
    }

    // Create a new order with the cart items
    const newOrder = new Order({
      user: user._id,
      items: user.cart.items,
      deliveryAddress,
      paymentMethod: paymentMethod || 'upi', // Default to UPI if not specified
      promoCode,
      paymentStatus: 'paid', // Payment is already processed via Razorpay
      orderStatus: 'confirmed', // Start with pending vendor response
      isPendingVendorResponse: false, // Set pending flag
      vendorResponseDeadline: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes for vendor response
      subtotal: 0, // Will be calculated
      total: 0, // Will be calculated
      platformFee: 5, // Fixed platform fee to match frontend
      deliveryCharge: deliveryCharge, // Use calculated delivery charge (may be 0 for free delivery)
      tax: 0, // Will be calculated as 5% of subtotal
      discount: discount, // Use calculated discount
      estimatedDeliveryTime: estimatedDeliveryTime
    });

    console.log('Order before calculating totals:', {
      user: newOrder.user,
      itemsCount: newOrder.items.length,
      orderNumber: newOrder.orderNumber
    });

    // Calculate totals
    newOrder.calculateTotals();

    console.log('Order after calculating totals:', {
      subtotal: newOrder.subtotal,
      total: newOrder.total,
      orderNumber: newOrder.orderNumber
    });

    // Save the order
    console.log('Saving order...');
    await newOrder.save();
    console.log('Order saved successfully with order number:', newOrder.orderNumber);

    // Record promo code usage if promo code was applied
    if (promoCode && (discount > 0 || promoType === 'free_delivery')) {
      try {
        // For free delivery, record the delivery charge amount as the benefit
        // But this is just for tracking purposes - it doesn't affect the discount display
        const usageAmount = promoType === 'free_delivery' ? deliveryCharge : discount;
        await recordPromoCodeUsage(user._id, promoCode, newOrder._id, usageAmount);
      } catch (error) {
        console.error('Failed to record promo code usage:', error.message);
        // Don't fail the order creation if usage recording fails
      }
    }

    // Clear the user's cart after successful order
    user.cart.items = [];
    await user.save();

    // Schedule automatic status progression
    orderStatusService.onOrderCreated(newOrder);

    // Send real-time notification to vendors
    await socketService.notifyVendorNewOrder(newOrder);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: newOrder,
      orderNumber: newOrder.orderNumber // Include order number for easy access
    });
  } catch (error) {
    console.error("Error in createOrder:", error);
    return next(new ErrorHandler("Failed to create order", 500));
  }
});

// Update order status (for admin/testing purposes)
export const updateOrderStatus = catchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;
    const user = req.user;

    console.log('updateOrderStatus called with id:', id, 'status:', orderStatus);

    // Check if it's a temporary order ID
    if (id.startsWith('TEMP-')) {
      console.log('Temporary order ID detected:', id);
      return next(new ErrorHandler("Cannot update status for temporary order ID. This ID is used for email purposes only.", 400));
    }

    // Validate order status
    const validStatuses = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(orderStatus)) {
      return next(new ErrorHandler("Invalid order status", 400));
    }

    let order;

    if (id.startsWith('BW-')) {
      order = await Order.findOne({ orderNumber: id });
    }
    // If it's a valid MongoDB ObjectId, search by _id
    else if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    // Fallback to orderNumber search
    else {
      order = await Order.findOne({ orderNumber: id });
    }

    if (!order) {
      return next(new ErrorHandler("Order not found", 404));
    }

    // Ensure the order belongs to the authenticated user (or add admin check here)
    if (order.user.toString() !== user._id.toString()) {
      return next(new ErrorHandler("Unauthorized access to this order", 403));
    }

    // Update order status
    order.orderStatus = orderStatus;
    order.updatedAt = new Date();
    await order.save();

    console.log('Order status updated successfully:', order.orderNumber, 'to', orderStatus);

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

// Get order timer (remaining time until delivery)
export const getOrderTimer = catchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Check if it's a temporary order ID
    if (id.startsWith('TEMP-')) {
      console.log('Temporary order ID detected:', id);
      return next(new ErrorHandler("Cannot get timer for temporary order ID. This ID is used for email purposes only.", 400));
    }

    let order;

    // Try to find by orderNumber first
    if (id.startsWith('BW-')) {
      order = await Order.findOne({ orderNumber: id });
    }
    // If it's a valid MongoDB ObjectId, search by _id
    else if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    // Fallback to orderNumber search
    else {
      order = await Order.findOne({ orderNumber: id });
    }

    if (!order) {
      return next(new ErrorHandler("Order not found", 404));
    }

    // Ensure the order belongs to the authenticated user
    if (order.user.toString() !== user._id.toString()) {
      return next(new ErrorHandler("Unauthorized access to this order", 403));
    }

    // Get remaining time from service
    const timeInfo = await orderStatusService.getOrderRemainingTime(order._id);

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        remainingTime: timeInfo.remainingTime, // milliseconds until next status
        remainingSeconds: Math.ceil(timeInfo.remainingTime / 1000), // seconds until next status
        totalTime: timeInfo.totalTime, // total time until delivery
        totalSeconds: Math.ceil(timeInfo.totalTime / 1000), // total seconds until delivery
        nextStatus: timeInfo.nextStatus,
        isDelivered: order.orderStatus === 'delivered',
        isPendingVendorResponse: timeInfo.isPendingVendorResponse || false,
        estimatedDeliveryTime: timeInfo.estimatedDeliveryTime || order.estimatedDeliveryTime,
        statusTimeline: order.statusTimeline || []
      }
    });
  } catch (error) {
    console.error("Error in getOrderTimer:", error);
    return next(new ErrorHandler("Failed to get order timer", 500));
  }
});

// Update user location for real-time tracking
export const updateUserLocation = catchAsyncError(async (req, res, next) => {
  try {
    const { orderId, location } = req.body;
    const userId = req.user._id;

    // Find the order and verify it belongs to the user
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      orderStatus: { $in: ['out_for_delivery', 'preparing'] }
    });

    if (!order) {
      return next(new ErrorHandler("Order not found or not eligible for tracking", 404));
    }

    // Update order with user's current location
    order.userCurrentLocation = {
      coordinates: location.coordinates,
      accuracy: location.accuracy,
      timestamp: new Date(location.timestamp)
    };

    await order.save();

    // Notify delivery partner via socket
    if (order.deliveryPartner) {
      const { default: socketService } = await import('../services/socketService.js');
      socketService.notifyDeliveryPartnerLocationUpdate(order.deliveryPartner.toString(), {
        orderId: order._id,
        orderNumber: order.orderNumber,
        userLocation: location.coordinates,
        accuracy: location.accuracy,
        timestamp: location.timestamp
      });
    }

    res.status(200).json({
      success: true,
      message: "Location updated successfully"
    });
  } catch (error) {
    console.error("Error updating user location:", error);
    return next(new ErrorHandler("Failed to update location", 500));
  }
});

// Get user's current location for delivery partner
export const getUserLocation = catchAsyncError(async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const deliveryPartnerId = req.user._id;

    // Find the order and verify it's assigned to this delivery partner
    const order = await Order.findOne({
      _id: orderId,
      deliveryPartner: deliveryPartnerId,
      orderStatus: { $in: ['out_for_delivery', 'preparing'] }
    });

    if (!order) {
      return next(new ErrorHandler("Order not found or not assigned to you", 404));
    }

    // Return user's current location if available
    if (order.userCurrentLocation && order.userCurrentLocation.coordinates) {
      res.status(200).json({
        success: true,
        data: {
          coordinates: order.userCurrentLocation.coordinates,
          accuracy: order.userCurrentLocation.accuracy,
          timestamp: order.userCurrentLocation.timestamp,
          fallbackAddress: order.deliveryAddress // Fallback to delivery address
        }
      });
    } else {
      // Return delivery address as fallback
      res.status(200).json({
        success: true,
        data: {
          coordinates: order.deliveryAddress.coordinates,
          accuracy: null,
          timestamp: null,
          fallbackAddress: order.deliveryAddress,
          isDeliveryAddress: true
        }
      });
    }
  } catch (error) {
    console.error("Error getting user location:", error);
    return next(new ErrorHandler("Failed to get user location", 500));
  }
});

// Get tracking status for an order
export const getTrackingStatus = catchAsyncError(async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    // Find the order and verify it belongs to the user
    const order = await Order.findOne({
      _id: orderId,
      user: userId
    });

    if (!order) {
      return next(new ErrorHandler("Order not found", 404));
    }

    const requiresTracking = ['out_for_delivery', 'preparing'].includes(order.orderStatus);

    res.status(200).json({
      success: true,
      data: {
        requiresTracking,
        orderStatus: order.orderStatus,
        hasDeliveryPartner: !!order.deliveryPartner,
        isLocationBeingTracked: !!order.userCurrentLocation
      }
    });
  } catch (error) {
    console.error("Error getting tracking status:", error);
    return next(new ErrorHandler("Failed to get tracking status", 500));
  }
});