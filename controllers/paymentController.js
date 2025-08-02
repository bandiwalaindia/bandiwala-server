import Razorpay from 'razorpay';
import crypto from 'crypto';
import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import { applyPromoCode, recordPromoCodeUsage } from './promoCodeController.js';

// Lazy initialization of Razorpay instance
let razorpay = null;

const getRazorpayInstance = () => {
  if (!razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.');
    }

    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

// Create Razorpay order
export const createPaymentOrder = catchAsyncError(async (req, res, next) => {
  try {
    const user = req.user;
    const { amount, currency = 'INR', promoCode } = req.body;

    console.log('Creating Razorpay order for user:', user._id);
    console.log('Amount:', amount, 'Currency:', currency, 'PromoCode:', promoCode);

    // Validate amount
    if (!amount || amount <= 0) {
      return next(new ErrorHandler("Valid amount is required", 400));
    }

    // Get user's cart to validate amount
    if (!user.cart || !user.cart.items || user.cart.items.length === 0) {
      return next(new ErrorHandler("Cart is empty", 400));
    }

    // Calculate cart subtotal
    const cartSubtotal = user.cart.items.reduce((total, item) => {
      return total + (item.selectedSubcategory.price * item.quantity);
    }, 0);

    // Add platform fee and initial delivery charge
    const platformFee = 5;
    let deliveryCharge = 20;
    let discount = 0;

    // Apply promo code if provided to get accurate totals
    if (promoCode) {
      try {
        const promoResult = await applyPromoCode(user._id, promoCode, cartSubtotal, deliveryCharge);
        deliveryCharge = promoResult.deliveryCharge;
        discount = promoResult.discountAmount;
        console.log('Promo code applied in payment order creation:', { promoCode, discount, deliveryCharge });
      } catch (error) {
        console.error('Promo code application failed in payment order creation:', error.message);
        // Continue without promo code if validation fails
      }
    }

    // Calculate tax on adjusted amounts (matching frontend calculation)
    const taxableAmount = cartSubtotal + platformFee + deliveryCharge;
    const tax = parseFloat((taxableAmount * 0.05).toFixed(2));
    const finalTotal = cartSubtotal + platformFee + deliveryCharge + tax - discount;

    console.log('Payment validation totals:', {
      cartSubtotal,
      platformFee,
      deliveryCharge,
      tax,
      discount,
      finalTotal,
      requestedAmount: amount
    });

    // Validate that the amount matches cart total (allow small rounding differences)
    if (Math.abs(amount - finalTotal) > 1) {
      console.error('Amount mismatch:', {
        requestedAmount: amount,
        calculatedTotal: finalTotal,
        difference: Math.abs(amount - finalTotal)
      });
      return next(new ErrorHandler(`Amount mismatch with cart total. Expected: ₹${finalTotal.toFixed(2)}, Received: ₹${amount.toFixed(2)}`, 400));
    }

    // Create Razorpay order
    // Generate a shorter receipt (max 40 chars) by using last 8 chars of user ID + timestamp
    const shortUserId = user._id.toString().slice(-8);
    const shortTimestamp = Date.now().toString().slice(-8);
    const receipt = `ord_${shortUserId}_${shortTimestamp}`;

    console.log('Generated receipt:', receipt, 'Length:', receipt.length);

    const options = {
      amount: Math.round(amount * 100), // Amount in paise
      currency: currency,
      receipt: receipt,
      notes: {
        userId: user._id.toString(),
        userEmail: user.email,
        userPhone: user.phone,
        cartItems: user.cart.items.length
      }
    };

    const razorpayInstance = getRazorpayInstance();
    const order = await razorpayInstance.orders.create(options);

    console.log('Razorpay order created:', order.id);

    res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      orderId: order.id, // Add this for compatibility with frontend
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);

    // Log more detailed error information for debugging
    if (error.statusCode && error.error) {
      console.error("Razorpay API Error:", {
        statusCode: error.statusCode,
        code: error.error.code,
        description: error.error.description,
        reason: error.error.reason
      });
    }

    return next(new ErrorHandler("Failed to create payment order", 500));
  }
});

