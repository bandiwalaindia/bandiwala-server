import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/usermodel.js';

// Load environment variables
dotenv.config({ path: './config.env' });

async function verifyCartInDatabase() {
  try {
    console.log('🔍 Connecting to database...');
    console.log('Database URL:', process.env.MONGO_URL);
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to database');

    // Find all users with this email
    const users = await User.find({ email: 'gurramkarthik2006@gmail.com' });

    // Also find the specific user from our API test
    const specificUser = await User.findById('68394daf68322902e35dd998');

    console.log(`\n👥 Found ${users.length} users with this email`);

    if (users.length === 0) {
      console.log('❌ No users found');
      return;
    }

    // Check each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n--- User ${i + 1} ---`);

      console.log('User ID:', user._id);
      console.log('Email:', user.email);
      console.log('Name:', user.name);

      console.log('\n🛒 Cart details:');
      console.log('Cart exists:', !!user.cart);
      console.log('Cart items count:', user.cart?.items?.length || 0);

      if (user.cart && user.cart.items && user.cart.items.length > 0) {
        console.log('\n📦 Cart items:');
        user.cart.items.forEach((item, index) => {
          console.log(`\nItem ${index + 1}:`);
          console.log('  Menu Item ID:', item.menuItemId);
          console.log('  Name:', item.name);
          console.log('  Quantity:', item.quantity);
          console.log('  Notes:', item.notes);
          console.log('  Selected Subcategory:', item.selectedSubcategory);
          console.log('  Vendor:', item.vendorName);
          console.log('  Image:', item.image);
        });
      } else {
        console.log('📭 Cart is empty');
      }
    }

    // Check the specific user from API test
    if (specificUser) {
      console.log('\n🎯 Specific user from API test:');
      console.log('User ID:', specificUser._id);
      console.log('Email:', specificUser.email);
      console.log('Name:', specificUser.name);
      console.log('Account Verified:', specificUser.accountVerified);

      console.log('\n🛒 API Test User Cart details:');
      console.log('Cart exists:', !!specificUser.cart);
      console.log('Cart items count:', specificUser.cart?.items?.length || 0);

      if (specificUser.cart && specificUser.cart.items && specificUser.cart.items.length > 0) {
        console.log('\n📦 API Test User Cart items:');
        specificUser.cart.items.forEach((item, index) => {
          console.log(`\nItem ${index + 1}:`);
          console.log('  Menu Item ID:', item.menuItemId);
          console.log('  Name:', item.name);
          console.log('  Quantity:', item.quantity);
          console.log('  Notes:', item.notes);
          console.log('  Selected Subcategory:', item.selectedSubcategory);
          console.log('  Vendor:', item.vendorName);
        });
      } else {
        console.log('📭 API Test User Cart is empty');
      }
    } else {
      console.log('\n❌ Specific user from API test not found');
    }

    console.log('\n✅ Database verification completed');

  } catch (error) {
    console.error('❌ Database verification failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the verification
verifyCartInDatabase();
