import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { Favorite } from "../models/favoriteModel.js";
import ErrorHandler from "../middleware/error.js";
import mongoose from "mongoose";

// Get all favorites for the authenticated user
export const getUserFavorites = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const { 
    page = 1, 
    limit = 20, 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    search 
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy,
    sortOrder: sortOrder === 'desc' ? -1 : 1,
    search
  };

  const result = await Favorite.getUserFavoritesByType(userId, 'all', options);

  res.status(200).json({
    success: true,
    message: "Favorites retrieved successfully",
    data: result.favorites,
    pagination: result.pagination
  });
});

// Get favorite vendors for the authenticated user
export const getFavoriteVendors = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const { 
    page = 1, 
    limit = 20, 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    search 
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy,
    sortOrder: sortOrder === 'desc' ? -1 : 1,
    search
  };

  const result = await Favorite.getUserFavoritesByType(userId, 'vendor', options);

  res.status(200).json({
    success: true,
    message: "Favorite vendors retrieved successfully",
    data: result.favorites,
    pagination: result.pagination
  });
});

// Get favorite menu items for the authenticated user
export const getFavoriteMenuItems = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const { 
    page = 1, 
    limit = 20, 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    search 
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy,
    sortOrder: sortOrder === 'desc' ? -1 : 1,
    search
  };

  const result = await Favorite.getUserFavoritesByType(userId, 'menuItem', options);

  res.status(200).json({
    success: true,
    message: "Favorite menu items retrieved successfully",
    data: result.favorites,
    pagination: result.pagination
  });
});

// Add item to favorites
export const addToFavorites = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const {
    itemId,
    itemType,
    itemName,
    vendorId,
    vendorName,
    price,
    imageUrl,
    description,
    metadata
  } = req.body;

  // Validate required fields
  if (!itemId || !itemType || !itemName) {
    return next(new ErrorHandler("itemId, itemType, and itemName are required", 400));
  }

  // Validate itemType
  if (!['vendor', 'menuItem'].includes(itemType)) {
    return next(new ErrorHandler("itemType must be either 'vendor' or 'menuItem'", 400));
  }

  // Additional validation for menu items
  if (itemType === 'menuItem') {
    if (!vendorId || !vendorName || price === undefined || price === null) {
      return next(new ErrorHandler("vendorId, vendorName, and price are required for menu items", 400));
    }
  }

  try {
    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ userId, itemId, itemType });
    if (existingFavorite) {
      return next(new ErrorHandler("Item is already in favorites", 409));
    }

    // Create new favorite
    const favoriteData = {
      userId,
      itemId,
      itemType,
      itemName,
      imageUrl,
      description,
      metadata: metadata || {}
    };

    // Add menu item specific fields
    if (itemType === 'menuItem') {
      favoriteData.vendorId = vendorId;
      favoriteData.vendorName = vendorName;
      favoriteData.price = price;
    }

    const favorite = await Favorite.create(favoriteData);

    res.status(201).json({
      success: true,
      message: "Item added to favorites successfully",
      data: favorite
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ErrorHandler("Item is already in favorites", 409));
    }
    return next(new ErrorHandler(error.message, 500));
  }
});

// Remove item from favorites
export const removeFromFavorites = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const { itemType, itemId } = req.params;

  // Validate parameters
  if (!itemType || !itemId) {
    return next(new ErrorHandler("itemType and itemId are required", 400));
  }

  // Find and remove the favorite
  const favorite = await Favorite.findOneAndDelete({ userId, itemId, itemType });

  if (!favorite) {
    return next(new ErrorHandler("Favorite not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Item removed from favorites successfully",
    data: { itemId, itemType }
  });
});

