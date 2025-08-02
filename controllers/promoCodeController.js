import PromoCode from '../models/PromoCode.js';
import PromoCodeUsage from '../models/PromoCodeUsage.js';
import Order from '../models/Order.js';
import { catchAsyncError } from '../middleware/catchAsyncError.js';
import ErrorHandler from '../middleware/error.js';

// Validate promo code
export const validatePromoCode = catchAsyncError(async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    const user = req.user;

    console.log('Validating promo code:', { code, subtotal, userId: user._id });

    if (!code || !subtotal) {
      return next(new ErrorHandler("Promo code and subtotal are required", 400));
    }

    // Find the promo code
    const promoCode = await PromoCode.findOne({ 
      code: code.toUpperCase(),
      isActive: true 
    });

    if (!promoCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid promo code"
      });
    }

    // Check if promo code is still valid (date range)
    const now = new Date();
    if (now < promoCode.validFrom || now > promoCode.validUntil) {
      return res.status(400).json({
        success: false,
        message: "Promo code has expired"
      });
    }

    const usageCount = await PromoCodeUsage.countDocuments({
      user: user._id,
      promoCode: code.toUpperCase()
    });

    console.log('User usage count for promo code:', usageCount);

    if (usageCount >= promoCode.maxUsagePerUser) {
      return res.status(400).json({
        success: false,
        message: `You have already used this promo code ${promoCode.maxUsagePerUser} time(s)`
      });
    }

    if (promoCode.isFirstTimeUserOnly) {
      const userOrderCount = await Order.countDocuments({
        user: user._id,
        orderStatus: { $ne: 'cancelled' }
      });

      if (userOrderCount > 0) {
        return res.status(400).json({
          success: false,
          message: "This promo code is only valid for first-time users"
        });
      }
    }

    let discountAmount = 0;
    
    if (promoCode.type === 'percentage') {
      discountAmount = (subtotal * promoCode.value) / 100;
      if (promoCode.maxDiscount > 0) {
        discountAmount = Math.min(discountAmount, promoCode.maxDiscount);
      }
    } else if (promoCode.type === 'fixed') {
      discountAmount = promoCode.value;
    } else if (promoCode.type === 'free_delivery') {
      discountAmount = 0;
    }

    const remainingUses = promoCode.maxUsagePerUser - usageCount;

    res.status(200).json({
      success: true,
      message: "Promo code is valid",
      data: {
        code: promoCode.code,
        type: promoCode.type,
        discountAmount: Math.round(discountAmount * 100) / 100, 
        isFreeDelivery: promoCode.type === 'free_delivery',
        remainingUses: remainingUses,
        maxUsagePerUser: promoCode.maxUsagePerUser
      }
    });

  } catch (error) {
    console.error("Error in validatePromoCode:", error);
    return next(new ErrorHandler("Failed to validate promo code", 500));
  }
});

export const applyPromoCode = async (userId, promoCode, subtotal, deliveryCharge = 0) => {
  try {
    console.log('Applying promo code:', { userId, promoCode, subtotal, deliveryCharge });

    if (!promoCode) {
      return { success: true, discountAmount: 0, deliveryCharge };
    }

    // Find the promo code
    const promo = await PromoCode.findOne({ 
      code: promoCode.toUpperCase(),
      isActive: true 
    });

    if (!promo) {
      throw new Error("Invalid promo code");
    }

    // Check if promo code is still valid
    const now = new Date();
    if (now < promo.validFrom || now > promo.validUntil) {
      throw new Error("Promo code has expired");
    }

    const usageCount = await PromoCodeUsage.countDocuments({
      user: userId,
      promoCode: promoCode.toUpperCase()
    });

    if (usageCount >= promo.maxUsagePerUser) {
      throw new Error(`Promo code usage limit exceeded`);
    }

    // Check if it's for first-time users only
    if (promo.isFirstTimeUserOnly) {
      const userOrderCount = await Order.countDocuments({
        user: userId,
        orderStatus: { $ne: 'cancelled' }
      });

      if (userOrderCount > 0) {
        throw new Error("This promo code is only valid for first-time users");
      }
    }

    // Calculate discount
    let discountAmount = 0;
    let newDeliveryCharge = deliveryCharge;
    
    if (promo.type === 'percentage') {
      discountAmount = (subtotal * promo.value) / 100;
      if (promo.maxDiscount > 0) {
        discountAmount = Math.min(discountAmount, promo.maxDiscount);
      }
    } else if (promo.type === 'fixed') {
      discountAmount = promo.value;
    } else if (promo.type === 'free_delivery') {
      // Set delivery charge to 0 for free delivery
      newDeliveryCharge = 0;
      discountAmount = 0; // Don't show as discount, just make delivery free
    }

    return {
      success: true,
      discountAmount: Math.round(discountAmount * 100) / 100,
      deliveryCharge: newDeliveryCharge,
      promoType: promo.type
    };

  } catch (error) {
    console.error("Error in applyPromoCode:", error);
    throw error;
  }
};

// Record promo code usage (called after successful order creation)
export const recordPromoCodeUsage = async (userId, promoCode, orderId, discountAmount) => {
  try {
    if (!promoCode) return;

    const usage = new PromoCodeUsage({
      user: userId,
      promoCode: promoCode.toUpperCase(),
      order: orderId,
      discountAmount: discountAmount || 0 // Ensure we always have a valid number
    });

    await usage.save();
    console.log('Promo code usage recorded:', { userId, promoCode, orderId, discountAmount: discountAmount || 0 });

  } catch (error) {
    console.error("Error recording promo code usage:", error);
  }
};

export const getUserPromoUsage = catchAsyncError(async (req, res, next) => {
  try {
    const user = req.user;
    const { promoCode } = req.query;

    let query = { user: user._id };
    if (promoCode) {
      query.promoCode = promoCode.toUpperCase();
    }

    const usageHistory = await PromoCodeUsage.find(query)
      .populate('order', 'orderNumber total createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: usageHistory
    });

  } catch (error) {
    console.error("Error in getUserPromoUsage:", error);
    return next(new ErrorHandler("Failed to get promo usage history", 500));
  }
});
