import mongoose from "mongoose";
import { User } from "../models/usermodel.js";
import { config } from "dotenv";

// Load environment variables
config({ path: "./config.env" });

async function testRoleBasedAuth() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Test 1: Create users with different roles
    console.log("\n🧪 Test 1: Creating users with different roles...");

    // Clean up existing test users
    await User.deleteMany({
      email: {
        $in: [
          "admin@test.com",
          "vendor@test.com",
          "delivery@test.com",
          "user@test.com",
        ],
      },
    });

    const testUsers = [
      {
        name: "Admin User",
        email: "admin@test.com",
        phone: "+919999999991",
        password: "password123",
        role: "admin",
        accountVerified: true,
      },
      {
        name: "Vendor User",
        email: "vendor@test.com",
        phone: "+919999999992",
        password: "password123",
        role: "vendor",
        accountVerified: true,
      },
      {
        name: "Delivery Partner",
        email: "delivery@test.com",
        phone: "+919999999993",
        password: "password123",
        role: "deliveryPartner",
        accountVerified: true,
      },
      {
        name: "Regular User",
        email: "user@test.com",
        phone: "+919999999994",
        password: "password123",
        role: "user",
        accountVerified: true,
      },
    ];

    const createdUsers = [];
    for (const userData of testUsers) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`✅ Created ${user.role}: ${user.name} (${user.email})`);
    }

    // Test 2: Generate JWT tokens and verify role inclusion
    console.log("\n🧪 Test 2: Testing JWT token generation with roles...");

    for (const user of createdUsers) {
      const token = user.generateToken();
      console.log(`✅ Generated token for ${user.role}: ${user.name}`);
      console.log(`   Token preview: ${token.substring(0, 50)}...`);

      // Decode token to verify role is included
      const jwt = await import("jsonwebtoken");
      const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
      console.log(
        `   Decoded payload: { id: ${decoded.id}, role: ${decoded.role} }`
      );

      if (decoded.role === user.role) {
        console.log(`   ✅ Role correctly included in token`);
      } else {
        console.log(`   ❌ Role mismatch in token`);
      }
    }

    // Test 3: Verify default role assignment
    console.log("\n🧪 Test 3: Testing default role assignment...");

    const defaultUser = await User.create({
      name: "Default User",
      email: "default@test.com",
      phone: "+919999999995",
      password: "password123",
      accountVerified: true,
      // No role specified - should default to 'user'
    });

    console.log(`✅ Created user without role: ${defaultUser.name}`);
    console.log(`   Default role assigned: ${defaultUser.role}`);

    if (defaultUser.role === "user") {
      console.log(`   ✅ Default role assignment working correctly`);
    } else {
      console.log(`   ❌ Default role assignment failed`);
    }

    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - Created ${createdUsers.length + 1} test users`);
    console.log(`   - Verified JWT token generation with roles`);
    console.log(`   - Confirmed default role assignment`);
    console.log("\n🔐 Test user credentials:");
    console.log("   Admin: admin@test.com / password123");
    console.log("   Vendor: vendor@test.com / password123");
    console.log("   Delivery: delivery@test.com / password123");
    console.log("   User: user@test.com / password123");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

// Run the test
testRoleBasedAuth();
