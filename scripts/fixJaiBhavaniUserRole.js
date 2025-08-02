import mongoose from 'mongoose';
import { User } from '../models/usermodel.js';
import { config } from 'dotenv';

// Load environment variables
config({ path: './config.env' });

const fixJaiBhavaniUserRole = async () => {
  try {
    // Connect to database
    const URI = process.env.MONGO_URL || "mongodb+srv://bandiwala:karthik@bandiwala.lyx1xbj.mongodb.net/bandiwala?retryWrites=true&w=majority";
    
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

    // Find user with phone number 9876543210 (with or without +91 prefix)
    const existingUser = await User.findOne({
      $or: [
        { phone: "9876543210" },
        { phone: "+919876543210" }
      ]
    });

    if (existingUser) {
      console.log(`📱 Found existing user with phone: ${existingUser.phone}`);
      console.log(`👤 Name: ${existingUser.name}`);
      console.log(`📧 Email: ${existingUser.email}`);
      console.log(`🔑 Current Role: ${existingUser.role}`);

      // Update the user details for Jai Bhavani Chat Owner
      existingUser.name = "Jai Bhavani Chat Owner";
      existingUser.email = "jaibhavani@bandiwala.com";
      existingUser.phone = "+919876543210"; // Standardize phone format
      existingUser.role = "vendor";
      existingUser.accountVerified = true;
      existingUser.isApproved = true;
      existingUser.isBlocked = false;

      await existingUser.save();
      
      console.log("✅ Successfully updated user:");
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Phone: ${existingUser.phone}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Account Verified: ${existingUser.accountVerified}`);
      console.log(`   Approved: ${existingUser.isApproved}`);
    } else {
      console.log("❌ No user found with phone number 9876543210 or +919876543210");
      console.log("🔄 Creating new vendor user...");
      
      // Create new vendor user
      const newUser = await User.create({
        name: "Jai Bhavani Chat Owner",
        email: "jaibhavani@bandiwala.com",
        phone: "+919876543210",
        password: "vendor123",
        role: "vendor",
        accountVerified: true,
        isApproved: true,
        isBlocked: false,
      });

      console.log("✅ Created new vendor user:");
      console.log(`   Name: ${newUser.name}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Phone: ${newUser.phone}`);
      console.log(`   Role: ${newUser.role}`);
    }

    console.log('✅ Jai Bhavani Chat Owner role fixed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing Jai Bhavani user role:', error);
    process.exit(1);
  }
};

fixJaiBhavaniUserRole();
