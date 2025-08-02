import Order from "../models/Order.js";
import cron from "node-cron";
import mongoose from "mongoose";

class OrderStatusService {
  constructor() {
    this.timers = new Map(); // Store active timers
    this.isStarted = false;
    this.cronJob = null;
    this.skippedLegacyOrders = new Set(); // Track legacy orders we've already skipped
  }

  // Start monitoring for order status changes
  startStatusMonitoring() {
    // Don't start if already started
    if (this.isStarted) {
      return;
    }

    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('⏳ Order Status Service waiting for database connection...');
      // Wait for database connection
      mongoose.connection.once('connected', () => {
        this.initializeService();
      });
      return;
    }

    this.initializeService();
  }

  // Initialize the service once database is connected
  initializeService() {
    if (this.isStarted) {
      return;
    }

    console.log('🚀 Order Status Service started');
    this.isStarted = true;

    // Check every 10 seconds for orders that need status updates
    this.cronJob = cron.schedule('*/10 * * * * *', async () => {
      await this.processOrderStatusUpdates();
    });

    // On startup, process any existing placed orders
    this.processOrderStatusUpdates();
  }

  // Process all orders that need status updates
  async processOrderStatusUpdates() {
    try {
      // Check if database is connected before processing
      if (mongoose.connection.readyState !== 1) {
        console.log('⚠️ Database not connected, skipping order status updates');
        return;
      }

      // Process orders that need status progression
      await this.processStatusProgression();

      // Set up timers for recent orders
      await this.setupTimersForRecentOrders();

    } catch (error) {
      console.error('Error processing order status updates:', error);
    }
  }

  // Process status progression for all active orders
  async processStatusProgression() {
    const now = new Date();

    // Handle orders that should move from 'placed' to 'pending_vendor_response'
    const placedOrders = await Order.find({
      orderStatus: 'placed',
      isPendingVendorResponse: false,
      updatedAt: { $lte: new Date(now.getTime() - 30 * 1000) } // 30 seconds ago
    });

    for (const order of placedOrders) {
      order.orderStatus = 'pending_vendor_response';
      order.isPendingVendorResponse = true;
      order.vendorResponseDeadline = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now
      order.statusTimeline.push({
        status: 'pending_vendor_response',
        timestamp: now
      });
      await order.save();
      console.log(`📋 Order ${order.orderNumber} moved to pending vendor response`);
    }

    // Handle vendor response timeouts (auto-cancel after 10 minutes)
    const timedOutOrders = await Order.find({
      orderStatus: 'pending_vendor_response',
      isPendingVendorResponse: true,
      vendorResponseDeadline: { $lte: now }
    });

    for (const order of timedOutOrders) {
      order.orderStatus = 'cancelled';
      order.isPendingVendorResponse = false;
      order.statusTimeline.push({
        status: 'cancelled',
        timestamp: now
      });
      await order.save();
      console.log(`⏰ Order ${order.orderNumber} auto-cancelled due to vendor timeout`);
    }

    // Handle normal status progression for confirmed orders
    const statusProgression = [
      { from: 'confirmed', to: 'preparing', delay: 2 * 60 * 1000 }, // 2 minutes
      { from: 'preparing', to: 'out_for_delivery', delay: 60 * 60 * 1000 }, // 60 minutes (extended for testing)
      { from: 'out_for_delivery', to: 'delivered', delay: 20 * 60 * 1000 } // 20 minutes
    ];

    for (const progression of statusProgression) {
      const cutoffTime = new Date(now.getTime() - progression.delay);
      const ordersToUpdate = await Order.find({
        orderStatus: progression.from,
        updatedAt: { $lte: cutoffTime },
        isPendingVendorResponse: { $ne: true }
      });

      for (const order of ordersToUpdate) {
        await this.updateOrderStatus(order, progression.to);
      }
    }
  }

  // Set up timers for recent orders
  async setupTimersForRecentOrders() {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const activeStatuses = ['placed', 'confirmed', 'preparing', 'out_for_delivery'];

    for (const status of activeStatuses) {
      const recentOrders = await Order.find({
        orderStatus: status,
        updatedAt: { $gt: twoMinutesAgo },
        // Exclude orders that are pending vendor response
        isPendingVendorResponse: { $ne: true }
      });

      for (const order of recentOrders) {
        this.scheduleOrderStatusUpdate(order);
      }
    }
  }

  // Schedule a specific order for status update
  scheduleOrderStatusUpdate(order) {
    const orderId = order._id.toString();

    // Don't create duplicate timers
    if (this.timers.has(orderId)) {
      return;
    }

    // Don't schedule updates for orders pending vendor response
    if (order.isPendingVendorResponse) {
      console.log(`⏸️ Skipping status update for order ${order.orderNumber} - pending vendor response`);
      return;
    }

    // Get next status and timing
    const nextStatusInfo = this.getNextStatusInfo(order.orderStatus);
    if (!nextStatusInfo) {
      return; // Order is already delivered or cancelled
    }

    const lastUpdateTime = new Date(order.updatedAt);
    const nextUpdateTime = new Date(lastUpdateTime.getTime() + nextStatusInfo.delay);
    const timeUntilUpdate = nextUpdateTime.getTime() - Date.now();

    if (timeUntilUpdate <= 0) {
      // Order should already be updated
      this.updateOrderStatus(order, nextStatusInfo.nextStatus);
      return;
    }

    console.log(`⏰ Scheduling order ${order.orderNumber} for ${nextStatusInfo.nextStatus} in ${Math.round(timeUntilUpdate / 1000)} seconds`);

    // Set timeout for this specific order
    const timer = setTimeout(async () => {
      await this.updateOrderStatus(order, nextStatusInfo.nextStatus);
      this.timers.delete(orderId);
    }, timeUntilUpdate);

    this.timers.set(orderId, timer);
  }

  // Get next status information
  getNextStatusInfo(currentStatus) {
    const statusMap = {
      'placed': { nextStatus: 'pending_vendor_response', delay: 30 * 1000 }, // 30 seconds to move to pending
      'pending_vendor_response': { nextStatus: 'cancelled', delay: 10 * 60 * 1000 }, // 10 minutes timeout
      'confirmed': { nextStatus: 'preparing', delay: 2 * 60 * 1000 }, // 2 minutes
      'preparing': { nextStatus: 'out_for_delivery', delay: 60 * 60 * 1000 }, // 60 minutes (extended for testing)
      'out_for_delivery': { nextStatus: 'delivered', delay: 20 * 60 * 1000 } // 20 minutes
    };

    return statusMap[currentStatus] || null;
  }

  // Update order status with timeline tracking
  async updateOrderStatus(order, newStatus) {
    try {
      const orderId = order._id.toString();

      // Check if we've already processed this legacy order
      if (this.skippedLegacyOrders.has(orderId)) {
        return; // Skip silently - we've already logged this order
      }

      // Check if order has valid item structure BEFORE logging
      const hasValidItems = order.items && order.items.every(item =>
        item.selectedSubcategory &&
        item.selectedSubcategory.title &&
        item.selectedSubcategory.quantity &&
        item.selectedSubcategory.price !== undefined
      );

      if (!hasValidItems) {
        console.warn(`⚠️ Skipping legacy order ${order.orderNumber} - incomplete item data`);
        // Add to skipped set to prevent future processing
        this.skippedLegacyOrders.add(orderId);
        return;
      }

      // Only log if we're actually going to update the order
      console.log(`📦 Updating order ${order.orderNumber} from ${order.orderStatus} to ${newStatus}`);

      // Use the new updateStatus method that handles timeline
      order.updateStatus(newStatus);
      await order.save();

      console.log(`✅ Order ${order.orderNumber} is now ${newStatus}${newStatus === 'delivered' ? ' and ready for reviews!' : ''}`);

      // If order moved to preparing, assign to delivery partners
      if (newStatus === 'preparing') {
        try {
          const { default: socketService } = await import('./socketService.js');
          await socketService.assignOrderToDeliveryPartners(orderId);
        } catch (error) {
          console.error(`❌ Error assigning order ${order.orderNumber} to delivery partners:`, error);
        }
      }

      // Clean up timer if it exists
      if (this.timers.has(orderId)) {
        clearTimeout(this.timers.get(orderId));
        this.timers.delete(orderId);
      }

      // Schedule next status update if not delivered
      if (newStatus !== 'delivered' && newStatus !== 'cancelled') {
        this.scheduleOrderStatusUpdate(order);
      }

    } catch (error) {
      // Handle validation errors gracefully
      if (error.name === 'ValidationError') {
        console.warn(`⚠️ Skipping order ${order.orderNumber} due to validation error (legacy order):`, error.message);
      } else {
        console.error(`❌ Error updating order ${order.orderNumber} to ${newStatus}:`, error.message);
      }
    }
  }

  // Get remaining time for an order
  async getOrderRemainingTime(orderId) {
    try {
      // Check if database is connected
      if (mongoose.connection.readyState !== 1) {
        console.log('⚠️ Database not connected, cannot get order remaining time');
        return { remainingTime: 0, nextStatus: null, totalTime: 0, estimatedDeliveryTime: '30-45 min' };
      }

      const order = await Order.findById(orderId);
      if (!order || order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') {
        return { remainingTime: 0, nextStatus: null, totalTime: 0, estimatedDeliveryTime: order?.estimatedDeliveryTime || '30-45 min' };
      }

      // If order is pending vendor response, calculate timeout
      if (order.isPendingVendorResponse && order.vendorResponseDeadline) {
        const timeoutRemaining = Math.max(0, order.vendorResponseDeadline.getTime() - Date.now());
        return {
          remainingTime: timeoutRemaining,
          nextStatus: 'cancelled',
          totalTime: timeoutRemaining,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
          isPendingVendorResponse: true
        };
      }

      const nextStatusInfo = this.getNextStatusInfo(order.orderStatus);
      if (!nextStatusInfo) {
        return { remainingTime: 0, nextStatus: null, totalTime: 0, estimatedDeliveryTime: order.estimatedDeliveryTime };
      }

      const lastUpdateTime = new Date(order.updatedAt);
      const nextUpdateTime = new Date(lastUpdateTime.getTime() + nextStatusInfo.delay);
      const remainingTime = Math.max(0, nextUpdateTime.getTime() - Date.now());

      // Calculate total time until delivery based on current status
      let totalTime = remainingTime;
      const statusOrder = ['placed', 'pending_vendor_response', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
      const currentIndex = statusOrder.indexOf(order.orderStatus);

      // Add remaining stage times
      for (let i = currentIndex + 1; i < statusOrder.length - 1; i++) {
        const stageInfo = this.getNextStatusInfo(statusOrder[i]);
        if (stageInfo) {
          totalTime += stageInfo.delay;
        }
      }

      return {
        remainingTime,
        nextStatus: nextStatusInfo.nextStatus,
        totalTime,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        isPendingVendorResponse: order.isPendingVendorResponse
      };
    } catch (error) {
      console.error('Error getting order remaining time:', error);
      return { remainingTime: 0, nextStatus: null, totalTime: 0, estimatedDeliveryTime: '30-45 min' };
    }
  }

  // Handle new order creation
  onOrderCreated(order) {
    if (order.orderStatus === 'pending_vendor_response' && order.isPendingVendorResponse) {
      console.log(`🆕 New order created: ${order.orderNumber}, pending vendor response with 10-minute timeout`);
      // The order will be handled by the processStatusProgression method for timeout
    } else if (order.orderStatus === 'placed' && !order.isPendingVendorResponse) {
      console.log(`🆕 New order created: ${order.orderNumber}, scheduling progression`);
      this.scheduleOrderStatusUpdate(order);
    } else {
      console.log(`🆕 New order created: ${order.orderNumber}, status: ${order.orderStatus}`);
    }
  }

  // Clean up timers on service shutdown
  cleanup() {
    console.log('🛑 Cleaning up Order Status Service');

    // Stop cron job
    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
    }

    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    this.isStarted = false;
  }
}

// Create singleton instance
const orderStatusService = new OrderStatusService();

// Graceful shutdown
process.on('SIGINT', () => {
  orderStatusService.cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  orderStatusService.cleanup();
  process.exit(0);
});

export default orderStatusService;
