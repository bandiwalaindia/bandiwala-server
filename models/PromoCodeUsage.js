import mongoose from 'mongoose';

const promoCodeUsageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  promoCode: {
    type: String,
    required: true,
    uppercase: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  discountAmount: {
    type: Number,
    required: true,
    min: 0
  },
  usedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure unique usage per user per order
promoCodeUsageSchema.index({ user: 1, promoCode: 1, order: 1 }, { unique: true });

// Index for efficient queries
promoCodeUsageSchema.index({ user: 1, promoCode: 1 });
promoCodeUsageSchema.index({ promoCode: 1 });

const PromoCodeUsage = mongoose.models.PromoCodeUsage || mongoose.model('PromoCodeUsage', promoCodeUsageSchema);

export default PromoCodeUsage;
