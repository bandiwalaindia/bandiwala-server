import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import Feedback from "../models/Feedback.js";
import { User } from "../models/usermodel.js";
import Vendor from "../models/Vendor.js";
import Order from "../models/Order.js";

// Submit feedback or complaint
export const submitFeedback = catchAsyncError(async (req, res, next) => {
  const {
    type,
    category,
    subject,
    message,
    priority,
    rating,
    platform,
    appVersion,
    relatedOrderId,
    relatedVendorId
  } = req.body;

  // Validate required fields
  if (!type || !subject || !message) {
    return next(new ErrorHandler("Type, subject, and message are required", 400));
  }

  // Validate type
  if (!['feedback', 'complaint', 'suggestion', 'bug_report'].includes(type)) {
    return next(new ErrorHandler("Invalid feedback type", 400));
  }

  // Create feedback object
  const feedbackData = {
    userId: req.user._id,
    type,
    category: category || 'general',
    subject,
    message,
    priority: priority || 'medium',
    metadata: {
      userRole: req.user.role,
      platform: platform || 'android',
      appVersion: appVersion || '1.0.0'
    }
  };

  // Add optional fields
  if (rating && rating >= 1 && rating <= 5) {
    feedbackData.rating = rating;
  }

  if (relatedOrderId) {
    // Verify order exists and belongs to user (for users) or vendor has access (for vendors)
    const order = await Order.findById(relatedOrderId);
    if (order) {
      if (req.user.role === 'user' && order.userId.toString() === req.user._id.toString()) {
        feedbackData.metadata.relatedOrderId = relatedOrderId;
      } else if (req.user.role === 'vendor') {
        // For vendors, check if they have access to this order
        feedbackData.metadata.relatedOrderId = relatedOrderId;
      }
    }
  }

  if (relatedVendorId) {
    // Verify vendor exists
    const vendor = await Vendor.findById(relatedVendorId);
    if (vendor) {
      feedbackData.metadata.relatedVendorId = relatedVendorId;
    }
  }

  const feedback = await Feedback.create(feedbackData);

  // Populate user details for response
  await feedback.populate('userId', 'name email phone role');

  res.status(201).json({
    success: true,
    message: "Feedback submitted successfully",
    feedback
  });
});

// Get user's feedback history
export const getUserFeedback = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { type, status, category } = req.query;

  // Build filter
  const filter = {
    userId: req.user._id,
    isDeleted: false
  };

  if (type) filter.type = type;
  if (status) filter.status = status;
  if (category) filter.category = category;

  const feedbacks = await Feedback.find(filter)
    .populate('userId', 'name email phone role')
    .populate('adminResponse.respondedBy', 'name role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Feedback.countDocuments(filter);

  res.status(200).json({
    success: true,
    feedbacks,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    }
  });
});

// Get feedback by ID (for user to view their own feedback)
export const getFeedbackById = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const feedback = await Feedback.findOne({
    _id: id,
    userId: req.user._id,
    isDeleted: false
  })
    .populate('userId', 'name email phone role')
    .populate('adminResponse.respondedBy', 'name role')
    .populate('metadata.relatedOrderId')
    .populate('metadata.relatedVendorId');

  if (!feedback) {
    return next(new ErrorHandler("Feedback not found", 404));
  }

  res.status(200).json({
    success: true,
    feedback
  });
});

// Admin: Get all feedback with filters
export const getAllFeedbackAdmin = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const {
    type,
    status,
    category,
    priority,
    userRole,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter
  const filter = { isDeleted: false };

  if (type) filter.type = type;
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (userRole) filter['metadata.userRole'] = userRole;

  // Search functionality
  if (search) {
    filter.$or = [
      { subject: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const feedbacks = await Feedback.find(filter)
    .populate('userId', 'name email phone role')
    .populate('adminResponse.respondedBy', 'name role')
    .populate('metadata.relatedOrderId', 'orderNumber status')
    .populate('metadata.relatedVendorId', 'name slug')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Feedback.countDocuments(filter);

  // Get statistics
  const stats = await Feedback.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        totalFeedback: { $sum: 1 },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        inProgressCount: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        resolvedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        },
        complaintCount: {
          $sum: { $cond: [{ $eq: ['$type', 'complaint'] }, 1, 0] }
        },
        feedbackCount: {
          $sum: { $cond: [{ $eq: ['$type', 'feedback'] }, 1, 0] }
        },
        suggestionCount: {
          $sum: { $cond: [{ $eq: ['$type', 'suggestion'] }, 1, 0] }
        },
        bugReportCount: {
          $sum: { $cond: [{ $eq: ['$type', 'bug_report'] }, 1, 0] }
        },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  // Get feedback by category
  const categoryStats = await Feedback.aggregate([
    {
      $match: { isDeleted: false }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Get recent feedback trends (last 7 days)
  const trendStats = await Feedback.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 },
        complaints: {
          $sum: { $cond: [{ $eq: ['$type', 'complaint'] }, 1, 0] }
        }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  res.status(200).json({
    success: true,
    feedbacks,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    },
    stats: stats[0] || {
      totalFeedback: 0,
      pendingCount: 0,
      inProgressCount: 0,
      resolvedCount: 0,
      complaintCount: 0,
      feedbackCount: 0,
      suggestionCount: 0,
      bugReportCount: 0,
      avgRating: 0
    },
    categoryStats,
    trendStats
  });
});

// Admin: Get feedback by ID
export const getFeedbackByIdAdmin = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const feedback = await Feedback.findOne({
    _id: id,
    isDeleted: false
  })
    .populate('userId', 'name email phone role profileImage')
    .populate('adminResponse.respondedBy', 'name role')
    .populate('metadata.relatedOrderId')
    .populate('metadata.relatedVendorId')
    .populate('internalNotes.addedBy', 'name role');

  if (!feedback) {
    return next(new ErrorHandler("Feedback not found", 404));
  }

  res.status(200).json({
    success: true,
    feedback
  });
});

