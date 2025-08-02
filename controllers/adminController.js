import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import { User } from "../models/usermodel.js";
import Vendor from "../models/Vendor.js";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
import AppSettings from "../models/AppSettings.js";

// Dashboard Statistics
export const getDashboardStats = catchAsyncError(async (req, res, next) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalVendors = await User.countDocuments({ role: 'vendor' });
    const totalDeliveryPartners = await User.countDocuments({ role: 'deliveryPartner' });
    const totalOrders = await Order.countDocuments();
    const totalMenuItems = await MenuItem.countDocuments();
    const totalReviews = await Review.countDocuments();

    // Get earnings
    const totalEarnings = await Order.aggregate([
      { $match: { orderStatus: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name phone')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get monthly stats
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyOrders = await Order.countDocuments({
      createdAt: { $gte: currentMonth }
    });

    const monthlyEarnings = await Order.aggregate([
      { 
        $match: { 
          orderStatus: 'delivered',
          createdAt: { $gte: currentMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // Get order status distribution
    const orderStatusStats = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          vendors: totalVendors,
          deliveryPartners: totalDeliveryPartners,
          orders: totalOrders,
          menuItems: totalMenuItems,
          reviews: totalReviews,
          earnings: totalEarnings[0]?.total || 0
        },
        monthly: {
          orders: monthlyOrders,
          earnings: monthlyEarnings[0]?.total || 0
        },
        recentOrders,
        orderStatusStats
      }
    });
  } catch (error) {
    next(error);
  }
});

// Orders Management
export const getAllOrdersAdmin = catchAsyncError(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const search = req.query.search;

    let query = {};
    
    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'deliveryAddress.formatted': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('user', 'name phone email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalOrders = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNext: page < Math.ceil(totalOrders / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export const updateOrderStatusAdmin = catchAsyncError(async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return next(new ErrorHandler("Order not found", 404));
    }

    // Update order status
    order.orderStatus = status;
    order.statusTimeline.push({
      status,
      timestamp: new Date()
    });

    if (reason) {
      order.adminNotes = reason;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order
    });
  } catch (error) {
    next(error);
  }
});

