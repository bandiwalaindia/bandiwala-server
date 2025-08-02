import mongoose from 'mongoose';
import { User } from '../models/usermodel.js';
import { config } from 'dotenv';

// Load environment variables
config({ path: './config.env' });

const createDeliveryPartner = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to database');

    // Check if delivery partner already exists
    const existingDeliveryPartner = await User.findOne({ 
      phone: '+919876543219',
      role: 'deliveryPartner' 
    });

    if (existingDeliveryPartner) {
      console.log('Delivery partner already exists:', existingDeliveryPartner.name);
      process.exit(0);
    }

    // Create mock delivery partner
    const deliveryPartner = new User({
      name: 'Mock Delivery Partner',
      email: 'delivery@bandiwala.com',
      phone: '+919876543219',
      password: '12345678',
      role: 'deliveryPartner',
      accountVerified: true,
      address: 'Delivery Hub, Bandiwala City',
      location: {
        coordinates: {
          lat: 12.9716,
          lng: 77.5946
        },
        formattedAddress: 'Delivery Hub, Bandiwala City, Karnataka, India'
      },
      deliveryPartnerData: {
        isAvailable: true,
        vehicleType: 'bike',
        vehicleNumber: 'KA01AB1234',
        licenseNumber: 'DL123456789',
        totalDeliveries: 0,
        rating: 4.5,
        earnings: 0
      }
    });

    await deliveryPartner.save();
    
    console.log('✅ Mock delivery partner created successfully!');
    console.log('📱 Phone: +919876543219');
    console.log('🔐 Password: 12345678');
    console.log('👤 Name:', deliveryPartner.name);
    console.log('🆔 ID:', deliveryPartner._id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating delivery partner:', error);
    process.exit(1);
  }
};

createDeliveryPartner();
