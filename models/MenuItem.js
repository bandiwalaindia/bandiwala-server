import mongoose from 'mongoose';

const subcategorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Subcategory title is required'],
    trim: true
  },
  quantity: {
    type: String,
    required: [true, 'Quantity is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  }
}, { _id: false });

const menuItemSchema = new mongoose.Schema({
  itemCategory: {
    type: String,
    required: [true, 'Item category is required'],
    trim: true
  },
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Menu item slug is required'],
    trim: true,
    lowercase: true
  },
  subcategories: {
    type: [subcategorySchema],
    required: [true, 'At least one subcategory is required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one subcategory is required'
    }
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  image: {
    type: String,
    default: '/images/default-food.jpg'
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, 'Vendor ID is required']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound unique index on slug + vendorId
menuItemSchema.index({ slug: 1, vendorId: 1 }, { unique: true });

// Create a text index for search functionality
menuItemSchema.index({ itemName: 'text', description: 'text', itemCategory: 'text' });

// Clear any existing model to avoid conflicts
if (mongoose.models.MenuItem) {
  delete mongoose.models.MenuItem;
}

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;