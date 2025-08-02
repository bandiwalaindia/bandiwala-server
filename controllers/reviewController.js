import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import Review from "../models/Review.js";
import MenuItem from "../models/MenuItem.js";
import Vendor from "../models/Vendor.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";

// Create a new review (verified purchase only)
export const createReview = catchAsyncError(async (req, res, next) => {
  const { targetType, targetId, rating, comment, orderId } = req.body;
  const userId = req.user._id;

  // Validate input
  if (!targetType || !targetId || !rating || !comment || !orderId) {
    return next(new ErrorHandler("All fields including order ID are required", 400));
  }

  if (!['MenuItem', 'Vendor'].includes(targetType)) {
    return next(new ErrorHandler("Invalid target type", 400));
  }

  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return next(new ErrorHandler("Invalid target ID", 400));
  }

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return next(new ErrorHandler("Invalid order ID", 400));
  }

  // Verify that the user has ordered this item
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
    orderStatus: 'delivered' // Only allow reviews for delivered orders
  });

  if (!order) {
    return next(new ErrorHandler("Order not found or not delivered yet", 404));
  }

  // Check if the item exists in the order
  const hasOrderedItem = order.items.some(item =>
    item.menuItemId.toString() === targetId.toString()
  );

  if (!hasOrderedItem) {
    return next(new ErrorHandler("You haven't ordered this item in the specified order", 400));
  }

  // Check if target exists
  let target;
  if (targetType === 'MenuItem') {
    target = await MenuItem.findById(targetId);
  } else {
    target = await Vendor.findById(targetId);
  }

  if (!target) {
    return next(new ErrorHandler(`${targetType} not found`, 404));
  }

  try {
    // Create review with order reference
    const review = await Review.create({
      userId,
      targetType,
      targetId,
      orderId,
      rating: parseInt(rating),
      comment: comment.trim(),
      isVerifiedPurchase: true
    });

    // Populate user details
    await review.populate('userId', 'name profileImage');

    // Update target's average rating
    await updateTargetRating(targetType, targetId);

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: review
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ErrorHandler("You have already reviewed this item", 400));
    }
    throw error;
  }
});

// Get reviews for a specific target (MenuItem or Vendor)
export const getReviewsByTarget = catchAsyncError(async (req, res, next) => {
  const { targetType, targetId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!['MenuItem', 'Vendor'].includes(targetType)) {
    return next(new ErrorHandler("Invalid target type", 400));
  }

  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return next(new ErrorHandler("Invalid target ID", 400));
  }

  // Only show approved reviews to public
  const reviews = await Review.find({
    targetType,
    targetId,
    moderationStatus: { $in: ['approved', 'pending'] } // Show pending for now, can be changed to only approved
  })
    .populate('userId', 'name profileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalReviews = await Review.countDocuments({ targetType, targetId });

  // Calculate rating statistics
  const ratingStats = await Review.aggregate([
    { $match: { targetType, targetId: new mongoose.Types.ObjectId(targetId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: "$rating"
        }
      }
    }
  ]);

  const stats = ratingStats[0] || { averageRating: 0, totalReviews: 0, ratingDistribution: [] };

  res.status(200).json({
    success: true,
    data: {
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasNextPage: page < Math.ceil(totalReviews / limit),
        hasPrevPage: page > 1
      },
      stats: {
        averageRating: Math.round(stats.averageRating * 10) / 10,
        totalReviews: stats.totalReviews
      }
    }
  });
});

// Get user's reviews
export const getUserReviews = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const reviews = await Review.find({ userId })
    .populate('userId', 'name profileImage')
    .populate('targetId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalReviews = await Review.countDocuments({ userId });

  res.status(200).json({
    success: true,
    data: {
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasNextPage: page < Math.ceil(totalReviews / limit),
        hasPrevPage: page > 1
      }
    }
  });
});

// Update a review
export const updateReview = catchAsyncError(async (req, res, next) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return next(new ErrorHandler("Invalid review ID", 400));
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    return next(new ErrorHandler("Review not found", 404));
  }

  // Check if user owns the review
  if (review.userId.toString() !== userId.toString()) {
    return next(new ErrorHandler("You can only update your own reviews", 403));
  }

  // Update review
  if (rating) review.rating = parseInt(rating);
  if (comment) review.comment = comment.trim();

  await review.save();
  await review.populate('userId', 'name profileImage');

  // Update target's average rating
  await updateTargetRating(review.targetType, review.targetId);

  res.status(200).json({
    success: true,
    message: "Review updated successfully",
    data: review
  });
});

// Delete a review
export const deleteReview = catchAsyncError(async (req, res, next) => {
  const { reviewId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return next(new ErrorHandler("Invalid review ID", 400));
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    return next(new ErrorHandler("Review not found", 404));
  }

  // Check if user owns the review
  if (review.userId.toString() !== userId.toString()) {
    return next(new ErrorHandler("You can only delete your own reviews", 403));
  }

  const { targetType, targetId } = review;

  await Review.findByIdAndDelete(reviewId);

  // Update target's average rating
  await updateTargetRating(targetType, targetId);

  res.status(200).json({
    success: true,
    message: "Review deleted successfully"
  });
});

