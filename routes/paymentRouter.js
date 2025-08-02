import express from "express";
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus
} from "../controllers/paymentController.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// All payment routes require authentication
router.use(isAuthenticated);

// Create Razorpay payment order
router.post("/create-order", createPaymentOrder);

// Verify Razorpay payment
router.post("/verify", verifyPayment);

// Get payment status
router.get("/status/:paymentId", getPaymentStatus);

export default router;
