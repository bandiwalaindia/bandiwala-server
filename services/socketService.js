import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/usermodel.js';
import Vendor from '../models/Vendor.js';
import Order from '../models/Order.js';

class SocketService {
  constructor() {
    this.io = null;
    this.connectedVendors = new Map(); // Map of vendorId -> socketId
    this.connectedUsers = new Map(); // Map of userId -> socketId
    this.connectedDeliveryPartners = new Map(); // Map of deliveryPartnerId -> socketId
    this.orderTimeouts = new Map(); // Map of orderId -> timeout
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:8080',
          'http://192.168.0.105:4000',
          'http://192.168.0.105:3000',
          'http://192.168.0.105:8080',
          // Add more origins as needed
        ],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      console.log('🔌 New socket connection:', socket.id);

      // Handle authentication
      socket.on('authenticate', async (data) => {
        try {
          const { token } = data;
          if (!token) {
            socket.emit('auth_error', { message: 'No token provided' });
            return;
          }

          // Verify JWT token
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.id);
          
          if (!user) {
            socket.emit('auth_error', { message: 'User not found' });
            return;
          }

          socket.userId = user._id.toString();
          socket.userRole = user.role;

          // If user is a vendor, find their vendor profile
          if (user.role === 'vendor') {
            const vendor = await Vendor.findOne({ userId: user._id });
            if (vendor) {
              socket.vendorId = vendor._id.toString();
              this.connectedVendors.set(vendor._id.toString(), socket.id);
              socket.join(`vendor_${vendor._id}`);
              console.log(`🏪 Vendor ${vendor.name} connected (${socket.id})`);
            }
          } else if (user.role === 'deliveryPartner') {
            socket.deliveryPartnerId = user._id.toString();
            this.connectedDeliveryPartners.set(user._id.toString(), socket.id);
            socket.join(`delivery_${user._id}`);
            console.log(`🚚 Delivery Partner ${user.name} connected (${socket.id}) - Available: ${user.deliveryPartnerData?.isAvailable || false}`);
            console.log(`📊 Total connected delivery partners: ${this.connectedDeliveryPartners.size}`);
          } else {
            this.connectedUsers.set(user._id.toString(), socket.id);
            socket.join(`user_${user._id}`);
            console.log(`👤 User ${user.name} connected (${socket.id})`);
          }

          socket.emit('authenticated', { 
            message: 'Successfully authenticated',
            role: user.role,
            userId: user._id
          });

        } catch (error) {
          console.error('Socket authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // Handle vendor joining their room
      socket.on('join_vendor_room', (vendorId) => {
        if (socket.userRole === 'vendor' && socket.vendorId === vendorId) {
          socket.join(`vendor_${vendorId}`);
          console.log(`🏪 Vendor joined room: vendor_${vendorId}`);
        }
      });

      // Handle delivery partner joining their room
      socket.on('join_delivery_room', (deliveryPartnerId) => {
        if (socket.userRole === 'deliveryPartner' && socket.deliveryPartnerId === deliveryPartnerId) {
          socket.join(`delivery_${deliveryPartnerId}`);
          console.log(`🚚 Delivery Partner joined room: delivery_${deliveryPartnerId}`);
        }
      });

      // Handle order acceptance/rejection
      socket.on('order_response', async (data) => {
        try {
          const { orderId, action, vendorId } = data; // action: 'accept' or 'reject'

          if (socket.userRole !== 'vendor' || socket.vendorId !== vendorId) {
            socket.emit('error', { message: 'Unauthorized' });
            return;
          }

          // Clear the timeout since vendor responded
          this.clearOrderTimeout(orderId);

          // Get order and notify user
          const order = await Order.findById(orderId).populate('user');
          if (order && order.user) {
            const statusMessage = action === 'accept' ? 'Your order is being prepared!' : 'Your order was declined';
            this.notifyUserOrderUpdate(order.user._id.toString(), {
              orderId: orderId,
              status: action === 'accept' ? 'preparing' : 'cancelled',
              message: statusMessage
            });
          }

          console.log(`📦 Order ${orderId} ${action}ed by vendor ${vendorId}`);
        } catch (error) {
          console.error('Error handling order response:', error);
          socket.emit('error', { message: 'Failed to process order response' });
        }
      });

      // Handle delivery assignment response
      socket.on('delivery_assignment_response', async (data) => {
        try {
          const { orderId, action, deliveryPartnerId } = data; // action: 'accept' or 'reject'

          if (socket.userRole !== 'deliveryPartner' || socket.deliveryPartnerId !== deliveryPartnerId) {
            socket.emit('error', { message: 'Unauthorized' });
            return;
          }

          // Clear assignment timeout for this order
          this.clearOrderAssignmentTimeout(orderId);

          // Handle delivery assignment response
          await this.handleDeliveryAssignmentResponse(orderId, action, deliveryPartnerId);

          console.log(`🚚 Delivery assignment ${action}ed for order ${orderId} by delivery partner ${deliveryPartnerId}`);
        } catch (error) {
          console.error('Error handling delivery assignment response:', error);
          socket.emit('error', { message: 'Failed to process delivery assignment response' });
        }
      });

      // Handle order status updates from delivery partners
      socket.on('update_order_status', async (data) => {
        try {
          const { orderId, status } = data;
          const deliveryPartnerId = socket.deliveryPartnerId;

          if (socket.userRole !== 'deliveryPartner' || !deliveryPartnerId) {
            socket.emit('error', { message: 'Unauthorized' });
            return;
          }

          console.log(`📦 Order status update: ${status} for order ${orderId} by delivery partner ${deliveryPartnerId}`);

          // Handle the status update
          await this.handleOrderStatusUpdate(orderId, status, deliveryPartnerId, socket);

        } catch (error) {
          console.error('Error handling order status update:', error);
          socket.emit('error', { message: 'Failed to update order status' });
        }
      });

      // Handle user location updates
      socket.on('user_location_update', async (data) => {
        try {
          const { orderId, location } = data;
          console.log(`📍 User location update received for order ${orderId}`);

          if (socket.userRole === 'user' && socket.userId) {
            // Process location update via controller
            const Order = (await import('../models/Order.js')).default;
            const order = await Order.findOne({
              _id: orderId,
              user: socket.userId,
              orderStatus: { $in: ['out_for_delivery', 'preparing'] }
            });

            if (order) {
              // Update order with user's current location
              order.userCurrentLocation = {
                coordinates: location.coordinates,
                accuracy: location.accuracy,
                timestamp: new Date(location.timestamp)
              };
              await order.save();

              // Notify delivery partner
              if (order.deliveryPartner) {
                this.notifyDeliveryPartnerLocationUpdate(order.deliveryPartner.toString(), {
                  orderId: order._id,
                  orderNumber: order.orderNumber,
                  userLocation: location.coordinates,
                  accuracy: location.accuracy,
                  timestamp: location.timestamp
                });
              }
            }
          }
        } catch (error) {
          console.error('Error handling user location update:', error);
        }
      });

      socket.on('user_location_stop', async (data) => {
        try {
          const { orderId } = data;
          console.log(`📍 User stopped location tracking for order ${orderId}`);

          if (socket.userRole === 'user' && socket.userId) {
            // Notify delivery partner that location tracking stopped
            const Order = (await import('../models/Order.js')).default;
            const order = await Order.findOne({
              _id: orderId,
              user: socket.userId
            });

            if (order && order.deliveryPartner) {
              this.io.to(`delivery_${order.deliveryPartner}`).emit('user_location_stopped', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                message: 'User has stopped sharing location'
              });
            }
          }
        } catch (error) {
          console.error('Error handling user location stop:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected:', socket.id);
        
        if (socket.vendorId) {
          this.connectedVendors.delete(socket.vendorId);
          console.log(`🏪 Vendor ${socket.vendorId} disconnected`);
        }
        
        if (socket.deliveryPartnerId) {
          this.connectedDeliveryPartners.delete(socket.deliveryPartnerId);
          console.log(`🚚 Delivery Partner ${socket.deliveryPartnerId} disconnected`);
        }

        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          console.log(`👤 User ${socket.userId} disconnected`);
        }
      });
    });

