import { catchAsyncError } from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/error.js";
import { User } from "../models/usermodel.js";
import MenuItem from "../models/MenuItem.js";
import mongoose from "mongoose";

// Import distance calculation functions
const SERVICE_AREA_CENTER = { lat: 17.49328, lng: 78.39433 };
const SERVICE_AREA_RADIUS_KM = 1.001;

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(coords1, coords2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coords2.lat - coords1.lat);
  const dLng = toRadians(coords2.lng - coords1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coords1.lat)) * Math.cos(toRadians(coords2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function isWithinDeliveryArea(userCoords) {
  const distance = calculateDistance(userCoords, SERVICE_AREA_CENTER);
  return distance <= SERVICE_AREA_RADIUS_KM;
}

// Get cart for the authenticated user
export const getCart = catchAsyncError(async (req, res, next) => {
  try {
    const user = req.user;

    // If user doesn't have a cart, initialize it
    if (!user.cart) {
      user.cart = { items: [] };
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Cart retrieved successfully",
      data: {
        userId: user._id,
        items: user.cart.items || []
      }
    });
  } catch (error) {
    console.error("Error in getCart:", error);
    return next(new ErrorHandler("Failed to retrieve cart", 500));
  }
});

// Add item to cart
export const addToCart = catchAsyncError(async (req, res, next) => {
  try {
    const { menuItemId, quantity, plate, notes, userLocation } = req.body;
    const user = req.user;

    console.log("=== ADD TO CART REQUEST ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("User ID:", user._id);
    console.log("User email:", user.email);
    console.log("User phone:", user.phone);

    if (!menuItemId) {
      return next(new ErrorHandler("Menu item ID is required", 400));
    }

    if (!quantity || quantity <= 0) {
      return next(new ErrorHandler("Quantity must be greater than 0", 400));
    }

    if (!plate) {
      return next(new ErrorHandler("Plate size is required", 400));
    }

    // Note: Delivery area validation removed from cart addition
    // Items can now be added to cart regardless of delivery area
    // Delivery area validation will be performed during order placement
    console.log("Adding item to cart without delivery area validation");
    if (userLocation && userLocation.lat && userLocation.lng) {
      console.log("User location provided:", userLocation);
    } else if (user.location && user.location.coordinates && user.location.coordinates.lat && user.location.coordinates.lng) {
      console.log("Using user saved location:", user.location.coordinates);
    } else {
      console.log("No user location available - will be validated during checkout");
    }

    // Validate menuItemId format
    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      return next(new ErrorHandler("Invalid menu item ID format", 400));
    }

    // Fetch menu item details from database with vendor information
    const menuItem = await MenuItem.findById(menuItemId).populate('vendorId', 'name phone address coordinates');

    if (!menuItem) {
      return next(new ErrorHandler("Menu item not found", 404));
    }

    console.log("Found menu item:", menuItem.itemName);
    console.log("Menu item subcategories:", menuItem.subcategories);

    // Find the matching subcategory based on plate size
    const selectedSubcategory = menuItem.subcategories.find(sub =>
      sub.title.toLowerCase() === plate.toLowerCase() ||
      sub.quantity.toLowerCase() === plate.toLowerCase()
    );

    if (!selectedSubcategory) {
      return next(new ErrorHandler(`Plate size "${plate}" not available for this item`, 400));
    }

    console.log("Selected subcategory:", selectedSubcategory);

    // Initialize cart if it doesn't exist
    if (!user.cart) {
      user.cart = { items: [] };
    }

    // Check if item already exists in cart with the same subcategory
    const existingItemIndex = user.cart.items.findIndex(
      item => item.menuItemId.toString() === menuItemId &&
               item.selectedSubcategory.title === selectedSubcategory.title
    );

    if (existingItemIndex > -1) {
      // Update existing item
      user.cart.items[existingItemIndex].quantity += quantity;
      if (notes) {
        user.cart.items[existingItemIndex].notes = notes;
      }
      console.log("Updated existing cart item");
    } else {
      // Add new item with details from the database
      const newCartItem = {
        menuItemId,
        quantity,
        notes: notes || '',
        selectedSubcategory: {
          title: selectedSubcategory.title,
          quantity: selectedSubcategory.quantity,
          price: selectedSubcategory.price
        },
        name: menuItem.itemName,
        image: menuItem.image,
        vendorId: menuItem.vendorId._id || menuItem.vendorId,
        vendorName: menuItem.vendorId.name || "Unknown Vendor",
        vendorPhone: menuItem.vendorId.phone || "Not available",
        vendorAddress: menuItem.vendorId.address || "Address not available",
        vendorLocation: {
          coordinates: {
            lat: menuItem.vendorId.coordinates?.lat || 17.49328,
            lng: menuItem.vendorId.coordinates?.lng || 78.39433
          },
          formatted: menuItem.vendorId.address || "Address not available"
        }
      };

      user.cart.items.push(newCartItem);
      console.log("Added new cart item:", newCartItem);
    }

    console.log("Cart before save:", user.cart);
    await user.save();
    console.log("Cart after save:", user.cart);

    res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      data: {
        userId: user._id,
        items: user.cart.items
      }
    });
  } catch (error) {
    console.error("Error in addToCart:", error);
    return next(new ErrorHandler("Failed to add item to cart", 500));
  }
});

