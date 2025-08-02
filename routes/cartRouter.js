import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  reorderCartItems
} from "../controllers/cartController.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// All cart routes require authentication
router.use(isAuthenticated);

// Get cart
router.get("/", getCart);

// Add item to cart
router.post("/", addToCart);

// Update cart item
router.put("/", updateCartItem);

// Remove item from cart (can include plate as query param: ?plate=full)
router.delete("/:menuItemId", removeFromCart);

// Clear cart
router.delete("/", clearCart);

// Reorder cart items
router.put("/reorder", reorderCartItems);

export default router;
