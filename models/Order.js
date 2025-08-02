import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'MenuItem'
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  selectedSubcategory: {
    title: {
      type: String,
      required: true
    },
    quantity: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  },
  notes: {
    type: String,
    default: ''
  },
  image: String,
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  vendorName: String,
  vendorPhone: String,
  vendorAddress: String,
  vendorLocation: {
    coordinates: {
      lat: {
        type: Number
      },
      lng: {
        type: Number
      }
    },
    formatted: String
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    default: function() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `BW-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  items: [orderItemSchema],
  deliveryAddress: {
    formatted: {
      type: String,
      required: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    },
    mapUrl: {
      type: String
    }
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'card', 'upi']
  },
  paymentStatus: {
    type: String,
    default: 'pending',
    enum: ['pending', 'paid', 'failed']
  },
  orderStatus: {
    type: String,
    default: 'placed',
    enum: ['placed', 'pending_vendor_response', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']
  },
  statusTimeline: [{
    status: {
      type: String,
      enum: ['placed', 'pending_vendor_response', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
      required: true
    },
    timestamp: {
      type: Date,
      required: true
    }
  }],
  vendorResponseDeadline: {
    type: Date
  },
  isPendingVendorResponse: {
    type: Boolean,
    default: false
  },
  subtotal: {
    type: Number,
    required: true
  },
  platformFee: {
    type: Number,
    default: 0
  },
  deliveryCharge: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  promoCode: {
    type: String
  },
  estimatedDeliveryTime: {
    type: String,
    default: '30-45 min'
  },
  // Real-time user location for delivery tracking
  userCurrentLocation: {
    coordinates: {
      lat: {
        type: Number
      },
      lng: {
        type: Number
      }
    },
    accuracy: {
      type: Number
    },
    timestamp: {
      type: Date
    }
  },
  adminNotes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save and initialize timeline
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  // Initialize statusTimeline with appropriate initial status if it's a new order
  if (this.isNew && this.statusTimeline.length === 0) {
    // Add 'placed' status first
    this.statusTimeline.push({
      status: 'placed',
      timestamp: new Date()
    });

    // If order is pending vendor response, add that status too
    if (this.isPendingVendorResponse && this.orderStatus === 'pending_vendor_response') {
      this.statusTimeline.push({
        status: 'pending_vendor_response',
        timestamp: new Date()
      });
    }
  }

  next();
});

// Create a method to calculate order totals
orderSchema.methods.calculateTotals = function() {
  // Calculate subtotal
  this.subtotal = this.items.reduce((total, item) => {
    return total + (item.selectedSubcategory.price * item.quantity);
  }, 0);

  // Calculate 5% tax on subtotal + platform fee + delivery charge
  const taxableAmount = this.subtotal + this.platformFee + this.deliveryCharge;
  this.tax = parseFloat((taxableAmount * 0.05).toFixed(2)); // 5% tax with 2 decimal places

  // Calculate total
  this.total = this.subtotal + this.platformFee + this.deliveryCharge + this.tax - this.discount;

  return {
    subtotal: this.subtotal,
    tax: this.tax,
    total: this.total
  };
};

// Method to update order status with timeline tracking
orderSchema.methods.updateStatus = function(newStatus) {
  // Update the current status
  this.orderStatus = newStatus;
  this.updatedAt = new Date();

  // Add to timeline if not already present
  const existingEntry = this.statusTimeline.find(entry => entry.status === newStatus);
  if (!existingEntry) {
    this.statusTimeline.push({
      status: newStatus,
      timestamp: new Date()
    });
  }

  return this;
};

export default mongoose.models.Order || mongoose.model('Order', orderSchema);