// Verify Razorpay payment and create order
export const verifyPayment = catchAsyncError(async (req, res, next) => {
  try {
    const user = req.user;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      deliveryAddress,
      promoCode
    } = req.body;

    console.log('=== PAYMENT VERIFICATION START ===');
    console.log('Verifying payment for user:', user._id);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Payment details:', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature: razorpay_signature ? 'present' : 'missing',
      deliveryAddress: deliveryAddress ? 'present' : 'missing',
      promoCode
    });

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return next(new ErrorHandler("Payment verification details are required", 400));
    }

    if (!deliveryAddress) {
      return next(new ErrorHandler("Delivery address is required", 400));
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error('Payment signature verification failed');
      return next(new ErrorHandler("Payment verification failed", 400));
    }

    console.log('Payment signature verified successfully');

    // Get payment details from Razorpay
    const razorpayInstance = getRazorpayInstance();
    const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);

    if (payment.status !== 'captured') {
      return next(new ErrorHandler("Payment not captured", 400));
    }

    // Import Order model and create order automatically
    let Order, orderStatusService, socketService;
    try {
      const orderModule = await import('../models/Order.js');
      Order = orderModule.default;
      console.log('Order model imported successfully');

      const statusModule = await import('../services/orderStatusService.js');
      orderStatusService = statusModule.default;
      console.log('Order status service imported successfully');

      const socketModule = await import('../services/socketService.js');
      socketService = socketModule.default;
      console.log('Socket service imported successfully');
    } catch (importError) {
      console.error('Error importing modules:', importError);
      throw new Error('Failed to import required modules');
    }

    // Validate delivery address coordinates
    if (!deliveryAddress.coordinates || !deliveryAddress.coordinates.lat || !deliveryAddress.coordinates.lng) {
      return next(new ErrorHandler("Delivery address must include valid coordinates", 400));
    }

    // Check if user has items in cart
    if (!user.cart || !user.cart.items || user.cart.items.length === 0) {
      return next(new ErrorHandler("Cart is empty", 400));
    }

    // Calculate estimated delivery time (30-45 minutes)
    const estimatedDeliveryTime = `${30 + Math.floor(Math.random() * 16)}-${45 + Math.floor(Math.random() * 16)} min`;

    // Calculate subtotal first for promo code validation
    const subtotal = user.cart.items.reduce((total, item) => {
      return total + (item.selectedSubcategory.price * item.quantity);
    }, 0);

    // Apply promo code if provided
    let deliveryCharge = 20; // Default delivery charge
    let discount = 0;
    let promoType = null;

    if (promoCode) {
      try {
        const promoResult = await applyPromoCode(user._id, promoCode, subtotal, deliveryCharge);
        deliveryCharge = promoResult.deliveryCharge;
        discount = promoResult.discountAmount;
        promoType = promoResult.promoType;
        console.log('Promo code applied in payment verification:', { promoCode, discount, deliveryCharge, promoType });
      } catch (error) {
        console.error('Promo code application failed in payment verification:', error.message);
        return next(new ErrorHandler(error.message, 400));
      }
    }

    // Create a new order with the cart items
    const newOrder = new Order({
      user: user._id,
      items: user.cart.items,
      deliveryAddress,
      paymentMethod: 'card', // Set to card for all Razorpay payments
      promoCode,
      paymentStatus: 'paid', // Payment is already processed via Razorpay
      orderStatus: 'pending_vendor_response', // Start with pending vendor response
      isPendingVendorResponse: true, // Set pending flag
      vendorResponseDeadline: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes for vendor response
      subtotal: 0, // Will be calculated
      total: 0, // Will be calculated
      platformFee: 5, // Fixed platform fee to match frontend
      deliveryCharge: deliveryCharge, // Use calculated delivery charge (may be 0 for free delivery)
      tax: 0, // Will be calculated as 5% of subtotal
      discount: discount, // Use calculated discount
      estimatedDeliveryTime: estimatedDeliveryTime,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id
    });

    console.log('Order before calculating totals:', {
      user: newOrder.user,
      itemsCount: newOrder.items.length,
      orderNumber: newOrder.orderNumber
    });

    // Calculate totals
    newOrder.calculateTotals();

    console.log('Order after calculating totals:', {
      subtotal: newOrder.subtotal,
      total: newOrder.total,
      orderNumber: newOrder.orderNumber
    });

    // Save the order
    console.log('Saving order...');
    await newOrder.save();
    console.log('Order saved successfully with order number:', newOrder.orderNumber);

    // Record promo code usage if promo code was applied
    if (promoCode && (discount > 0 || promoType === 'free_delivery')) {
      try {
        // For free delivery, record the delivery charge amount as the benefit
        const usageAmount = promoType === 'free_delivery' ? 20 : discount;
        await recordPromoCodeUsage(user._id, promoCode, newOrder._id, usageAmount);
      } catch (error) {
        console.error('Failed to record promo code usage in payment verification:', error.message);
        // Don't fail the order creation if usage recording fails
      }
    }

    // Clear the user's cart after successful order
    user.cart.items = [];
    await user.save();

    // Schedule automatic status progression
    try {
      orderStatusService.onOrderCreated(newOrder);
    } catch (statusError) {
      console.warn('Failed to schedule order status progression:', statusError);
    }

    // Send real-time notification to vendors
    try {
      await socketService.notifyVendorNewOrder(newOrder);
    } catch (notificationError) {
      console.warn('Failed to send vendor notification:', notificationError);
    }

    res.status(200).json({
      success: true,
      message: "Payment verified and order created successfully",
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: payment.amount / 100, // Convert from paise to rupees
        status: payment.status,
        method: payment.method,
        verified: true,
        order: newOrder,
        orderNumber: newOrder.orderNumber
      }
    });
  } catch (error) {
    console.error("Error verifying payment:", error);

    // If payment was verified but order creation failed, we need to handle this carefully
    if (error.message && error.message.includes('Order')) {
      // Payment was successful but order creation failed
      return res.status(200).json({
        success: false,
        message: "Payment successful but order creation failed. Our team will contact you shortly.",
        data: {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          verified: true,
          orderCreated: false
        }
      });
    }

    return next(new ErrorHandler("Payment verification failed", 500));
  }
});

// Get payment status
export const getPaymentStatus = catchAsyncError(async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return next(new ErrorHandler("Payment ID is required", 400));
    }

    const razorpayInstance = getRazorpayInstance();
    const payment = await razorpayInstance.payments.fetch(paymentId);

    res.status(200).json({
      success: true,
      data: {
        paymentId: payment.id,
        orderId: payment.order_id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        createdAt: new Date(payment.created_at * 1000),
        description: payment.description
      }
    });
  } catch (error) {
    console.error("Error fetching payment status:", error);
    return next(new ErrorHandler("Failed to fetch payment status", 500));
  }
});
