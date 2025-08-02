import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import Vendor from "../models/Vendor.js";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";
import { generateMenuItemSlug } from "../utils/slugUtils.js";

// Get all vendors
export const getAllVendors = catchAsyncError(async (req, res, next) => {
  try {
    // Add timeout for database operations
    const findVendorsWithTimeout = () => {
      return Promise.race([
        Vendor.find({ isActive: true }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database operation timeout')), 8000)
        )
      ]);
    };

    const vendors = await findVendorsWithTimeout();

    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    console.error("Error in getAllVendors:", error);

    // Handle specific database connection errors
    if (error.name === 'MongooseError' || error.message.includes('buffering timed out') || error.message.includes('Database operation timeout')) {
      return next(new ErrorHandler("Database connection issue. Please try again later.", 503));
    }

    return next(new ErrorHandler("Failed to retrieve vendors", 500));
  }
});

// Get vendor by ID
export const getVendorById = catchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ErrorHandler("Invalid vendor ID", 400));
    }

    const vendor = await Vendor.findById(id);

    if (!vendor) {
      return next(new ErrorHandler("Vendor not found", 404));
    }

    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    console.error("Error in getVendorById:", error);
    return next(new ErrorHandler("Failed to retrieve vendor", 500));
  }
});

// Get vendor by slug
export const getVendorBySlug = catchAsyncError(async (req, res, next) => {
  try {
    const { slug } = req.params;

    const vendor = await Vendor.findOne({ slug, isActive: true });

    if (!vendor) {
      return next(new ErrorHandler("Vendor not found", 404));
    }

    // Get menu items for this vendor
    const menuItems = await MenuItem.find({
      vendorId: vendor._id,
      isAvailable: true
    });

    res.status(200).json({
      success: true,
      data: {
        vendor,
        menuItems
      }
    });
  } catch (error) {
    console.error("Error in getVendorBySlug:", error);
    return next(new ErrorHandler("Failed to retrieve vendor", 500));
  }
});

// Search vendors
export const searchVendors = catchAsyncError(async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query) {
      return next(new ErrorHandler("Search query is required", 400));
    }

    const vendors = await Vendor.find({
      $text: { $search: query },
      isActive: true
    });

    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    console.error("Error in searchVendors:", error);
    return next(new ErrorHandler("Failed to search vendors", 500));
  }
});

