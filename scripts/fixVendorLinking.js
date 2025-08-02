import mongoose from 'mongoose';
import { User } from '../models/usermodel.js';
import Vendor from '../models/Vendor.js';
import { config } from 'dotenv';

config({ path: './config.env' });

async function fixVendorLinking() {
  try {
    const URI = process.env.MONGO_URL || 'mongodb+srv://bandiwala:karthik@bandiwala.lyx1xbj.mongodb.net/bandiwala?retryWrites=true&w=majority';
    await mongoose.connect(URI);
    console.log('✅ Connected to database');

    // Find the first vendor user (Jai Bhavani Chat Owner)
    const jaiBhavaniUser = await User.findOne({ phone: '+919876543210', role: 'vendor' });
    if (!jaiBhavaniUser) {
      console.log('❌ Jai Bhavani user not found');
      process.exit(1);
    }

    // Find the Jai Bhavani vendor
    const jaiBhavaniVendor = await Vendor.findOne({ name: 'Jai Bhavani Chat Bhandar' });
    if (!jaiBhavaniVendor) {
      console.log('❌ Jai Bhavani vendor not found');
      process.exit(1);
    }

    // Link them
    jaiBhavaniVendor.userId = jaiBhavaniUser._id;
    await jaiBhavaniVendor.save();

    console.log('✅ Successfully linked Jai Bhavani Chat Bhandar to user');
    console.log('   User ID:', jaiBhavaniUser._id);
    console.log('   Vendor ID:', jaiBhavaniVendor._id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixVendorLinking();
