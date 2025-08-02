import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Vendor description is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Vendor slug is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for backward compatibility
  },
  rating: {
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
  location: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  coordinates: {
    lat: {
      type: Number,
      default: 17.49328 // Default to service area center
    },
    lng: {
      type: Number,
      default: 78.39433 // Default to service area center
    }
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  image: {
    type: String,
    default: '/images/default-vendor.jpg'
  },
  deliveryTime: {
    type: String,
    default: '30-45 min'
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  minOrderValue: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a text index for search functionality
vendorSchema.index({ name: 'text', description: 'text' });

const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);

export default Vendor;