// Flag a review for moderation
export const flagReview = catchAsyncError(async (req, res, next) => {
  const { reviewId } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return next(new ErrorHandler("Invalid review ID", 400));
  }

  if (!reason || reason.trim().length < 5) {
    return next(new ErrorHandler("Please provide a reason for flagging (minimum 5 characters)", 400));
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    return next(new ErrorHandler("Review not found", 404));
  }

  // Check if user already flagged this review
  const alreadyFlagged = review.flaggedBy.some(flag => flag.userId.toString() === userId.toString());
  if (alreadyFlagged) {
    return next(new ErrorHandler("You have already flagged this review", 400));
  }

  // Add flag
  review.flaggedBy.push({
    userId,
    reason: reason.trim()
  });

  // If review gets multiple flags, mark for moderation
  if (review.flaggedBy.length >= 3 && review.moderationStatus === 'pending') {
    review.moderationStatus = 'flagged';
  }

  await review.save();

  res.status(200).json({
    success: true,
    message: "Review flagged successfully"
  });
});

// Moderate a review (admin only)
export const moderateReview = catchAsyncError(async (req, res, next) => {
  const { reviewId } = req.params;
  const { action, reason } = req.body; // action: 'approve', 'reject'
  const moderatorId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return next(new ErrorHandler("Invalid review ID", 400));
  }

  if (!['approve', 'reject'].includes(action)) {
    return next(new ErrorHandler("Invalid action. Use 'approve' or 'reject'", 400));
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    return next(new ErrorHandler("Review not found", 404));
  }

  review.isModerated = true;
  review.moderationStatus = action === 'approve' ? 'approved' : 'rejected';
  review.moderatedBy = moderatorId;
  review.moderatedAt = new Date();

  if (reason) {
    review.moderationReason = reason.trim();
  }

  await review.save();

  // Update target rating if approved
  if (action === 'approve') {
    await updateTargetRating(review.targetType, review.targetId);
  }

  res.status(200).json({
    success: true,
    message: `Review ${action}d successfully`,
    data: review
  });
});

// Check if user can review items from an order
export const getOrderReviewStatus = catchAsyncError(async (req, res, next) => {
  const { orderId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return next(new ErrorHandler("Invalid order ID", 400));
  }

  // Get the order with populated items
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
    orderStatus: 'delivered' // Only delivered orders can be reviewed
  }).populate('items.menuItemId', 'itemName image slug');

  if (!order) {
    return next(new ErrorHandler("Order not found or not delivered yet", 404));
  }

  // Get existing reviews for this order
  const existingReviews = await Review.find({
    userId,
    orderId,
    targetType: 'MenuItem'
  });

  // Create a map of reviewed items
  const reviewedItems = new Set(
    existingReviews.map(review => review.targetId.toString())
  );

  // Prepare response with review status for each item
  const itemsReviewStatus = order.items.map(item => ({
    menuItemId: item.menuItemId._id,
    itemName: item.menuItemId.itemName,
    image: item.menuItemId.image,
    slug: item.menuItemId.slug,
    quantity: item.quantity,
    selectedSubcategory: item.selectedSubcategory,
    canReview: !reviewedItems.has(item.menuItemId._id.toString()),
    hasReviewed: reviewedItems.has(item.menuItemId._id.toString()),
    existingReview: existingReviews.find(review =>
      review.targetId.toString() === item.menuItemId._id.toString()
    )
  }));

  res.status(200).json({
    success: true,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      items: itemsReviewStatus
    }
  });
});

// Get reviews pending moderation (admin only)
export const getPendingReviews = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const reviews = await Review.find({
    moderationStatus: { $in: ['pending', 'flagged'] }
  })
    .populate('userId', 'name profileImage')
    .populate('moderatedBy', 'name')
    .populate('flaggedBy.userId', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalReviews = await Review.countDocuments({
    moderationStatus: { $in: ['pending', 'flagged'] }
  });

  res.status(200).json({
    success: true,
    data: {
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasNextPage: page < Math.ceil(totalReviews / limit),
        hasPrevPage: page > 1
      }
    }
  });
});

// Helper function to update target's average rating
async function updateTargetRating(targetType, targetId) {
  // Only count approved reviews for rating calculation
  const stats = await Review.aggregate([
    {
      $match: {
        targetType,
        targetId: new mongoose.Types.ObjectId(targetId),
        moderationStatus: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  const { averageRating = 0, totalReviews = 0 } = stats[0] || {};

  if (targetType === 'MenuItem') {
    await MenuItem.findByIdAndUpdate(targetId, {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews
    });
  } else if (targetType === 'Vendor') {
    await Vendor.findByIdAndUpdate(targetId, {
      rating: Math.round(averageRating * 10) / 10,
      totalReviews
    });
  }
}