// Update cart item
export const updateCartItem = catchAsyncError(async (req, res, next) => {
  try {
    const { menuItemId, quantity, notes, plate } = req.body;
    const user = req.user;

    console.log("updateCartItem request body:", req.body);

    if (!menuItemId) {
      return next(new ErrorHandler("Menu item ID is required", 400));
    }

    if (!user.cart || !user.cart.items || user.cart.items.length === 0) {
      return next(new ErrorHandler("Cart is empty", 400));
    }

    // Find the item with matching menuItemId and selectedSubcategory title (if provided)
    const itemIndex = user.cart.items.findIndex(item => {
      if (plate) {
        return item.menuItemId.toString() === menuItemId &&
               item.selectedSubcategory.title.toLowerCase() === plate.toLowerCase();
      }
      return item.menuItemId.toString() === menuItemId;
    });

    if (itemIndex === -1) {
      return next(new ErrorHandler("Item not found in cart", 404));
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      user.cart.items.splice(itemIndex, 1);
      console.log("Removed item from cart");
    } else if (quantity > 0) {
      // Update quantity
      user.cart.items[itemIndex].quantity = quantity;

      // Update notes if provided
      if (notes !== undefined) {
        user.cart.items[itemIndex].notes = notes;
      }

      console.log("Updated cart item quantity to:", quantity);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      data: {
        userId: user._id,
        items: user.cart.items
      }
    });
  } catch (error) {
    console.error("Error in updateCartItem:", error);
    return next(new ErrorHandler("Failed to update cart", 500));
  }
});

// Remove item from cart
export const removeFromCart = catchAsyncError(async (req, res, next) => {
  try {
    const { menuItemId } = req.params;
    const { plate } = req.query; // Get plate from query params
    const user = req.user;

    console.log("removeFromCart - menuItemId:", menuItemId, "plate:", plate);

    if (!menuItemId) {
      return next(new ErrorHandler("Menu item ID is required", 400));
    }

    if (!user.cart || !user.cart.items || user.cart.items.length === 0) {
      return next(new ErrorHandler("Cart is empty", 400));
    }

    const initialLength = user.cart.items.length;

    // If plate is specified, remove only items with matching menuItemId and selectedSubcategory title
    if (plate) {
      user.cart.items = user.cart.items.filter(
        item => !(item.menuItemId.toString() === menuItemId &&
                 item.selectedSubcategory.title.toLowerCase() === plate.toLowerCase())
      );
    } else {
      // Otherwise, remove all items with matching menuItemId
      user.cart.items = user.cart.items.filter(
        item => item.menuItemId.toString() !== menuItemId
      );
    }

    if (user.cart.items.length === initialLength) {
      return next(new ErrorHandler("Item not found in cart", 404));
    }

    console.log("Removed item from cart. Items remaining:", user.cart.items.length);

    await user.save();

    res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
      data: {
        userId: user._id,
        items: user.cart.items
      }
    });
  } catch (error) {
    console.error("Error in removeFromCart:", error);
    return next(new ErrorHandler("Failed to remove item from cart", 500));
  }
});

// Clear cart
export const clearCart = catchAsyncError(async (req, res, next) => {
  try {
    const user = req.user;

    if (!user.cart) {
      user.cart = { items: [] };
    } else {
      user.cart.items = [];
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: {
        userId: user._id,
        items: []
      }
    });
  } catch (error) {
    console.error("Error in clearCart:", error);
    return next(new ErrorHandler("Failed to clear cart", 500));
  }
});

// Reorder cart items
export const reorderCartItems = catchAsyncError(async (req, res, next) => {
  try {
    const { itemOrders } = req.body;
    const user = req.user;

    if (!Array.isArray(itemOrders)) {
      return next(new ErrorHandler("Item orders must be an array", 400));
    }

    // Validate that all items exist in the cart
    const cartItemIds = user.cart.items.map(item =>
      `${item.menuItemId}-${item.selectedSubcategory.title}`
    );

    for (const itemOrder of itemOrders) {
      const itemKey = `${itemOrder.menuItemId}-${itemOrder.subcategoryTitle}`;
      if (!cartItemIds.includes(itemKey)) {
        return next(new ErrorHandler(`Item ${itemKey} not found in cart`, 400));
      }
    }

    // Update the order for each cart item
    user.cart.items.forEach(item => {
      const itemKey = `${item.menuItemId}-${item.selectedSubcategory.title}`;
      const orderInfo = itemOrders.find(order =>
        `${order.menuItemId}-${order.subcategoryTitle}` === itemKey
      );

      if (orderInfo) {
        item.order = orderInfo.order;
      }
    });

    // Sort items by order
    user.cart.items.sort((a, b) => (a.order || 0) - (b.order || 0));

    await user.save();

    res.status(200).json({
      success: true,
      message: "Cart items reordered successfully",
      data: {
        userId: user._id,
        items: user.cart.items
      }
    });
  } catch (error) {
    console.error("Error in reorderCartItems:", error);
    return next(new ErrorHandler("Failed to reorder cart items", 500));
  }
});
