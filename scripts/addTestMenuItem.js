import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MenuItem from '../models/MenuItem.js';
import Vendor from '../models/Vendor.js';
import { generateMenuItemSlug } from '../utils/slugUtils.js';

// Load environment variables
dotenv.config({ path: './config.env' });

const addTestMenuItem = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    // Get the first vendor
    const vendor = await Vendor.findOne();
    if (!vendor) {
      console.log('No vendor found. Please seed the database first.');
      return;
    }

    console.log(`Using vendor: ${vendor.name}`);

    // Create a test menu item with slug
    const testItem = {
      name: "Test Pav Bhaji",
      slug: generateMenuItemSlug("Test Pav Bhaji"),
      description: "A delicious test pav bhaji with spicy mashed vegetables",
      plate: "full",
      price: 75,
      image: "/images/pav_bhaji.jpg",
      vendorId: vendor._id,
      category: "Test Items",
      isAvailable: true
    };

    // Check if item already exists
    const existingItem = await MenuItem.findOne({ slug: testItem.slug });
    if (existingItem) {
      console.log(`Test item with slug "${testItem.slug}" already exists`);
      console.log(`Item ID: ${existingItem._id}`);
      console.log(`You can test it at: http://localhost:3001/items/${testItem.slug}`);
      return;
    }

    // Create the test item
    const createdItem = await MenuItem.create(testItem);
    console.log(`Created test menu item: ${createdItem.name}`);
    console.log(`Slug: ${createdItem.slug}`);
    console.log(`Item ID: ${createdItem._id}`);
    console.log(`You can test it at: http://localhost:3001/items/${createdItem.slug}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the script
addTestMenuItem();
