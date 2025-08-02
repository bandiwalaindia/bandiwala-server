// Script to clear test users from database
import mongoose from 'mongoose';
import { User } from '../models/usermodel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

async function clearTestUsers() {
  try {
    // Connect to database
    const mongoUrl = process.env.MONGO_URL || 'mongodb+srv://karthikbandiwala:karthik123@cluster0.aqhqe.mongodb.net/bandiwala?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to database');
    
    // Delete test users (users with test emails or unverified accounts)
    const result = await User.deleteMany({
      $or: [
        { email: { $regex: /test|example\.com|vnrvjiet\.in/i } },
        { accountVerified: false },
        { phone: { $regex: /\+918688660/ } }
      ]
    });
    
    console.log(`🗑️ Deleted ${result.deletedCount} test users`);
    
    // List remaining users
    const remainingUsers = await User.find({}, 'name email phone accountVerified').limit(10);
    console.log('\n📋 Remaining users:');
    remainingUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Verified: ${user.accountVerified}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Database cleanup completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

clearTestUsers();
