import mongoose from 'mongoose';
import Order from '../models/Order.js';
import { config } from 'dotenv';

// Load environment variables
config({ path: './config.env' });

const checkOrders = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to database');

    // Find all orders
    const allOrders = await Order.find({}).sort({ createdAt: -1 }).limit(10);
    console.log('\n📦 Recent Orders:');
    allOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order ${order.orderNumber}`);
      console.log(`   Status: ${order.orderStatus}`);
      console.log(`   Delivery Partner: ${order.deliveryPartner || 'None'}`);
      console.log(`   Total: ₹${order.total}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log('');
    });

    // Find orders with status 'preparing'
    const preparingOrders = await Order.find({ orderStatus: 'preparing' });
    console.log(`\n🍳 Orders with status 'preparing': ${preparingOrders.length}`);
    preparingOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order ${order.orderNumber}`);
      console.log(`   Delivery Partner: ${order.deliveryPartner || 'None'}`);
      console.log(`   Has deliveryPartner field: ${order.hasOwnProperty('deliveryPartner')}`);
      console.log(`   deliveryPartner value: ${JSON.stringify(order.deliveryPartner)}`);
      console.log('');
    });

    // Test the exact query used in the API
    const availableOrders = await Order.find({
      orderStatus: 'preparing',
      $or: [
        { deliveryPartner: { $exists: false } },
        { deliveryPartner: null }
      ]
    });
    console.log(`\n🚚 Available orders for delivery partners: ${availableOrders.length}`);
    availableOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order ${order.orderNumber}`);
      console.log(`   Total: ₹${order.total}`);
      console.log(`   Customer: ${order.user}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking orders:', error);
    process.exit(1);
  }
};

checkOrders();
