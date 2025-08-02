import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Promo code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  type: {
    type: String,
    required: [true, 'Promo code type is required'],
    enum: ['percentage', 'fixed', 'free_delivery']
  },
  value: {
    type: Number,
    required: [true, 'Promo code value is required'],
    min: 0
  },
  maxDiscount: {
    type: Number,
    default: 0 // 0 means no maximum
  },
  minOrderValue: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
  },
  maxUsagePerUser: {
    type: Number,
    default: 1 
  },
  isFirstTimeUserOnly: {
    type: Boolean,
    default: false 
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PromoCode = mongoose.models.PromoCode || mongoose.model('PromoCode', promoCodeSchema);

export default PromoCode;
