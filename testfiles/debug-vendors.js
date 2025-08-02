import { config } from 'dotenv';
import { connection } from '../database/dbconnection.js';
import { User } from '../models/usermodel.js';
import Vendor from '../models/Vendor.js';

// Load environment variables
config({ path: './config.env' });

async function debugVendors() {
  try {
    // Connect to database
    await connection();
    console.log('📦 Connected to database');

    // Get all vendor users
    const vendorUsers = await User.find({ role: 'vendor' }).select('-password');
    console.log(`\n👥 Found ${vendorUsers.length} vendor users:`);
    
    for (const user of vendorUsers) {
      console.log(`\n📋 User: ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   📱 Phone: ${user.phone}`);
      console.log(`   🆔 ID: ${user._id}`);
      console.log(`   ✅ Verified: ${user.accountVerified}`);
      console.log(`   🚫 Blocked: ${user.isBlocked || false}`);
      
      // Check if vendor profile exists
      const vendorProfile = await Vendor.findOne({ userId: user._id });
      if (vendorProfile) {
        console.log(`   🏪 Vendor Profile: ✅ EXISTS`);
        console.log(`   🏪 Business Name: ${vendorProfile.name}`);
        console.log(`   🏪 Slug: ${vendorProfile.slug}`);
      } else {
        console.log(`   🏪 Vendor Profile: ❌ MISSING`);
      }
    }

    // Get all vendor profiles
    const vendorProfiles = await Vendor.find({});
    console.log(`\n🏪 Found ${vendorProfiles.length} vendor profiles:`);
    
    for (const profile of vendorProfiles) {
      console.log(`\n📋 Profile: ${profile.name}`);
      console.log(`   🆔 Profile ID: ${profile._id}`);
      console.log(`   👤 User ID: ${profile.userId}`);
      console.log(`   🔗 Slug: ${profile.slug}`);
      
      // Check if user exists for this profile
      const user = await User.findById(profile.userId);
      if (user) {
        console.log(`   👤 User: ✅ EXISTS (${user.name})`);
      } else {
        console.log(`   👤 User: ❌ MISSING`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugVendors();
