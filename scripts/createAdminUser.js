import { config } from 'dotenv';
import { connection } from '../database/dbconnection.js';
import { User } from '../models/usermodel.js';

// Load environment variables
config({ path: './config.env' });

async function createAdminUser() {
  try {
    // Connect to database
    await connection();
    console.log('📦 Connected to database');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      phone: '+918688660055'
    });

    if (existingAdmin) {
      console.log('👤 Admin user found');
      console.log('📧 Email:', existingAdmin.email);
      console.log('📱 Phone:', existingAdmin.phone);
      console.log('🔑 Role:', existingAdmin.role);

      // Update to admin role if not already
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        existingAdmin.accountVerified = true;
        existingAdmin.isApproved = true;
        existingAdmin.isBlocked = false;
        await existingAdmin.save();
        console.log('🔄 Updated user role to admin');
      }

      process.exit(0);
    }

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@bandiwala.com',
      phone: '+918688660055',
      password: 'plplplpl',
      role: 'admin',
      accountVerified: true,
      isApproved: true,
      isBlocked: false
    });

    console.log('✅ Admin user created successfully!');
    console.log('👤 Name:', adminUser.name);
    console.log('📧 Email:', adminUser.email);
    console.log('📱 Phone:', adminUser.phone);
    console.log('🔑 Role:', adminUser.role);
    console.log('🔐 Password: plplplpl');
    console.log('\n🚀 You can now use these credentials to test admin APIs');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