// Admin: Update feedback status
export const updateFeedbackStatus = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { status, priority } = req.body;

  // Validate status
  if (status && !['pending', 'in_progress', 'resolved', 'closed', 'rejected'].includes(status)) {
    return next(new ErrorHandler("Invalid status", 400));
  }

  // Validate priority
  if (priority && !['low', 'medium', 'high', 'urgent'].includes(priority)) {
    return next(new ErrorHandler("Invalid priority", 400));
  }

  const feedback = await Feedback.findOne({
    _id: id,
    isDeleted: false
  });

  if (!feedback) {
    return next(new ErrorHandler("Feedback not found", 404));
  }

  // Update fields
  if (status) feedback.status = status;
  if (priority) feedback.priority = priority;

  await feedback.save();

  // Populate for response
  await feedback.populate('userId', 'name email phone role');
  await feedback.populate('adminResponse.respondedBy', 'name role');

  res.status(200).json({
    success: true,
    message: "Feedback updated successfully",
    feedback
  });
});

// Admin: Respond to feedback
export const respondToFeedback = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { message, status } = req.body;

  if (!message) {
    return next(new ErrorHandler("Response message is required", 400));
  }

  const feedback = await Feedback.findOne({
    _id: id,
    isDeleted: false
  });

  if (!feedback) {
    return next(new ErrorHandler("Feedback not found", 404));
  }

  // Update admin response
  feedback.adminResponse = {
    message,
    respondedBy: req.user._id,
    respondedAt: new Date()
  };

  // Update status if provided
  if (status && ['pending', 'in_progress', 'resolved', 'closed', 'rejected'].includes(status)) {
    feedback.status = status;
  } else if (!feedback.status || feedback.status === 'pending') {
    feedback.status = 'in_progress';
  }

  await feedback.save();

  // Populate for response
  await feedback.populate('userId', 'name email phone role');
  await feedback.populate('adminResponse.respondedBy', 'name role');

  res.status(200).json({
    success: true,
    message: "Response sent successfully",
    feedback
  });
});

// Admin: Add internal note
export const addInternalNote = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { note } = req.body;

  if (!note) {
    return next(new ErrorHandler("Note is required", 400));
  }

  const feedback = await Feedback.findOne({
    _id: id,
    isDeleted: false
  });

  if (!feedback) {
    return next(new ErrorHandler("Feedback not found", 404));
  }

  // Add internal note
  feedback.internalNotes.push({
    note,
    addedBy: req.user._id,
    addedAt: new Date()
  });

  await feedback.save();

  // Populate for response
  await feedback.populate('internalNotes.addedBy', 'name role');

  res.status(200).json({
    success: true,
    message: "Internal note added successfully",
    feedback
  });
});

// Admin: Delete feedback (soft delete)
export const deleteFeedback = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const feedback = await Feedback.findOne({
    _id: id,
    isDeleted: false
  });

  if (!feedback) {
    return next(new ErrorHandler("Feedback not found", 404));
  }

  feedback.isDeleted = true;
  await feedback.save();

  res.status(200).json({
    success: true,
    message: "Feedback deleted successfully"
  });
});

// Get feedback statistics for dashboard
export const getFeedbackStats = catchAsyncError(async (req, res, next) => {
  const { period = '30' } = req.query; // days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const stats = await Feedback.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalFeedback: { $sum: 1 },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        inProgressCount: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        resolvedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        },
        complaintCount: {
          $sum: { $cond: [{ $eq: ['$type', 'complaint'] }, 1, 0] }
        },
        feedbackCount: {
          $sum: { $cond: [{ $eq: ['$type', 'feedback'] }, 1, 0] }
        },
        suggestionCount: {
          $sum: { $cond: [{ $eq: ['$type', 'suggestion'] }, 1, 0] }
        },
        bugReportCount: {
          $sum: { $cond: [{ $eq: ['$type', 'bug_report'] }, 1, 0] }
        },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  // Get feedback by category
  const categoryStats = await Feedback.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Get recent feedback trends (last 7 days)
  const trendStats = await Feedback.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 },
        complaints: {
          $sum: { $cond: [{ $eq: ['$type', 'complaint'] }, 1, 0] }
        }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  res.status(200).json({
    success: true,
    stats: stats[0] || {
      totalFeedback: 0,
      pendingCount: 0,
      inProgressCount: 0,
      resolvedCount: 0,
      complaintCount: 0,
      feedbackCount: 0,
      suggestionCount: 0,
      bugReportCount: 0,
      avgRating: 0
    },
    categoryStats,
    trendStats
  });
});
