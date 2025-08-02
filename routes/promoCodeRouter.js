import express from "express";
import {
  validatePromoCode,
  getUserPromoUsage
} from "../controllers/promoCodeController.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// All promo code routes require authentication
router.use(isAuthenticated);

// Validate promo code
router.post("/validate", validatePromoCode);

// Get user's promo code usage history
router.get("/usage", getUserPromoUsage);

export default router;
