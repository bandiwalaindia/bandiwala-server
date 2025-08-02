import mongoose from 'mongoose';
import { User } from '../models/usermodel.js';
import { connection } from '../database/dbconnection.js';

const createTestUser = async () => {
  try {
    // Connect to MongoDB
    await connection();
    console.log('✅ Connected to MongoDB');

    // Create a new test user with a unique phone number
    const testUserData = {
      name: 'Test User Promo',
      email: 'testpromo@example.com',
      phone: '+919999999999',
      password: 'testpass123',
      role: 'user',
      accountVerified: true,
      isApproved: true,
      isBlocked: false
    };

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: testUserData.email },
        { phone: testUserData.phone }
      ]
    });

    if (existingUser) {
      console.log('✅ Test user already exists');
      console.log('📧 Email:', existingUser.email);
      console.log('📱 Phone:', existingUser.phone);
      console.log('🆔 ID:', existingUser._id);
      console.log('🔐 Password: testpass123');
      process.exit(0);
    }

    // Create the test user
    const testUser = await User.create(testUserData);
    console.log('✅ Test user created successfully!');
    console.log('👤 Name:', testUser.name);
    console.log('📧 Email:', testUser.email);
    console.log('📱 Phone:', testUser.phone);
    console.log('🆔 ID:', testUser._id);
    console.log('🔐 Password: testpass123');
    console.log('\n🚀 You can now use these credentials to test the FREESHIP3 promo code');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
};

createTestUser();