// Get vendor dashboard data
export const getVendorDashboard = catchAsyncError(async (req, res, next) => {
  try {
    const { vendorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return next(new ErrorHandler("Invalid vendor ID", 400));
    }

    // Get vendor details
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return next(new ErrorHandler("Vendor not found", 404));
    }

    // Import Order model dynamically to avoid circular dependency
    const { default: Order } = await import('../models/Order.js');

    // Date calculations
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Week calculations (last 7 days)
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Month calculations (current month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Get all orders for this vendor
    const allOrders = await Order.find({
      'items.vendorId': vendorId,
      orderStatus: { $in: ['delivered', 'preparing', 'ready', 'out_for_delivery'] } // Only count completed/active orders
    }).sort({ createdAt: -1 });

    // Calculate earnings for different periods
    let totalEarnings = 0;
    let todaysEarnings = 0;
    let weeklyEarnings = 0;
    let monthlyEarnings = 0;

    let todaysOrdersCount = 0;
    let weeklyOrdersCount = 0;
    let monthlyOrdersCount = 0;

    let todaysItemsSold = 0;
    let weeklyItemsSold = 0;
    let monthlyItemsSold = 0;

    // Daily breakdown for the week (last 7 days)
    const dailyBreakdown = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      dailyBreakdown.push({
        date: date.toISOString().split('T')[0],
        earnings: 0,
        orders: 0,
        itemsSold: 0
      });
    }

    // Process all orders
    allOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      let orderEarnings = 0;
      let orderItemsSold = 0;

      // Calculate earnings from items belonging to this vendor
      order.items.forEach(item => {
        if (item.vendorId && item.vendorId.toString() === vendorId) {
          const itemEarnings = item.selectedSubcategory.price * item.quantity;
          orderEarnings += itemEarnings;
          orderItemsSold += item.quantity;
          totalEarnings += itemEarnings;
        }
      });

      // Today's calculations
      if (orderDate >= today && orderDate < endOfDay) {
        todaysEarnings += orderEarnings;
        todaysOrdersCount++;
        todaysItemsSold += orderItemsSold;
      }

      // Weekly calculations
      if (orderDate >= weekAgo) {
        weeklyEarnings += orderEarnings;
        weeklyOrdersCount++;
        weeklyItemsSold += orderItemsSold;

        // Add to daily breakdown
        const dayIndex = Math.floor((orderDate - weekAgo) / (24 * 60 * 60 * 1000));
        if (dayIndex >= 0 && dayIndex < 7) {
          dailyBreakdown[dayIndex].earnings += orderEarnings;
          dailyBreakdown[dayIndex].orders++;
          dailyBreakdown[dayIndex].itemsSold += orderItemsSold;
        }
      }

      // Monthly calculations
      if (orderDate >= startOfMonth && orderDate < endOfMonth) {
        monthlyEarnings += orderEarnings;
        monthlyOrdersCount++;
        monthlyItemsSold += orderItemsSold;
      }
    });

    // Get recent orders (last 10)
    const recentOrders = await Order.find({
      'items.vendorId': vendorId
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('user', 'name phone');

    res.status(200).json({
      success: true,
      data: {
        vendor,
        todaysSummary: {
          earnings: todaysEarnings,
          orders: todaysOrdersCount,
          itemsSold: todaysItemsSold
        },
        earningsData: {
          total: totalEarnings,
          today: todaysEarnings,
          weekly: weeklyEarnings,
          monthly: monthlyEarnings,
          dailyBreakdown,
          weeklyStats: {
            orders: weeklyOrdersCount,
            itemsSold: weeklyItemsSold
          },
          monthlyStats: {
            orders: monthlyOrdersCount,
            itemsSold: monthlyItemsSold
          }
        },
        recentOrders
      }
    });
  } catch (error) {
    console.error("Error in getVendorDashboard:", error);
    return next(new ErrorHandler("Failed to retrieve vendor dashboard", 500));
  }
});

// Update vendor status (open/closed)
export const updateVendorStatus = catchAsyncError(async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return next(new ErrorHandler("Invalid vendor ID", 400));
    }

    const vendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { isActive },
      { new: true }
    );

    if (!vendor) {
      return next(new ErrorHandler("Vendor not found", 404));
    }

    res.status(200).json({
      success: true,
      message: `Vendor status updated to ${isActive ? 'Open' : 'Closed'}`,
      data: vendor
    });
  } catch (error) {
    console.error("Error in updateVendorStatus:", error);
    return next(new ErrorHandler("Failed to update vendor status", 500));
  }
});

// Get vendor menu items grouped by category
export const getVendorMenuItems = catchAsyncError(async (req, res, next) => {
  try {
    const { vendorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return next(new ErrorHandler("Invalid vendor ID", 400));
    }

    // Get all menu items for this vendor
    const menuItems = await MenuItem.find({ vendorId }).sort({ itemCategory: 1, itemName: 1 });

    // Group items by category
    const groupedItems = {};
    menuItems.forEach(item => {
      if (!groupedItems[item.itemCategory]) {
        groupedItems[item.itemCategory] = [];
      }
      groupedItems[item.itemCategory].push(item);
    });

    res.status(200).json({
      success: true,
      data: {
        categories: Object.keys(groupedItems),
        groupedItems,
        totalItems: menuItems.length
      }
    });
  } catch (error) {
    console.error("Error in getVendorMenuItems:", error);
    return next(new ErrorHandler("Failed to retrieve vendor menu items", 500));
  }
});