    console.log('🚀 Socket.io service initialized');
  }

  // Send order notification to vendor
  async notifyVendorNewOrder(order) {
    try {
      // Group items by vendor
      const vendorItems = {};
      order.items.forEach(item => {
        if (item.vendorId) {
          const vendorId = item.vendorId.toString();
          if (!vendorItems[vendorId]) {
            vendorItems[vendorId] = [];
          }
          vendorItems[vendorId].push(item);
        }
      });

      // Send notification to each vendor
      for (const [vendorId, items] of Object.entries(vendorItems)) {
        const vendor = await Vendor.findById(vendorId);
        if (vendor) {
          const notification = {
            orderId: order._id,
            orderNumber: order.orderNumber,
            customerName: order.user?.name || 'Customer',
            customerPhone: order.user?.phone || '',
            items: items,
            totalAmount: items.reduce((sum, item) => sum + (item.selectedSubcategory.price * item.quantity), 0),
            deliveryAddress: order.deliveryAddress,
            timestamp: new Date(),
            expiresAt: new Date(Date.now() + 10 * 1000) // 10 seconds
          };

          // Send to vendor room
          this.io.to(`vendor_${vendorId}`).emit('new_order', notification);
          console.log(`📦 New order notification sent to vendor ${vendor.name}`);

          // Set up 10-second timeout for this order
          this.setupOrderTimeout(order._id.toString(), vendorId);
        }
      }
    } catch (error) {
      console.error('Error sending vendor notification:', error);
    }
  }

  // Send order status update to user
  notifyUserOrderUpdate(userId, orderUpdate) {
    try {
      this.io.to(`user_${userId}`).emit('order_update', orderUpdate);
      console.log(`📱 Order update sent to user ${userId}`);
    } catch (error) {
      console.error('Error sending user notification:', error);
    }
  }

  // Get connected vendors count
  getConnectedVendorsCount() {
    return this.connectedVendors.size;
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Check if vendor is online
  isVendorOnline(vendorId) {
    return this.connectedVendors.has(vendorId.toString());
  }

  // Setup order timeout
  setupOrderTimeout(orderId, vendorId) {
    const timeoutId = setTimeout(async () => {
      try {
        console.log(`⏰ Order ${orderId} timed out for vendor ${vendorId}`);

        // Update order status to pending_vendor_response
        const order = await Order.findById(orderId);
        if (order && order.orderStatus === 'placed') {
          order.orderStatus = 'pending_vendor_response';
          order.isPendingVendorResponse = true;
          order.vendorResponseDeadline = new Date();
          order.statusTimeline.push({
            status: 'pending_vendor_response',
            timestamp: new Date()
          });
          await order.save();

          // Notify vendor about timeout
          this.io.to(`vendor_${vendorId}`).emit('order_timeout', {
            orderId: orderId,
            message: 'Order moved to pending requests'
          });

          console.log(`📋 Order ${orderId} moved to pending requests`);
        }

        // Remove timeout from map
        this.orderTimeouts.delete(orderId);
      } catch (error) {
        console.error('Error handling order timeout:', error);
      }
    }, 10000); // 10 seconds

    // Store timeout ID
    this.orderTimeouts.set(orderId, timeoutId);
  }

  // Clear order timeout (when vendor responds)
  clearOrderTimeout(orderId) {
    const timeoutId = this.orderTimeouts.get(orderId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.orderTimeouts.delete(orderId);
      console.log(`⏰ Cleared timeout for order ${orderId}`);
    }
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId.toString());
  }

  // Assign order to available delivery partners
  async assignOrderToDeliveryPartners(orderId) {
    try {
      const Order = (await import('../models/Order.js')).default;
      const { User } = await import('../models/usermodel.js');

      const order = await Order.findById(orderId).populate('user', 'name phone');
      console.log(`🔍 DEBUG: assignOrderToDeliveryPartners called for order ${orderId}`);
      console.log(`🔍 DEBUG: Order found: ${!!order}`);

      if (!order) {
        console.log('❌ Order not found');
        return;
      }

      // Double-check order is still available for assignment
      if (order.orderStatus !== 'preparing') {
        console.log(`⚠️ Order ${orderId} is no longer in preparing status (${order.orderStatus}), skipping assignment`);
        return;
      }

      if (order.deliveryPartner) {
        console.log(`⚠️ Order ${orderId} already has delivery partner assigned, skipping`);
        return;
      }

      console.log(`🔍 DEBUG: Order status: ${order.orderStatus}, Expected: preparing`);
      console.log(`🔍 DEBUG: Order delivery partner: ${order.deliveryPartner}`);

      // Find available delivery partners
      const availableDeliveryPartners = await User.find({
        role: 'deliveryPartner',
        'deliveryPartnerData.isAvailable': true
      }).select('_id name phone deliveryPartnerData');

      if (availableDeliveryPartners.length === 0) {
        console.log('❌ No available delivery partners found');
        return;
      }

      console.log(`📦 Found ${availableDeliveryPartners.length} available delivery partners`);
      console.log(`🔌 Connected delivery partners: ${this.getConnectedDeliveryPartnersCount()}`);

      // Create notification for delivery partners
      const notification = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: order.user?.name || 'Customer',
        customerPhone: order.user?.phone || '',
        pickupAddress: this.getPickupAddress(order),
        deliveryAddress: order.deliveryAddress,
        totalAmount: order.total,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        timestamp: new Date(),
        type: 'order_assignment'
      };

      let notificationsSent = 0;
      let onlineDeliveryPartners = 0;

      // Send notification to all available delivery partners
      for (const deliveryPartner of availableDeliveryPartners) {
        const deliveryPartnerId = deliveryPartner._id.toString();

        if (this.isDeliveryPartnerOnline(deliveryPartnerId)) {
          onlineDeliveryPartners++;
          this.io.to(`delivery_${deliveryPartnerId}`).emit('order_assignment', notification);
          console.log(`🚚 Order assignment notification sent to delivery partner ${deliveryPartner.name} (ONLINE)`);
          notificationsSent++;
        } else {
          console.log(`⚠️ Delivery partner ${deliveryPartner.name} is available but not connected to socket (OFFLINE)`);
          // Still send notification - they might receive it when they reconnect or via push notifications
          this.io.to(`delivery_${deliveryPartnerId}`).emit('order_assignment', notification);
        }
      }

      console.log(`📊 Notification Summary: ${notificationsSent}/${availableDeliveryPartners.length} sent, ${onlineDeliveryPartners} online`);

      if (notificationsSent === 0) {
        console.log(`⚠️ No delivery partner notifications were sent! Available: ${availableDeliveryPartners.length}, Online: ${onlineDeliveryPartners}`);
      }

      // Set up timeout for order assignment (5 minutes)
      this.setupOrderAssignmentTimeout(orderId, 5 * 60 * 1000);

    } catch (error) {
      console.error('Error assigning order to delivery partners:', error);
    }
  }

  // Assign order to next available delivery partner (when one rejects)
  async assignOrderToNextDeliveryPartner(orderId, rejectedDeliveryPartnerId) {
    try {
      const Order = (await import('../models/Order.js')).default;
      const { User } = await import('../models/usermodel.js');

      const order = await Order.findById(orderId).populate('user', 'name phone');
      if (!order || order.orderStatus !== 'preparing') {
        console.log('❌ Order not found or not ready for delivery assignment');
        return;
      }

      // Find available delivery partners excluding the one who rejected
      const availableDeliveryPartners = await User.find({
        role: 'deliveryPartner',
        'deliveryPartnerData.isAvailable': true,
        _id: { $ne: rejectedDeliveryPartnerId }
      }).select('_id name phone deliveryPartnerData');

      if (availableDeliveryPartners.length === 0) {
        console.log('❌ No other available delivery partners found');
        // TODO: Implement fallback logic (notify admin, etc.)
        return;
      }

      console.log(`📦 Reassigning order to ${availableDeliveryPartners.length} other delivery partners`);

      // Create notification for remaining delivery partners
      const notification = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: order.user?.name || 'Customer',
        customerPhone: order.user?.phone || '',
        pickupAddress: this.getPickupAddress(order),
        deliveryAddress: order.deliveryAddress,
        totalAmount: order.total,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        timestamp: new Date(),
        type: 'order_assignment'
      };

      // Send notification to remaining available delivery partners
      for (const deliveryPartner of availableDeliveryPartners) {
        const deliveryPartnerId = deliveryPartner._id.toString();

        if (this.isDeliveryPartnerOnline(deliveryPartnerId)) {
          this.io.to(`delivery_${deliveryPartnerId}`).emit('order_assignment', notification);
          console.log(`🚚 Order reassignment notification sent to delivery partner ${deliveryPartner.name}`);
        }
      }

    } catch (error) {
      console.error('Error reassigning order to delivery partners:', error);
    }
  }

  // Helper method to get pickup address
  getPickupAddress(order) {
    if (order.items && order.items.length > 0) {
      const firstItem = order.items[0];
      if (firstItem.vendorId && firstItem.vendorId.address) {
        return firstItem.vendorId.address;
      }
      if (firstItem.vendorName) {
        return `${firstItem.vendorName} Location`;
      }
    }
    return 'Vendor Location';
  }

  // Setup timeout for order assignment
  setupOrderAssignmentTimeout(orderId, timeoutMs) {
    const timeoutId = setTimeout(() => {
      console.log(`⏰ Order assignment timeout for order ${orderId}`);
      // TODO: Implement timeout logic (notify admin, mark as unassigned, etc.)
      this.orderAssignmentTimeouts.delete(orderId);
    }, timeoutMs);

    if (!this.orderAssignmentTimeouts) {
      this.orderAssignmentTimeouts = new Map();
    }
    this.orderAssignmentTimeouts.set(orderId, timeoutId);
  }

  // Clear order assignment timeout
  clearOrderAssignmentTimeout(orderId) {
    if (this.orderAssignmentTimeouts && this.orderAssignmentTimeouts.has(orderId)) {
      clearTimeout(this.orderAssignmentTimeouts.get(orderId));
      this.orderAssignmentTimeouts.delete(orderId);
    }
  }

  // Notify delivery partners about new orders ready for pickup (legacy method)
  notifyDeliveryPartnersNewOrder(order) {
    try {
      const notification = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: order.user?.name || 'Customer',
        customerPhone: order.user?.phone || '',
        pickupAddress: this.getPickupAddress(order),
        deliveryAddress: order.deliveryAddress,
        totalAmount: order.total,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        timestamp: new Date()
      };

      // Broadcast to all connected delivery partners
      this.io.to('delivery_partners').emit('new_delivery_order', notification);
      console.log(`🚚 New delivery order notification sent to all delivery partners`);
    } catch (error) {
      console.error('Error sending delivery partner notification:', error);
    }
  }

  // Notify specific delivery partner about order assignment
  notifyDeliveryPartnerOrderAssigned(deliveryPartnerId, order) {
    try {
      const notification = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: order.user?.name || 'Customer',
        customerPhone: order.user?.phone || '',
        pickupAddress: order.items[0]?.vendorId?.address || 'Vendor Location',
        deliveryAddress: order.deliveryAddress,
        totalAmount: order.total,
        status: 'assigned',
        timestamp: new Date()
      };

      this.io.to(`delivery_${deliveryPartnerId}`).emit('order_assigned', notification);
      console.log(`🚚 Order assigned notification sent to delivery partner ${deliveryPartnerId}`);
    } catch (error) {
      console.error('Error sending order assignment notification:', error);
    }
  }

  // Notify user about delivery status update
  notifyUserDeliveryUpdate(userId, orderUpdate) {
    try {
      this.io.to(`user_${userId}`).emit('delivery_update', orderUpdate);
      console.log(`📱 Delivery update sent to user ${userId}`);
    } catch (error) {
      console.error('Error sending delivery update:', error);
    }
  }

  // Get connected delivery partners count
  getConnectedDeliveryPartnersCount() {
    return this.connectedDeliveryPartners.size;
  }

  // Check if delivery partner is online
  isDeliveryPartnerOnline(deliveryPartnerId) {
    return this.connectedDeliveryPartners.has(deliveryPartnerId.toString());
  }

  // Debug method to get delivery partner connection status
  getDeliveryPartnerConnectionStatus() {
    return {
      connectedCount: this.connectedDeliveryPartners.size,
      connectedPartners: Array.from(this.connectedDeliveryPartners.keys())
    };
  }

  // Debug method to manually trigger delivery assignment (for testing)
  async debugAssignOrder(orderId) {
    console.log(`🔧 DEBUG: Manually triggering delivery assignment for order ${orderId}`);
    await this.assignOrderToDeliveryPartners(orderId);
  }

  // Notify delivery partner about user location update
  notifyDeliveryPartnerLocationUpdate(deliveryPartnerId, locationData) {
    try {
      if (this.isDeliveryPartnerOnline(deliveryPartnerId)) {
        this.io.to(`delivery_${deliveryPartnerId}`).emit('user_location_update', locationData);
        console.log(`📍 User location update sent to delivery partner ${deliveryPartnerId}`);
      } else {
        console.log(`⚠️ Delivery partner ${deliveryPartnerId} is offline, location update not sent`);
      }
    } catch (error) {
      console.error('Error notifying delivery partner about location update:', error);
    }
  }

  // Get connected delivery partners count
  getConnectedDeliveryPartnersCount() {
    return this.connectedDeliveryPartners.size;
  }

  // Handle delivery assignment response
  async handleDeliveryAssignmentResponse(orderId, action, deliveryPartnerId) {
    try {
      const Order = (await import('../models/Order.js')).default;
      const { User } = await import('../models/usermodel.js');

      const order = await Order.findById(orderId).populate('user', 'name phone');
      if (!order) {
        console.log('❌ Order not found for delivery assignment response');
        return;
      }

      if (action === 'accept') {
        // Check if order is still available for assignment
        if (order.orderStatus !== 'preparing' || order.deliveryPartner) {
          console.log('❌ Order is no longer available for assignment');
          return;
        }

        // Assign delivery partner to order
        order.deliveryPartner = deliveryPartnerId;
        order.orderStatus = 'out_for_delivery';
        order.statusTimeline.push({
          status: 'out_for_delivery',
          timestamp: new Date()
        });
        await order.save();

        // Get delivery partner details
        const deliveryPartner = await User.findById(deliveryPartnerId);

        // Notify delivery partner about successful assignment
        this.io.to(`delivery_${deliveryPartnerId}`).emit('order_assigned', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          customerName: order.user?.name || 'Customer',
          customerPhone: order.user?.phone || '',
          pickupAddress: this.getPickupAddress(order),
          deliveryAddress: order.deliveryAddress,
          totalAmount: order.total,
          status: 'assigned',
          timestamp: new Date()
        });

        // Notify user about delivery partner assignment
        this.notifyUserOrderUpdate(order.user._id.toString(), {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: 'out_for_delivery',
          message: 'Your order is out for delivery!',
          deliveryPartner: {
            name: deliveryPartner?.name || 'Delivery Partner',
            phone: deliveryPartner?.phone || '',
            vehicleType: deliveryPartner?.deliveryPartnerData?.vehicleType || 'bike'
          }
        });

        console.log(`✅ Order ${order.orderNumber} assigned to delivery partner ${deliveryPartner?.name}`);

      } else if (action === 'reject') {
        // Reassign to other available delivery partners
        await this.assignOrderToNextDeliveryPartner(orderId, deliveryPartnerId);
        console.log(`❌ Order ${order.orderNumber} rejected by delivery partner, reassigning...`);
      }

    } catch (error) {
      console.error('Error handling delivery assignment response:', error);
    }
  }

  // Handle order status updates from delivery partners
  async handleOrderStatusUpdate(orderId, status, deliveryPartnerId, socket) {
    try {
      const Order = (await import('../models/Order.js')).default;
      const { User } = await import('../models/usermodel.js');

      const order = await Order.findById(orderId).populate('user', 'name phone');
      if (!order) {
        console.log('❌ Order not found for status update');
        socket.emit('order_status_error', {
          orderId,
          message: 'Order not found'
        });
        return;
      }

      // Check if order is assigned to this delivery partner
      if (!order.deliveryPartner || order.deliveryPartner.toString() !== deliveryPartnerId) {
        console.log('❌ Order not assigned to this delivery partner');
        socket.emit('order_status_error', {
          orderId,
          message: 'Order not assigned to you'
        });
        return;
      }

      // Validate status transition
      const validStatuses = ['out_for_delivery', 'delivered'];
      if (!validStatuses.includes(status)) {
        console.log(`❌ Invalid status: ${status}`);
        socket.emit('order_status_error', {
          orderId,
          message: 'Invalid order status'
        });
        return;
      }

      // Update order status
      order.orderStatus = status;
      order.statusTimeline.push({
        status: status,
        timestamp: new Date()
      });
      await order.save();

      // Get delivery partner details
      const deliveryPartner = await User.findById(deliveryPartnerId);

      // Notify delivery partner about successful update
      socket.emit('order_status_updated', {
        orderId,
        status,
        message: 'Order status updated successfully'
      });

      // Notify user about status update
      this.notifyUserOrderUpdate(order.user._id.toString(), {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: status,
        message: this.getStatusMessage(status),
        timestamp: new Date(),
        deliveryPartner: {
          name: deliveryPartner?.name || 'Delivery Partner',
          phone: deliveryPartner?.phone || '',
          vehicleType: deliveryPartner?.deliveryPartnerData?.vehicleType || 'bike'
        }
      });

      console.log(`✅ Order ${order.orderNumber} status updated to ${status} by ${deliveryPartner?.name}`);

    } catch (error) {
      console.error('Error handling order status update:', error);
      socket.emit('order_status_error', {
        orderId,
        message: 'Failed to update order status'
      });
    }
  }

  // Get status message for user notifications
  getStatusMessage(status) {
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

  // Reassign order to other delivery partners when one rejects
  async reassignOrderToOtherDeliveryPartners(orderId, rejectedDeliveryPartnerId) {
    try {
      await this.assignOrderToNextDeliveryPartner(orderId, rejectedDeliveryPartnerId);
    } catch (error) {
      console.error('Error reassigning order:', error);
    }
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
