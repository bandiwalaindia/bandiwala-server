import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import MenuItem from "../models/MenuItem.js";
import mongoose from "mongoose";

// Get all menu items
export const getAllMenuItems = catchAsyncError(async (req, res, next) => {
  try {
    // Add timeout for database operations
    const findMenuItemsWithTimeout = () => {
      return Promise.race([
        MenuItem.find({}), // Return ALL items including unavailable ones
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database operation timeout')), 8000)
        )
      ]);
    };

    const menuItems = await findMenuItemsWithTimeout();

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    console.error("Error in getAllMenuItems:", error);

    // Handle specific database connection errors
    if (error.name === 'MongooseError' || error.message.includes('buffering timed out') || error.message.includes('Database operation timeout')) {
      return next(new ErrorHandler("Database connection issue. Please try again later.", 503));
    }

    return next(new ErrorHandler("Failed to retrieve menu items", 500));
  }
});

// Get menu item by ID
export const getMenuItemById = catchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ErrorHandler("Invalid menu item ID", 400));
    }

    const menuItem = await MenuItem.findById(id);

    if (!menuItem) {
      return next(new ErrorHandler("Menu item not found", 404));
    }

    res.status(200).json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    console.error("Error in getMenuItemById:", error);
    return next(new ErrorHandler("Failed to retrieve menu item", 500));
  }
});

// Get menu item by slug
export const getMenuItemBySlug = catchAsyncError(async (req, res, next) => {
  try {
    const { slug } = req.params;

    const menuItem = await MenuItem.findOne({ slug, isAvailable: true });

    if (!menuItem) {
      return next(new ErrorHandler("Menu item not found", 404));
    }

    res.status(200).json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    console.error("Error in getMenuItemBySlug:", error);
    return next(new ErrorHandler("Failed to retrieve menu item", 500));
  }
});

// Get menu items by vendor ID
export const getMenuItemsByVendor = catchAsyncError(async (req, res, next) => {
  try {
    const { vendorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return next(new ErrorHandler("Invalid vendor ID", 400));
    }

    const menuItems = await MenuItem.find({
      vendorId // Return ALL items for this vendor including unavailable ones
    });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    console.error("Error in getMenuItemsByVendor:", error);
    return next(new ErrorHandler("Failed to retrieve menu items for vendor", 500));
  }
});

// Get menu items by category
export const getMenuItemsByCategory = catchAsyncError(async (req, res, next) => {
  try {
    const { category } = req.params;

    const menuItems = await MenuItem.find({
      itemCategory: category // Return ALL items in this category including unavailable ones
    });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    console.error("Error in getMenuItemsByCategory:", error);
    return next(new ErrorHandler("Failed to retrieve menu items by category", 500));
  }
});

// Search menu items
export const searchMenuItems = catchAsyncError(async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query) {
      return next(new ErrorHandler("Search query is required", 400));
    }

    const menuItems = await MenuItem.find({
      $text: { $search: query },
      isAvailable: true
    });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    console.error("Error in searchMenuItems:", error);
    return next(new ErrorHandler("Failed to search menu items", 500));
  }
});