// Update menu item availability
export const updateMenuItemAvailability = catchAsyncError(async (req, res, next) => {
  try {
    const { vendorId, itemId } = req.params;
    const { isAvailable } = req.body;

    if (!mongoose.Types.ObjectId.isValid(vendorId) || !mongoose.Types.ObjectId.isValid(itemId)) {
      return next(new ErrorHandler("Invalid vendor ID or item ID", 400));
    }

    // Verify the item belongs to this vendor
    const menuItem = await MenuItem.findOne({ _id: itemId, vendorId });
    if (!menuItem) {
      return next(new ErrorHandler("Menu item not found or doesn't belong to this vendor", 404));
    }

    // Update availability
    const updatedItem = await MenuItem.findByIdAndUpdate(
      itemId,
      { isAvailable },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Item ${isAvailable ? 'enabled' : 'disabled'} successfully`,
      data: updatedItem
    });
  } catch (error) {
    console.error("Error in updateMenuItemAvailability:", error);
    return next(new ErrorHandler("Failed to update menu item availability", 500));
  }
});

// Get vendor profile for authenticated vendor
export const getVendorProfile = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find vendor by userId
    const vendor = await Vendor.findOne({ userId }).populate('userId', 'name email phone');

    if (!vendor) {
      return next(new ErrorHandler("Vendor profile not found", 404));
    }

    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    console.error("Error in getVendorProfile:", error);
    return next(new ErrorHandler("Failed to retrieve vendor profile", 500));
  }
});

// Add new menu item for authenticated vendor
export const addMenuItem = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { itemName, description, itemCategory, subcategories, image } = req.body;

    // Find vendor by userId
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
      return next(new ErrorHandler("Vendor not found", 404));
    }

    // Validate required fields
    if (!itemName || !description || !itemCategory || !subcategories || subcategories.length === 0) {
      return next(new ErrorHandler("All fields are required: itemName, description, itemCategory, subcategories", 400));
    }

    // Create new menu item
    const newMenuItem = new MenuItem({
      vendorId: vendor._id,
      itemName,
      description,
      itemCategory,
      subcategories,
      image: image || '/images/default-item.jpg',
      slug: generateMenuItemSlug(itemName),
      isAvailable: true
    });

    await newMenuItem.save();

    res.status(201).json({
      success: true,
      message: "Menu item added successfully",
      data: newMenuItem
    });
  } catch (error) {
    console.error("Error in addMenuItem:", error);
    return next(new ErrorHandler("Failed to add menu item", 500));
  }
});

// Update menu item for authenticated vendor
export const updateMenuItem = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;
    const updateData = req.body;

    // Find vendor by userId
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
      return next(new ErrorHandler("Vendor not found", 404));
    }

    // Verify the item belongs to this vendor
    const menuItem = await MenuItem.findOne({ _id: itemId, vendorId: vendor._id });
    if (!menuItem) {
      return next(new ErrorHandler("Menu item not found or doesn't belong to this vendor", 404));
    }

    // Update slug if itemName is being changed
    if (updateData.itemName && updateData.itemName !== menuItem.itemName) {
      updateData.slug = generateMenuItemSlug(updateData.itemName);
    }

    // Update the menu item
    const updatedItem = await MenuItem.findByIdAndUpdate(
      itemId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      data: updatedItem
    });
  } catch (error) {
    console.error("Error in updateMenuItem:", error);
    return next(new ErrorHandler("Failed to update menu item", 500));
  }
});

// Delete menu item for authenticated vendor
export const deleteMenuItem = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;

    // Find vendor by userId
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
      return next(new ErrorHandler("Vendor not found", 404));
    }

    // Verify the item belongs to this vendor
    const menuItem = await MenuItem.findOne({ _id: itemId, vendorId: vendor._id });
    if (!menuItem) {
      return next(new ErrorHandler("Menu item not found or doesn't belong to this vendor", 404));
    }

    // Delete the menu item
    await MenuItem.findByIdAndDelete(itemId);

    res.status(200).json({
      success: true,
      message: "Menu item deleted successfully"
    });
  } catch (error) {
    console.error("Error in deleteMenuItem:", error);
    return next(new ErrorHandler("Failed to delete menu item", 500));
  }
});

// Get orders for authenticated vendor
export const getVendorOrders = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    // Find vendor by userId
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
      return next(new ErrorHandler("Vendor not found", 404));
    }

    // Build query to find orders containing items from this vendor
    const query = { 'items.vendorId': vendor._id };
    if (status) {
      query.orderStatus = status;
    }

    // Get orders with pagination
    const orders = await Order.find(query)
      .populate('user', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter items in each order to only show this vendor's items
    const filteredOrders = orders.map(order => ({
      ...order.toObject(),
      items: order.items.filter(item => item.vendorId.toString() === vendor._id.toString())
    }));

    const totalOrders = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        orders: filteredOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNext: page < Math.ceil(totalOrders / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error("Error in getVendorOrders:", error);
    return next(new ErrorHandler("Failed to retrieve vendor orders", 500));
  }
});

// Update order status for authenticated vendor
export const updateOrderStatus = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;
    const { orderStatus, action } = req.body; // action can be 'accept' or 'reject'

    // Find vendor by userId
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
      return next(new ErrorHandler("Vendor not found", 404));
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return next(new ErrorHandler("Order not found", 404));
    }

    // Check if this order contains items from this vendor
    const hasVendorItems = order.items.some(item =>
      item.vendorId && item.vendorId.toString() === vendor._id.toString()
    );

    if (!hasVendorItems) {
      return next(new ErrorHandler("This order doesn't contain items from your restaurant", 403));
    }

    // Handle accept/reject actions
    if (action === 'accept') {
      // Move directly to preparing (skip confirmed status for now)
      order.orderStatus = 'preparing';
      order.isPendingVendorResponse = false;
      order.vendorResponseDeadline = null;

      // Add confirmed status to timeline first
      order.statusTimeline.push({
        status: 'confirmed',
        timestamp: new Date()
      });

      // Then add preparing status to timeline
      order.statusTimeline.push({
        status: 'preparing',
        timestamp: new Date()
      });

      console.log(`✅ Order ${order.orderNumber} moved to preparing after vendor acceptance`);

    } else if (action === 'reject') {
      order.orderStatus = 'cancelled';
      order.isPendingVendorResponse = false;
      order.vendorResponseDeadline = null;
      order.statusTimeline.push({
        status: 'cancelled',
        timestamp: new Date()
      });
    } else if (orderStatus) {
      // Direct status update
      order.orderStatus = orderStatus;
      order.statusTimeline.push({
        status: orderStatus,
        timestamp: new Date()
      });
    } else {
      return next(new ErrorHandler("Please provide either action (accept/reject) or orderStatus", 400));
    }

    order.updatedAt = new Date();
    await order.save();

    // Import socketService for real-time notifications
    const { default: socketService } = await import('../services/socketService.js');

    // Notify user about order status update
    socketService.notifyUserOrderUpdate(order.user._id.toString(), {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.orderStatus,
      message: action === 'accept' ? 'Your order is being prepared!' : 'Your order was declined by the restaurant',
      timestamp: new Date(),
      vendor: {
        name: vendor.name,
        phone: vendor.phone
      }
    });

    // If order was accepted and moved to preparing, assign to delivery partners
    if (action === 'accept' && order.orderStatus === 'preparing') {
      try {
        console.log(`🚚 Triggering delivery partner assignment for order ${order._id}`);
        await socketService.assignOrderToDeliveryPartners(order._id.toString());
        console.log(`🚚 Delivery partner assignment triggered for order ${order.orderNumber}`);
      } catch (error) {
        console.error(`❌ Error assigning order ${order.orderNumber} to delivery partners:`, error);
      }
    }

    res.status(200).json({
      success: true,
      message: `Order ${action || 'status updated'} successfully`,
      data: order
    });
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    return next(new ErrorHandler("Failed to update order status", 500));
  }
});

// Get pending vendor requests
export const getPendingVendorRequests = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    // Find vendor by userId
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
      return next(new ErrorHandler("Vendor not found", 404));
    }

    // Build query to find pending orders for this vendor
    const query = {
      'items.vendorId': vendor._id,
      isPendingVendorResponse: true,
      orderStatus: 'pending_vendor_response'
    };

    // Get pending orders with pagination
    const pendingOrders = await Order.find(query)
      .populate('user', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const totalCount = await Order.countDocuments(query);

    // Filter items for this vendor only
    const processedOrders = pendingOrders.map(order => {
      const vendorItems = order.items.filter(item =>
        item.vendorId && item.vendorId.toString() === vendor._id.toString()
      );

      return {
        ...order.toObject(),
        items: vendorItems
      };
    });

    res.status(200).json({
      success: true,
      data: processedOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error("Error in getPendingVendorRequests:", error);
    return next(new ErrorHandler("Failed to get pending vendor requests", 500));
  }
});
