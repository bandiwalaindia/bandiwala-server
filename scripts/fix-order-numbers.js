/**
 * Script to fix existing orders that don't have orderNumber field
 * Run this with: node scripts/fix-order-numbers.js
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

// Generate order number for existing orders
const generateOrderNumber = (order) => {
  const createdAt = new Date(order.createdAt);
  const year = createdAt.getFullYear();
  const month = String(createdAt.getMonth() + 1).padStart(2, "0");
  const day = String(createdAt.getDate()).padStart(2, "0");
  const hours = String(createdAt.getHours()).padStart(2, "0");
  const minutes = String(createdAt.getMinutes()).padStart(2, "0");
  const seconds = String(createdAt.getSeconds()).padStart(2, "0");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return `BW-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
};

const fixOrderNumbers = async () => {
  try {
    console.log("🔍 Looking for orders without orderNumber...");

    // Find orders without orderNumber
    const ordersWithoutNumber = await Order.find({
      $or: [
        { orderNumber: { $exists: false } },
        { orderNumber: null },
        { orderNumber: "" },
      ],
    });

    console.log(
      `Found ${ordersWithoutNumber.length} orders without orderNumber`
    );

    if (ordersWithoutNumber.length === 0) {
      console.log("✅ All orders already have orderNumber");
      return;
    }

    // Update each order
    for (let i = 0; i < ordersWithoutNumber.length; i++) {
      const order = ordersWithoutNumber[i];
      let orderNumber;
      let isUnique = false;
      let attempts = 0;

      // Generate unique order number
      while (!isUnique && attempts < 10) {
        orderNumber = generateOrderNumber(order);

        // Check if this order number already exists
        const existingOrder = await Order.findOne({ orderNumber });
        if (!existingOrder) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        // Fallback to using ObjectId
        orderNumber = `BW-${order._id}`;
      }

      // Update the order
      await Order.findByIdAndUpdate(order._id, { orderNumber });
      console.log(
        `✅ Updated order ${order._id} with orderNumber: ${orderNumber}`
      );
    }

    console.log(`🎉 Successfully updated ${ordersWithoutNumber.length} orders`);

    // Verify the fix
    console.log("\n🔍 Verifying fix...");
    const remainingOrders = await Order.find({
      $or: [
        { orderNumber: { $exists: false } },
        { orderNumber: null },
        { orderNumber: "" },
      ],
    });

    if (remainingOrders.length === 0) {
      console.log("✅ All orders now have orderNumber");
    } else {
      console.log(
        `❌ Still ${remainingOrders.length} orders without orderNumber`
      );
    }

    // Show sample of updated orders
    console.log("\n📋 Sample of orders with orderNumber:");
    const sampleOrders = await Order.find({})
      .limit(5)
      .select("_id orderNumber createdAt");
    sampleOrders.forEach((order) => {
      console.log(
        `   ${order._id} -> ${order.orderNumber} (${order.createdAt})`
      );
    });
  } catch (error) {
    console.error("❌ Error fixing order numbers:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from database");
  }
};

// Run the script
const main = async () => {
  await connectDB();
  await fixOrderNumbers();
};

main();
