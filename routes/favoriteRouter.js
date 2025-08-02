import express from "express";
import {
  getUserFavorites,
  getFavoriteVendors,
  getFavoriteMenuItems,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  checkFavoriteStatus,
  getFavoritesCount,
  clearAllFavorites,
  getFavoriteById,
  bulkAddFavorites
} from "../controllers/favoriteController.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// All favorite routes require authentication
router.use(isAuthenticated);

// Get all favorites for the authenticated user
// GET /api/favorites/user
router.get("/user", getUserFavorites);

// Get favorite vendors for the authenticated user
// GET /api/favorites/vendors
router.get("/vendors", getFavoriteVendors);

// Get favorite menu items for the authenticated user
// GET /api/favorites/menu-items
router.get("/menu-items", getFavoriteMenuItems);

// Get favorites count for the authenticated user
// GET /api/favorites/user/count
router.get("/user/count", getFavoritesCount);

// Check if specific item is favorited
// GET /api/favorites/check/:itemType/:itemId
router.get("/check/:itemType/:itemId", checkFavoriteStatus);

// Get specific favorite by ID
// GET /api/favorites/:id
router.get("/:id", getFavoriteById);

// Add item to favorites
// POST /api/favorites
router.post("/", addToFavorites);

// Toggle favorite status (add if not exists, remove if exists)
// POST /api/favorites/toggle
router.post("/toggle", toggleFavorite);

// Bulk add favorites (for import functionality)
// POST /api/favorites/bulk
router.post("/bulk", bulkAddFavorites);

// Remove item from favorites
// DELETE /api/favorites/:itemType/:itemId
router.delete("/:itemType/:itemId", removeFromFavorites);

// Clear all favorites for the authenticated user
// DELETE /api/favorites/user
router.delete("/user", clearAllFavorites);

export default router;
