// Test script for Favorites API endpoints
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Favorite } from "../models/favoriteModel.js";
import { User } from "../models/usermodel.js";

// Load environment variables
dotenv.config({ path: "./config.env" });

// Database connection
const connectDB = async () => {
  try {
    const URI =
      process.env.MONGODB_URI ||
      "mongodb+srv://bandiwala:karthik@bandiwala.lyx1xbj.mongodb.net/bandiwala?retryWrites=true&w=majority";

    const options = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
      retryWrites: true,
      retryReads: true,
    };

    await mongoose.connect(URI, options);
    console.log("✅ Connected to database for testing");
  } catch (err) {
    console.error("❌ Failed to connect to database:", err);
    process.exit(1);
  }
};

// Test data
const testUserId = new mongoose.Types.ObjectId();
const testVendorId = "vendor_test_123";
const testMenuItemId = "menuitem_test_456";

// Test functions
const testFavoriteModel = async () => {
  console.log("\n🧪 Testing Favorite Model...");

  try {
    // Test 1: Create vendor favorite
    const vendorFavorite = new Favorite({
      userId: testUserId,
      itemId: testVendorId,
      itemType: "vendor",
      itemName: "Test Vendor",
      description: "A test vendor for favorites",
      metadata: {
        rating: 4.5,
        category: "Street Food",
        isAvailable: true,
      },
    });

    await vendorFavorite.save();
    console.log("✅ Vendor favorite created successfully");

    // Test 2: Create menu item favorite
    const menuItemFavorite = new Favorite({
      userId: testUserId,
      itemId: testMenuItemId,
      itemType: "menuItem",
      itemName: "Test Menu Item",
      vendorId: testVendorId,
      vendorName: "Test Vendor",
      price: 99.99,
      description: "A delicious test item",
      metadata: {
        rating: 4.8,
        category: "Main Course",
        tags: ["spicy", "vegetarian"],
        isAvailable: true,
      },
    });

    await menuItemFavorite.save();
    console.log("✅ Menu item favorite created successfully");

    // Test 3: Test static methods
    const favoritesCount = await Favorite.getUserFavoritesCount(testUserId);
    console.log("✅ Favorites count:", favoritesCount);

    const isFavorited = await Favorite.isFavorited(
      testUserId,
      testVendorId,
      "vendor"
    );
    console.log("✅ Is vendor favorited:", isFavorited);

    // Test 4: Test getUserFavoritesByType
    const vendorFavorites = await Favorite.getUserFavoritesByType(
      testUserId,
      "vendor"
    );
    console.log(
      "✅ Vendor favorites retrieved:",
      vendorFavorites.favorites.length
    );

    const menuItemFavorites = await Favorite.getUserFavoritesByType(
      testUserId,
      "menuItem"
    );
    console.log(
      "✅ Menu item favorites retrieved:",
      menuItemFavorites.favorites.length
    );

    // Test 5: Test search functionality
    const searchResults = await Favorite.getUserFavoritesByType(
      testUserId,
      "all",
      {
        search: "test",
      }
    );
    console.log("✅ Search results:", searchResults.favorites.length);

    // Test 6: Test virtual fields
    const favorite = await Favorite.findOne({
      userId: testUserId,
      itemType: "vendor",
    });
    console.log(
      "✅ Virtual fields - Time since added:",
      favorite.timeSinceAdded
    );
    console.log("✅ Virtual fields - Formatted date:", favorite.formattedDate);
  } catch (error) {
    console.error("❌ Favorite model test failed:", error.message);
  }
};

const testDuplicatePrevention = async () => {
  console.log("\n🧪 Testing Duplicate Prevention...");

  try {
    // Try to create duplicate favorite
    const duplicateFavorite = new Favorite({
      userId: testUserId,
      itemId: testVendorId,
      itemType: "vendor",
      itemName: "Duplicate Test Vendor",
    });

    await duplicateFavorite.save();
    console.log("❌ Duplicate prevention failed - should not reach here");
  } catch (error) {
    if (error.code === 11000) {
      console.log("✅ Duplicate prevention working correctly");
    } else {
      console.error("❌ Unexpected error:", error.message);
    }
  }
};

