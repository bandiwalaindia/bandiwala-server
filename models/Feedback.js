import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  // User who submitted the feedback (can be vendor, user, or delivery partner)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  
  // Type of feedback
  type: {
    type: String,
    enum: ['feedback', 'complaint', 'suggestion', 'bug_report'],
    required: [true, 'Feedback type is required']
  },
  
  // Category for better organization
  category: {
    type: String,
    enum: [
      'app_functionality',
      'order_issues',
      'payment_issues',
      'delivery_issues',
      'vendor_issues',
      'technical_issues',
      'feature_request',
      'general',
      'other'
    ],
    default: 'general'
  },
  
  // Subject/title of the feedback
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxLength: [200, 'Subject cannot exceed 200 characters']
  },
  
  // Main message content
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxLength: [2000, 'Message cannot exceed 2000 characters']
  },
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Status of the feedback
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'closed', 'rejected'],
    default: 'pending'
  },
  
  // Admin response
  adminResponse: {
    message: {
      type: String,
      trim: true,
      maxLength: [2000, 'Admin response cannot exceed 2000 characters']
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: {
      type: Date
    }
  },
  
  // Additional metadata
  metadata: {
    // User's role when submitting feedback
    userRole: {
      type: String,
      enum: ['user', 'vendor', 'deliveryPartner', 'admin'],
      required: true
    },
    
    // Device/platform information
    platform: {
      type: String,
      enum: ['android', 'ios', 'web'],
      default: 'android'
    },
    
    // App version when feedback was submitted
    appVersion: {
      type: String,
      default: '1.0.0'
    },
    
    // Related order ID if feedback is order-related
    relatedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    
    // Related vendor ID if feedback is vendor-related
    relatedVendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    }
  },
  
  // Attachments (for future use)
  attachments: [{
    filename: String,
    url: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Rating if applicable (1-5 stars)
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Internal notes for admin use
  internalNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  }
});

// Update the updatedAt field before saving
feedbackSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes for efficient querying
feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ type: 1, status: 1 });
feedbackSchema.index({ category: 1, priority: 1 });
feedbackSchema.index({ 'metadata.userRole': 1 });
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ isDeleted: 1 });

// Virtual for user details
feedbackSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for related order details
feedbackSchema.virtual('relatedOrder', {
  ref: 'Order',
  localField: 'metadata.relatedOrderId',
  foreignField: '_id',
  justOne: true
});

// Virtual for related vendor details
feedbackSchema.virtual('relatedVendor', {
  ref: 'Vendor',
  localField: 'metadata.relatedVendorId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
feedbackSchema.set('toJSON', { virtuals: true });
feedbackSchema.set('toObject', { virtuals: true });

const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);

export default Feedback;
