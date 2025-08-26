import mongoose from "mongoose";
import { User } from "../models/usermodel.js";
import Vendor from "../models/Vendor.js";
import { config } from "dotenv";

// Load environment variables
config({ path: "./config.env" });

const createVendorUsers = async () => {
  try {
    // Connect to database
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
    console.log("✅ Connected to database");

    // Check if vendor users already exist
    const existingVendorUsers = await User.find({ role: "vendor" });
    console.log(`Found ${existingVendorUsers.length} existing vendor users`);

    // We need 4 vendor users total
    const requiredVendorUsers = [
      {
        name: "Jai Bhavani Chat Owner",
        email: "jaibhavani@bandiwala.com",
        phone: "+919876543210",
        password: "vendor123",
        role: "vendor",
        accountVerified: true,
      },
      {
        name: "BFC Chicken Owner",
        email: "bfc@bandiwala.com",
        phone: "+919876543211",
        password: "vendor123",
        role: "vendor",
        accountVerified: true,
      },
      {
        name: "Rajahmundry Owner",
        email: "rajahmundry@bandiwala.com",
        phone: "+919876543212",
        password: "vendor123",
        role: "vendor",
        accountVerified: true,
      },
      {
        name: "Sangamesh Bhavani Owner",
        email: "sangamesh@bandiwala.com",
        phone: "+919876543213",
        password: "vendor123",
        role: "vendor",
        accountVerified: true,
      },
    ];

    // Create missing vendor users
    const newVendorUsers = [];
    for (const userData of requiredVendorUsers) {
      const existingUser = await User.findOne({
        $or: [{ email: userData.email }, { phone: userData.phone }],
      });

      if (!existingUser) {
        const newUser = await User.create(userData);
        newVendorUsers.push(newUser);
        console.log(`✅ Created vendor user: ${newUser.name}`);
      } else {
        newVendorUsers.push(existingUser);
        console.log(`✅ Found existing vendor user: ${existingUser.name}`);
      }
    }

    const allVendorUsers = newVendorUsers;

    // Link vendors to users
    const vendors = await Vendor.find({}).sort({ createdAt: 1 });
    for (let i = 0; i < Math.min(vendors.length, allVendorUsers.length); i++) {
      if (!vendors[i].userId) {
        vendors[i].userId = allVendorUsers[i]._id;
        await vendors[i].save();
        console.log(
          `✅ Linked vendor ${vendors[i].name} to user ${allVendorUsers[i].name}`
        );
      } else {
        console.log(`✅ Vendor ${vendors[i].name} already linked to user`);
      }
    }

    console.log("✅ All vendor users created and linked successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating vendor users:", error);
    process.exit(1);
  }
};

createVendorUsers();