const testValidation = async () => {
  console.log("\n🧪 Testing Validation...");

  try {
    // Test 1: Missing required fields
    const invalidFavorite1 = new Favorite({
      userId: testUserId,
      itemType: "vendor",
      // Missing itemId and itemName
    });

    await invalidFavorite1.save();
    console.log("❌ Validation failed - should not reach here");
  } catch (error) {
    console.log(
      "✅ Required field validation working:",
      error.message.includes("required")
    );
  }

  try {
    // Test 2: Invalid itemType
    const invalidFavorite2 = new Favorite({
      userId: testUserId,
      itemId: "test_id",
      itemName: "Test Item",
      itemType: "invalid_type",
    });

    await invalidFavorite2.save();
    console.log("❌ ItemType validation failed - should not reach here");
  } catch (error) {
    console.log(
      "✅ ItemType validation working:",
      error.message.includes("enum")
    );
  }

  try {
    // Test 3: Menu item without required fields
    const invalidFavorite3 = new Favorite({
      userId: testUserId,
      itemId: "test_menu_item",
      itemName: "Test Menu Item",
      itemType: "menuItem",
      // Missing vendorId, vendorName, price
    });

    await invalidFavorite3.save();
    console.log("❌ Menu item validation failed - should not reach here");
  } catch (error) {
    console.log(
      "✅ Menu item validation working:",
      error.message.includes("required")
    );
  }
};

const testPagination = async () => {
  console.log("\n🧪 Testing Pagination...");

  try {
    // Create multiple favorites for pagination testing
    const favorites = [];
    for (let i = 0; i < 25; i++) {
      favorites.push({
        userId: testUserId,
        itemId: `test_item_${i}`,
        itemType: i % 2 === 0 ? "vendor" : "menuItem",
        itemName: `Test Item ${i}`,
        vendorId: i % 2 === 1 ? `vendor_${i}` : undefined,
        vendorName: i % 2 === 1 ? `Vendor ${i}` : undefined,
        price: i % 2 === 1 ? 10 + i : undefined,
        metadata: {
          rating: 3 + (i % 3),
          category: `Category ${i % 5}`,
        },
      });
    }

    await Favorite.insertMany(favorites, { ordered: false });
    console.log("✅ Test favorites created for pagination");

    // Test pagination
    const page1 = await Favorite.getUserFavoritesByType(testUserId, "all", {
      page: 1,
      limit: 10,
    });

    console.log("✅ Page 1 results:", page1.favorites.length);
    console.log("✅ Pagination info:", page1.pagination);

    const page2 = await Favorite.getUserFavoritesByType(testUserId, "all", {
      page: 2,
      limit: 10,
    });

    console.log("✅ Page 2 results:", page2.favorites.length);
  } catch (error) {
    console.error("❌ Pagination test failed:", error.message);
  }
};

const testIndexes = async () => {
  console.log("\n🧪 Testing Database Indexes...");

  try {
    const indexes = await Favorite.collection.getIndexes();
    console.log("✅ Database indexes:");
    Object.keys(indexes).forEach((indexName) => {
      console.log(`   - ${indexName}:`, indexes[indexName].key);
    });

    // Test query performance with explain
    const explainResult = await Favorite.find({ userId: testUserId }).explain(
      "executionStats"
    );
    console.log("✅ Query execution stats:");
    console.log(
      `   - Documents examined: ${explainResult.executionStats.totalDocsExamined}`
    );
    console.log(
      `   - Documents returned: ${explainResult.executionStats.totalDocsReturned}`
    );
    console.log(
      `   - Execution time: ${explainResult.executionStats.executionTimeMillis}ms`
    );
  } catch (error) {
    console.error("❌ Index test failed:", error.message);
  }
};

const cleanup = async () => {
  console.log("\n🧹 Cleaning up test data...");

  try {
    await Favorite.deleteMany({ userId: testUserId });
    console.log("✅ Test favorites cleaned up");
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
  }
};

// Main test runner
const runTests = async () => {
  console.log("🚀 Starting Favorites API Backend Tests...\n");

  await connectDB();

  await testFavoriteModel();
  await testDuplicatePrevention();
  await testValidation();
  await testPagination();
  await testIndexes();
  await cleanup();

  console.log("\n✅ All tests completed!");
  process.exit(0);
};

// Handle errors
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

// Run tests
runTests();
