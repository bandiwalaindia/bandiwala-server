import mongoose from 'mongoose';

const appSettingsSchema = new mongoose.Schema({
  // Maintenance settings
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    default: 'We are currently under maintenance. Please try again later.'
  },
  
  // Financial settings
  platformFeePercentage: {
    type: Number,
    default: 5,
    min: 0,
    max: 100
  },
  deliveryChargeBase: {
    type: Number,
    default: 30,
    min: 0
  },
  taxPercentage: {
    type: Number,
    default: 5,
    min: 0,
    max: 100
  },
  
  // Order settings
  minOrderValue: {
    type: Number,
    default: 100,
    min: 0
  },
  maxDeliveryRadius: {
    type: Number,
    default: 10,
    min: 1
  },
  orderTimeout: {
    type: Number,
    default: 10, // minutes
    min: 1
  },
  
  // Contact settings
  supportEmail: {
    type: String,
    default: 'support@bandiwala.com'
  },
  supportPhone: {
    type: String,
    default: '+91-9876543210'
  },
  
  // App settings
  appVersion: {
    type: String,
    default: '1.0.0'
  },
  forceUpdate: {
    type: Boolean,
    default: false
  },
  
  // Notification settings
  enablePushNotifications: {
    type: Boolean,
    default: true
  },
  enableEmailNotifications: {
    type: Boolean,
    default: true
  },
  enableSMSNotifications: {
    type: Boolean,
    default: true
  },
  
  // Feature flags
  enableReviews: {
    type: Boolean,
    default: true
  },
  enableFavorites: {
    type: Boolean,
    default: true
  },
  enablePromoCode: {
    type: Boolean,
    default: true
  },
  enableDeliveryTracking: {
    type: Boolean,
    default: true
  },
  
  // Business hours
  businessHours: {
    monday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    tuesday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    wednesday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    thursday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    friday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    saturday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    sunday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    }
  },
  
  // Terms and policies
  termsAndConditions: {
    type: String,
    default: ''
  },
  privacyPolicy: {
    type: String,
    default: ''
  },
  refundPolicy: {
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

// Update the updatedAt field before saving
appSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const AppSettings = mongoose.models.AppSettings || mongoose.model('AppSettings', appSettingsSchema);

export default AppSettings;
