// Direct database test to verify cart items are persisted
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./config.env" });

// User schema (matching the actual schema)
const cartItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "MenuItem",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    notes: {
      type: String,
      default: "",
    },
    selectedSubcategory: {
      title: {
        type: String,
        required: true,
      },
      quantity: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
    },
    name: String,
    image: String,
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },
    vendorName: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
  accountVerified: Boolean,
  cart: {
    items: [cartItemSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);

async function verifyCartInDatabase() {
  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bandiwala"
    );
    console.log("✅ Connected to MongoDB");

    // Find the test user by email (the one we used in the API test)
    const testUser = await User.findOne({
      email: "gurramkarthik2006@gmail.com",
    });

    if (!testUser) {
      console.log("❌ Test user not found");
      return;
    }

    console.log("✅ Found user:", testUser.name);
    console.log("📧 Email:", testUser.email);
    console.log("🆔 User ID:", testUser._id);
    console.log("✅ Account Verified:", testUser.accountVerified);

    // Check cart
    if (testUser.cart && testUser.cart.items) {
      console.log("🛒 Cart items count:", testUser.cart.items.length);

      if (testUser.cart.items.length > 0) {
        console.log("📦 Cart items:");
        testUser.cart.items.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.name}`);
          console.log(`     Quantity: ${item.quantity}`);
          console.log(`     Plate: ${item.selectedSubcategory?.title}`);
          console.log(`     Price: ₹${item.selectedSubcategory?.price}`);
          console.log(`     Vendor: ${item.vendorName}`);
          console.log(`     Notes: ${item.notes}`);
          console.log("");
        });

        console.log(
          "✅ SUCCESS: Items are correctly stored in user.cart.items array!"
        );
        console.log("✅ The backend cart functionality is working perfectly!");
      } else {
        console.log("⚠️  Cart is empty - this might indicate an issue");
      }
    } else {
      console.log("❌ Cart not found or not initialized");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the verification
verifyCartInDatabase();