// Toggle favorite status
export const toggleFavorite = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const {
    itemId,
    itemType,
    itemName,
    vendorId,
    vendorName,
    price,
    imageUrl,
    description,
    metadata
  } = req.body;

  // Validate required fields
  if (!itemId || !itemType || !itemName) {
    return next(new ErrorHandler("itemId, itemType, and itemName are required", 400));
  }

  try {
    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ userId, itemId, itemType });

    if (existingFavorite) {
      // Remove from favorites
      await existingFavorite.deleteOne();
      
      res.status(200).json({
        success: true,
        message: "Item removed from favorites",
        data: { 
          isFavorite: false,
          itemId,
          itemType
        }
      });
    } else {
      // Add to favorites
      const favoriteData = {
        userId,
        itemId,
        itemType,
        itemName,
        imageUrl,
        description,
        metadata: metadata || {}
      };

      // Add menu item specific fields
      if (itemType === 'menuItem') {
        if (!vendorId || !vendorName || price === undefined || price === null) {
          return next(new ErrorHandler("vendorId, vendorName, and price are required for menu items", 400));
        }
        favoriteData.vendorId = vendorId;
        favoriteData.vendorName = vendorName;
        favoriteData.price = price;
      }

      const favorite = await Favorite.create(favoriteData);

      res.status(201).json({
        success: true,
        message: "Item added to favorites",
        data: { 
          isFavorite: true,
          favorite
        }
      });
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Check if item is favorited
export const checkFavoriteStatus = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const { itemType, itemId } = req.params;

  // Validate parameters
  if (!itemType || !itemId) {
    return next(new ErrorHandler("itemType and itemId are required", 400));
  }

  const isFavorite = await Favorite.isFavorited(userId, itemId, itemType);

  res.status(200).json({
    success: true,
    message: "Favorite status retrieved successfully",
    data: { 
      isFavorite,
      itemId,
      itemType
    }
  });
});

// Get favorites count
export const getFavoritesCount = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;

  const counts = await Favorite.getUserFavoritesCount(userId);

  res.status(200).json({
    success: true,
    message: "Favorites count retrieved successfully",
    data: {
      vendorCount: counts.vendor,
      menuItemCount: counts.menuItem,
      totalCount: counts.total
    }
  });
});

// Clear all favorites for user
export const clearAllFavorites = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;

  const result = await Favorite.deleteMany({ userId });

  res.status(200).json({
    success: true,
    message: `Cleared ${result.deletedCount} favorites successfully`,
    data: {
      deletedCount: result.deletedCount
    }
  });
});

// Get favorite by ID (for admin or detailed view)
export const getFavoriteById = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid favorite ID", 400));
  }

  const favorite = await Favorite.findOne({ _id: id, userId });

  if (!favorite) {
    return next(new ErrorHandler("Favorite not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Favorite retrieved successfully",
    data: favorite
  });
});

// Bulk add favorites (for import functionality)
export const bulkAddFavorites = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const { favorites } = req.body;

  if (!Array.isArray(favorites) || favorites.length === 0) {
    return next(new ErrorHandler("favorites array is required and cannot be empty", 400));
  }

  try {
    // Add userId to each favorite and validate
    const favoritesWithUserId = favorites.map(fav => ({
      ...fav,
      userId,
      metadata: fav.metadata || {}
    }));

    // Use insertMany with ordered: false to continue on duplicates
    const result = await Favorite.insertMany(favoritesWithUserId, { 
      ordered: false,
      rawResult: true 
    });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${result.insertedCount} favorites`,
      data: {
        insertedCount: result.insertedCount,
        totalProvided: favorites.length
      }
    });
  } catch (error) {
    // Handle bulk write errors (like duplicates)
    if (error.name === 'BulkWriteError') {
      const insertedCount = error.result.insertedCount || 0;
      res.status(201).json({
        success: true,
        message: `Imported ${insertedCount} favorites (some duplicates skipped)`,
        data: {
          insertedCount,
          totalProvided: favorites.length,
          duplicatesSkipped: favorites.length - insertedCount
        }
      });
    } else {
      return next(new ErrorHandler(error.message, 500));
    }
  }
});
