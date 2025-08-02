import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  targetType: {
    type: String,
    required: [true, 'Target type is required'],
    enum: ['MenuItem', 'Vendor'],
    index: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Target ID is required'],
    index: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    validate: {
      validator: function(v) {
        return Number.isInteger(v);
      },
      message: 'Rating must be a whole number'
    }
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    minLength: [10, 'Comment must be at least 10 characters long'],
    maxLength: [500, 'Comment cannot exceed 500 characters']
  },
  // Order reference for verified purchases
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required for verified purchase reviews']
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: true 
  },
  helpfulVotes: {
    type: Number,
    default: 0
  },
  // Moderation fields
  isModerated: {
    type: Boolean,
    default: false
  },
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  moderationReason: {
    type: String,
    trim: true
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: {
    type: Date
  },
  flaggedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      required: true
    },
    flaggedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
reviewSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ moderationStatus: 1, createdAt: -1 });
reviewSchema.index({ isModerated: 1, moderationStatus: 1 });

// Ensure one review per user per target
reviewSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

// Update the updatedAt field before saving
reviewSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Virtual for populating user details
reviewSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for populating target details
reviewSchema.virtual('target', {
  ref: function() {
    return this.targetType;
  },
  localField: 'targetId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtuals are included in JSON output
reviewSchema.set('toJSON', { virtuals: true });
reviewSchema.set('toObject', { virtuals: true });

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review;