// Vendors Management
export const getAllVendorsAdmin = catchAsyncError(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const search = req.query.search;

    let userQuery = { role: 'vendor' };

    if (status === 'blocked') {
      userQuery.isBlocked = true;
    } else if (status === 'active') {
      userQuery.isBlocked = { $ne: true };
      userQuery.isApproved = true;
    } else if (status === 'pending') {
      userQuery.isApproved = false;
    } else if (status === 'approved') {
      userQuery.isApproved = true;
    }

    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const vendorUsers = await User.find(userQuery)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get vendor profiles for each user
    const vendorsWithProfiles = await Promise.all(
      vendorUsers.map(async (user) => {
        const vendorProfile = await Vendor.findOne({ userId: user._id });
        const orderCount = await Order.countDocuments({
          'items.vendorId': vendorProfile?._id
        });
        const menuItemCount = await MenuItem.countDocuments({
          vendorId: vendorProfile?._id
        });

        return {
          user: user.toObject(),
          profile: vendorProfile,
          stats: {
            totalOrders: orderCount,
            totalMenuItems: menuItemCount
          }
        };
      })
    );

    const totalVendors = await User.countDocuments(userQuery);

    res.status(200).json({
      success: true,
      data: {
        vendors: vendorsWithProfiles,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalVendors / limit),
          totalVendors,
          hasNext: page < Math.ceil(totalVendors / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export const getVendorDetails = catchAsyncError(async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    
    const vendorUser = await User.findById(vendorId).select('-password');
    if (!vendorUser || vendorUser.role !== 'vendor') {
      return next(new ErrorHandler("Vendor not found", 404));
    }

    const vendorProfile = await Vendor.findOne({ userId: vendorId });
    const menuItems = await MenuItem.find({ vendorId: vendorProfile?._id });
    const orders = await Order.find({
      'items.vendorId': vendorProfile?._id
    }).populate('user', 'name phone').sort({ createdAt: -1 }).limit(10);

    const reviews = await Review.find({
      targetType: 'Vendor',
      targetId: vendorProfile?._id
    }).populate('userId', 'name').sort({ createdAt: -1 }).limit(10);

    res.status(200).json({
      success: true,
      data: {
        user: vendorUser,
        profile: vendorProfile,
        menuItems,
        recentOrders: orders,
        recentReviews: reviews,
        stats: {
          totalMenuItems: menuItems.length,
          totalOrders: orders.length,
          averageRating: vendorProfile?.rating || 0,
          totalReviews: vendorProfile?.totalReviews || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export const approveVendor = catchAsyncError(async (req, res, next) => {
  try {
    const { vendorId } = req.params;

    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return next(new ErrorHandler("Vendor not found", 404));
    }

    if (vendor.isApproved) {
      return next(new ErrorHandler("Vendor is already approved", 400));
    }

    vendor.isApproved = true;
    vendor.isBlocked = false;
    await vendor.save();

    // TODO: Send approval email notification to vendor
    // You can implement email notification here using nodemailer

    res.status(200).json({
      success: true,
      message: "Vendor approved successfully",
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        role: vendor.role,
        isApproved: vendor.isApproved,
        isBlocked: vendor.isBlocked,
        createdAt: vendor.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

export const rejectVendor = catchAsyncError(async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    const { reason } = req.body;

    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return next(new ErrorHandler("Vendor not found", 404));
    }

    if (vendor.isApproved) {
      return next(new ErrorHandler("Cannot reject an already approved vendor. Use block instead.", 400));
    }

    // For rejection, we can either delete the user or mark them as rejected
    // Here we'll delete the user account as it's a rejection during approval process
    await User.findByIdAndDelete(vendorId);

    // TODO: Send rejection email notification to vendor
    // You can implement email notification here using nodemailer

    res.status(200).json({
      success: true,
      message: `Vendor application rejected${reason ? `: ${reason}` : ''}`
    });
  } catch (error) {
    next(error);
  }
});

export const blockVendor = catchAsyncError(async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    const { reason } = req.body;
    
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return next(new ErrorHandler("Vendor not found", 404));
    }

    vendor.isBlocked = true;
    vendor.blockReason = reason;
    await vendor.save();

    res.status(200).json({
      success: true,
      message: "Vendor blocked successfully",
      vendor
    });
  } catch (error) {
    next(error);
  }
});

export const unblockVendor = catchAsyncError(async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return next(new ErrorHandler("Vendor not found", 404));
    }

    vendor.isBlocked = false;
    vendor.blockReason = undefined;
    await vendor.save();

    res.status(200).json({
      success: true,
      message: "Vendor unblocked successfully",
      vendor
    });
  } catch (error) {
    next(error);
  }
});

export const deleteVendor = catchAsyncError(async (req, res, next) => {
  try {
    const { vendorId } = req.params;

    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return next(new ErrorHandler("Vendor not found", 404));
    }

    // Find vendor profile
    const vendorProfile = await Vendor.findOne({ userId: vendorId });

    // Delete associated data
    if (vendorProfile) {
      await MenuItem.deleteMany({ vendorId: vendorProfile._id });
      await Review.deleteMany({ targetType: 'Vendor', targetId: vendorProfile._id });
      await Vendor.findByIdAndDelete(vendorProfile._id);
    }

    // Delete user
    await User.findByIdAndDelete(vendorId);

    res.status(200).json({
      success: true,
      message: "Vendor deleted successfully"
    });
  } catch (error) {
    next(error);
  }
});

// Menu Items Management
export const getAllMenuItemsAdmin = catchAsyncError(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category;
    const search = req.query.search;
    const vendorId = req.query.vendorId;

    let query = {};

    if (category && category !== 'all') {
      query.itemCategory = category;
    }

    if (vendorId) {
      query.vendorId = vendorId;
    }

    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { itemCategory: { $regex: search, $options: 'i' } }
      ];
    }

    const menuItems = await MenuItem.find(query)
      .populate('vendorId', 'name location')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalItems = await MenuItem.countDocuments(query);

    // Get categories for filter
    const categories = await MenuItem.distinct('itemCategory');

    res.status(200).json({
      success: true,
      data: {
        menuItems,
        categories,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          hasNext: page < Math.ceil(totalItems / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export const updateMenuItemAdmin = catchAsyncError(async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const updateData = req.body;

    const menuItem = await MenuItem.findById(itemId);
    if (!menuItem) {
      return next(new ErrorHandler("Menu item not found", 404));
    }

    // Update menu item
    Object.assign(menuItem, updateData);
    await menuItem.save();

    res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      menuItem
    });
  } catch (error) {
    next(error);
  }
});

export const deleteMenuItemAdmin = catchAsyncError(async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const menuItem = await MenuItem.findById(itemId);
    if (!menuItem) {
      return next(new ErrorHandler("Menu item not found", 404));
    }

    // Delete associated reviews
    await Review.deleteMany({ targetType: 'MenuItem', targetId: itemId });

    // Delete menu item
    await MenuItem.findByIdAndDelete(itemId);

    res.status(200).json({
      success: true,
      message: "Menu item deleted successfully"
    });
  } catch (error) {
    next(error);
  }
});

