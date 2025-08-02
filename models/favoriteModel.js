import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true // Index for faster queries
  },
  itemId: {
    type: String,
    required: true,
    index: true // Index for faster queries
  },
  itemType: {
    type: String,
    required: true,
    enum: ['vendor', 'menuItem'],
    index: true // Index for faster queries
  },
  itemName: {
    type: String,
    required: true
  },
  vendorId: {
    type: String,
    required: function() {
      return this.itemType === 'menuItem';
    }
  },
  vendorName: {
    type: String,
    required: function() {
      return this.itemType === 'menuItem';
    }
  },
  price: {
    type: Number,
    required: function() {
      return this.itemType === 'menuItem';
    },
    min: 0
  },
  imageUrl: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: null
  },
  // Additional metadata for better user experience
  metadata: {
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: null
    },
    category: {
      type: String,
      default: null
    },
    tags: [{
      type: String
    }],
    isAvailable: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure a user can't favorite the same item twice
favoriteSchema.index({ userId: 1, itemId: 1, itemType: 1 }, { unique: true });

// Index for efficient queries by user and type
favoriteSchema.index({ userId: 1, itemType: 1 });

// Index for efficient queries by creation date
favoriteSchema.index({ createdAt: -1 });

// Virtual for formatted creation date
favoriteSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Virtual for time since added
favoriteSchema.virtual('timeSinceAdded').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  return `${Math.ceil(diffDays / 30)} months ago`;
});

// Static method to get user's favorites count
favoriteSchema.statics.getUserFavoritesCount = async function(userId) {
  const counts = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$itemType',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    vendor: 0,
    menuItem: 0,
    total: 0
  };

  counts.forEach(item => {
    result[item._id] = item.count;
    result.total += item.count;
  });

  return result;
};

// Static method to check if item is favorited by user
favoriteSchema.statics.isFavorited = async function(userId, itemId, itemType) {
  const favorite = await this.findOne({ userId, itemId, itemType });
  return !!favorite;
};

// Static method to get user's favorites by type
favoriteSchema.statics.getUserFavoritesByType = async function(userId, itemType, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = -1,
    search = null
  } = options;

  const query = { userId: new mongoose.Types.ObjectId(userId) };
  
  if (itemType && itemType !== 'all') {
    query.itemType = itemType;
  }

  if (search) {
    query.$or = [
      { itemName: { $regex: search, $options: 'i' } },
      { vendorName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder };

  const [favorites, total] = await Promise.all([
    this.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);

  return {
    favorites,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

// Instance method to toggle favorite status
favoriteSchema.methods.toggleStatus = async function() {
  // This method is called on an existing favorite to remove it
  await this.deleteOne();
  return false; // Indicates item was removed from favorites
};

// Pre-save middleware to validate data
favoriteSchema.pre('save', function(next) {
  // Ensure vendorId and vendorName are provided for menu items
  if (this.itemType === 'menuItem') {
    if (!this.vendorId || !this.vendorName) {
      return next(new Error('vendorId and vendorName are required for menu items'));
    }
  }

  // Ensure price is provided for menu items
  if (this.itemType === 'menuItem' && (this.price === undefined || this.price === null)) {
    return next(new Error('price is required for menu items'));
  }

  next();
});

// Pre-remove middleware for cleanup
favoriteSchema.pre('deleteOne', { document: true }, function(next) {
  console.log(`Removing favorite: ${this.itemName} (${this.itemType}) for user ${this.userId}`);
  next();
});

// Post-save middleware for logging
favoriteSchema.post('save', function(doc) {
  console.log(`✅ Favorite added: ${doc.itemName} (${doc.itemType}) for user ${doc.userId}`);
});

export const Favorite = mongoose.model("Favorite", favoriteSchema);
