import mongoose from "mongoose";
import Order from "../models/Order.js";
import { User } from "../models/usermodel.js";
import { config } from "dotenv";

config({ path: "./config.env" });

const createTestOrder = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to database");

    // Find a user to create order for
    const user = await User.findOne({ role: "user" });
    if (!user) {
      console.log("No user found. Creating a test user...");
      const testUser = new User({
        name: "Test Customer",
        email: "customer@test.com",
        phone: "+919876543210",
        password: "password123",
        role: "user",
        accountVerified: true,
        address: "Test Customer Address, Bangalore",
        location: {
          coordinates: {
            lat: 12.9716,
            lng: 77.5946,
          },
          formattedAddress:
            "Test Customer Address, Bangalore, Karnataka, India",
        },
      });
      await testUser.save();
      console.log("Test user created:", testUser.name);
    }

    const customer = user || (await User.findOne({ role: "user" }));

    // Create a test order
    const testOrder = new Order({
      user: customer._id,
      items: [
        {
          menuItemId: customer._id, // Using customer ID as menu item for simplicity
          name: "Test Burger",
          quantity: 2,
          selectedSubcategory: {
            title: "Regular",
            quantity: "1 piece",
            price: 250,
          },
          vendorId: customer._id, // Using customer ID as vendor for simplicity
          vendorName: "Test Restaurant",
          vendorPhone: "+919876543210",
          image: "https://example.com/burger.jpg",
        },
        {
          menuItemId: customer._id,
          name: "Test Fries",
          quantity: 1,
          selectedSubcategory: {
            title: "Medium",
            quantity: "1 serving",
            price: 100,
          },
          vendorId: customer._id,
          vendorName: "Test Restaurant",
          vendorPhone: "+919876543210",
          image: "https://example.com/fries.jpg",
        },
      ],
      subtotal: 600,
      platformFee: 20,
      deliveryCharge: 30,
      tax: 32.5, // 5% of (600 + 20 + 30)
      total: 682.5,
      deliveryAddress: {
        formatted: "Test Delivery Address, Koramangala, Bangalore",
        coordinates: {
          lat: 12.9352,
          lng: 77.6245,
        },
      },
      orderStatus: "preparing", // Ready for delivery partner to pick up
      paymentMethod: "upi",
      paymentStatus: "paid",
      statusTimeline: [
        {
          status: "placed",
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        },
        {
          status: "confirmed",
          timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
        },
        {
          status: "preparing",
          timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        },
      ],
      estimatedDeliveryTime: "30-40 mins",
      adminNotes: "Test order for delivery partner functionality",
    });

    await testOrder.save();

    console.log("✅ Test order created successfully!");
    console.log("📦 Order Number:", testOrder.orderNumber);
    console.log("👤 Customer:", customer.name);
    console.log("💰 Total Amount: ₹", testOrder.total);
    console.log("📍 Delivery Address:", testOrder.deliveryAddress.formatted);
    console.log("📊 Status:", testOrder.orderStatus);
    console.log("🆔 Order ID:", testOrder._id);

    // Create another order for testing
    const testOrder2 = new Order({
      user: customer._id,
      items: [
        {
          menuItemId: customer._id,
          name: "Test Pizza",
          quantity: 1,
          selectedSubcategory: {
            title: "Large",
            quantity: "1 pizza",
            price: 450,
          },
          vendorId: customer._id,
          vendorName: "Test Pizzeria",
          vendorPhone: "+919876543211",
          image: "https://example.com/pizza.jpg",
        },
      ],
      subtotal: 450,
      platformFee: 15,
      deliveryCharge: 25,
      tax: 24.5, // 5% of (450 + 15 + 25)
      total: 514.5,
      deliveryAddress: {
        formatted: "Another Test Address, Indiranagar, Bangalore",
        coordinates: {
          lat: 12.9784,
          lng: 77.6408,
        },
      },
      orderStatus: "preparing",
      paymentMethod: "cash",
      paymentStatus: "pending",
      statusTimeline: [
        {
          status: "placed",
          timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        },
        {
          status: "confirmed",
          timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        },
        {
          status: "preparing",
          timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        },
      ],
      estimatedDeliveryTime: "25-35 mins",
      adminNotes: "Second test order for delivery partner",
    });

    await testOrder2.save();

    console.log("\n✅ Second test order created successfully!");
    console.log("📦 Order Number:", testOrder2.orderNumber);
    console.log("💰 Total Amount: ₹", testOrder2.total);
    console.log("📍 Delivery Address:", testOrder2.deliveryAddress.formatted);
    console.log("🆔 Order ID:", testOrder2._id);

    console.log(
      "\n🎉 Test orders are now available for delivery partners to accept!"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating test order:", error);
    process.exit(1);
  }
};

createTestOrder();
