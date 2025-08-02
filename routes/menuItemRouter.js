import express from "express";
import {
  getAllMenuItems,
  getMenuItemById,
  getMenuItemBySlug,
  getMenuItemsByVendor,
  getMenuItemsByCategory,
  searchMenuItems
} from "../controllers/menuItemController.js";

const router = express.Router();

// Get all menu items
router.get("/", getAllMenuItems);

// Search menu items
router.get("/search", searchMenuItems);

// Get menu items by category
router.get("/category/:category", getMenuItemsByCategory);

// Get menu items by vendor
router.get("/vendor/:vendorId", getMenuItemsByVendor);

// Get menu item by slug
router.get("/slug/:slug", getMenuItemBySlug);

// Get menu item by ID
router.get("/:id", getMenuItemById);

export default router;