// Reviews Management
export const getAllReviewsAdmin = catchAsyncError(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const targetType = req.query.targetType;

    let query = {};

    if (status && status !== 'all') {
      query.moderationStatus = status;
    }

    if (targetType && targetType !== 'all') {
      query.targetType = targetType;
    }

    const reviews = await Review.find(query)
      .populate('userId', 'name email')
      .populate('targetId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalReviews = await Review.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalReviews / limit),
          totalReviews,
          hasNext: page < Math.ceil(totalReviews / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export const moderateReviewAdmin = catchAsyncError(async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { status, reason } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return next(new ErrorHandler("Review not found", 404));
    }

    review.moderationStatus = status;
    review.isModerated = true;
    if (reason) {
      review.moderationReason = reason;
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: "Review moderated successfully",
      review
    });
  } catch (error) {
    next(error);
  }
});

export const deleteReviewAdmin = catchAsyncError(async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return next(new ErrorHandler("Review not found", 404));
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully"
    });
  } catch (error) {
    next(error);
  }
});

// Reports
export const getReportsData = catchAsyncError(async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Orders report
    const ordersData = await Order.aggregate([
      { $match: { ...dateFilter, orderStatus: 'delivered' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalOrders: { $sum: 1 },
          totalEarnings: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Vendor performance
    const vendorPerformance = await Order.aggregate([
      { $match: { ...dateFilter, orderStatus: 'delivered' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.vendorId',
          vendorName: { $first: '$items.vendorName' },
          totalOrders: { $sum: 1 },
          totalEarnings: { $sum: { $multiply: ['$items.selectedSubcategory.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalEarnings: -1 } },
      { $limit: 10 }
    ]);

    // Popular items
    const popularItems = await Order.aggregate([
      { $match: { ...dateFilter, orderStatus: 'delivered' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItemId',
          itemName: { $first: '$items.name' },
          totalOrdered: { $sum: '$items.quantity' },
          totalEarnings: { $sum: { $multiply: ['$items.selectedSubcategory.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalOrdered: -1 } },
      { $limit: 10 }
    ]);

    // Summary stats
    const summary = await Order.aggregate([
      { $match: { ...dateFilter, orderStatus: 'delivered' } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalEarnings: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          totalPlatformFee: { $sum: '$platformFee' },
          totalDeliveryCharges: { $sum: '$deliveryCharge' },
          totalTax: { $sum: '$tax' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: summary[0] || {},
        ordersData,
        vendorPerformance,
        popularItems,
        dateRange: { startDate, endDate }
      }
    });
  } catch (error) {
    next(error);
  }
});

export const exportReportsData = catchAsyncError(async (req, res, next) => {
  try {
    const { startDate, endDate, format } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const orders = await Order.find({ ...dateFilter, orderStatus: 'delivered' })
      .populate('user', 'name phone email')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // Generate CSV data
      const csvData = orders.map(order => ({
        orderNumber: order.orderNumber,
        customerName: order.user?.name || 'N/A',
        customerPhone: order.user?.phone || 'N/A',
        total: order.total,
        platformFee: order.platformFee,
        deliveryCharge: order.deliveryCharge,
        tax: order.tax,
        paymentMethod: order.paymentMethod,
        orderDate: order.createdAt.toISOString().split('T')[0],
        status: order.orderStatus
      }));

      res.status(200).json({
        success: true,
        data: csvData,
        format: 'csv'
      });
    } else {
      // Return JSON data
      res.status(200).json({
        success: true,
        data: orders,
        format: 'json'
      });
    }
  } catch (error) {
    next(error);
  }
});

// Settings
export const getAppSettings = catchAsyncError(async (req, res, next) => {
  try {
    let settings = await AppSettings.findOne();

    if (!settings) {
      // Create default settings if none exist
      settings = await AppSettings.create({
        maintenanceMode: false,
        maintenanceMessage: 'We are currently under maintenance. Please try again later.',
        platformFeePercentage: 5,
        deliveryChargeBase: 30,
        taxPercentage: 5,
        minOrderValue: 100,
        maxDeliveryRadius: 10,
        orderTimeout: 10,
        supportEmail: 'support@bandiwala.com',
        supportPhone: '+91-9876543210'
      });
    }

    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    next(error);
  }
});

export const updateAppSettings = catchAsyncError(async (req, res, next) => {
  try {
    const updateData = req.body;

    let settings = await AppSettings.findOne();

    if (!settings) {
      settings = await AppSettings.create(updateData);
    } else {
      Object.assign(settings, updateData);
      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      settings
    });
  } catch (error) {
    next(error);
  }
});
