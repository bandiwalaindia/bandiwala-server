/**
 * Script to fix legacy orders by marking them as cancelled
 * This prevents them from being processed by the Order Status Service
 * Run this with: node scripts/fix-legacy-orders.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../models/Order.js";

// Load environment variables
dotenv.config({ path: "./config.env" });

// Database connection
const connectDB = async () => {
  try {
    const URI =
      process.env.MONGODB_URI ||
      "mongodb+srv://bandiwala:karthik@bandiwala.lyx1xbj.mongodb.net/bandiwala?retryWrites=true&w=majority";
    await mongoose.connect(URI);
    console.log(
      "✅ Connected to database:",
      URI.includes("mongodb+srv") ? "MongoDB Atlas" : "Local MongoDB"
    );
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

// Function to check if order has valid item structure
const hasValidItems = (order) => {
  return (
    order.items &&
    order.items.every(
      (item) =>
        item.selectedSubcategory &&
        item.selectedSubcategory.title &&
        item.selectedSubcategory.quantity &&
        item.selectedSubcategory.price !== undefined
    )
  );
};

// Main function to fix legacy orders
const fixLegacyOrders = async () => {
  try {
    console.log("🔍 Searching for legacy orders...");

    // Find all orders that are not delivered or cancelled
    const activeOrders = await Order.find({
      orderStatus: { $nin: ["delivered", "cancelled"] },
    });

    console.log(`📊 Found ${activeOrders.length} active orders to check`);

    let legacyCount = 0;
    let validCount = 0;

    for (const order of activeOrders) {
      if (!hasValidItems(order)) {
        // This is a legacy order - mark it as cancelled
        await Order.findByIdAndUpdate(order._id, {
          orderStatus: "cancelled",
          updatedAt: new Date(),
        });

        console.log(`❌ Marked legacy order ${order.orderNumber} as cancelled`);
        legacyCount++;
      } else {
        console.log(`✅ Valid order ${order.orderNumber} - keeping active`);
        validCount++;
      }
    }

    console.log("\n📈 Summary:");
    console.log(`✅ Valid orders: ${validCount}`);
    console.log(`❌ Legacy orders marked as cancelled: ${legacyCount}`);
    console.log(`📊 Total processed: ${activeOrders.length}`);

    if (legacyCount > 0) {
      console.log(
        "\n🎉 Legacy orders have been marked as cancelled and will no longer be processed by the Order Status Service!"
      );
    } else {
      console.log(
        "\n✨ No legacy orders found - all active orders have valid structure!"
      );
    }
  } catch (error) {
    console.error("❌ Error fixing legacy orders:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
};

// Run the script
connectDB().then(() => {
  fixLegacyOrders();
});
