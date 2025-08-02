// Script to clear specific user from database
import mongoose from 'mongoose';
import { User } from '../models/usermodel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

async function clearSpecificUser() {
  try {
    // Connect to database
    const mongoUrl = process.env.MONGO_URL || 'mongodb+srv://karthikbandiwala:karthik123@cluster0.aqhqe.mongodb.net/bandiwala?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to database');
    
    // Delete specific user
    const result = await User.deleteMany({
      $or: [
        { email: 'gurramkarthik2005@gmail.com' },
        { email: 'gurramkarthik006@gmail.com' },
        { phone: '+918688660055' },
        { phone: '8688660055' }
      ]
    });
    
    console.log(`🗑️ Deleted ${result.deletedCount} users with matching email/phone`);
    
    // Verify deletion
    const existingUser = await User.findOne({
      $or: [
        { email: 'gurramkarthik2005@gmail.com' },
        { email: 'gurramkarthik006@gmail.com' },
        { phone: '+918688660055' }
      ]
    });
    
    if (existingUser) {
      console.log('⚠️ User still exists:', existingUser.email, existingUser.phone);
    } else {
      console.log('✅ User successfully removed - ready for fresh registration');
    }
    
    await mongoose.disconnect();
    console.log('✅ Database operation completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

clearSpecificUser();
