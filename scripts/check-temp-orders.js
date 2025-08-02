import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js';

// Load environment variables
dotenv.config({ path: './config.env' });

const checkTempOrders = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB successfully');

    // Find all orders
    console.log('\nFetching all orders...');
    const orders = await Order.find({}).select('_id orderNumber user createdAt');
    
    console.log(`Found ${orders.length} orders in database`);
    
    if (orders.length === 0) {
      console.log('No orders found in database');
      return;
    }

    // Check for temporary order IDs
    console.log('\nChecking for temporary order IDs...');
    const tempOrders = orders.filter(order => 
      order.orderNumber && order.orderNumber.startsWith('TEMP-')
    );

    if (tempOrders.length > 0) {
      console.log(`\n⚠️  Found ${tempOrders.length} orders with temporary IDs:`);
      tempOrders.forEach(order => {
        console.log(`  - Order ID: ${order._id}`);
        console.log(`    Order Number: ${order.orderNumber}`);
        console.log(`    User: ${order.user}`);
        console.log(`    Created: ${order.createdAt}`);
        console.log('');
      });
    } else {
      console.log('✅ No orders with temporary IDs found');
    }

    // Show sample of regular orders
    console.log('\nSample of regular orders:');
    const regularOrders = orders.filter(order => 
      !order.orderNumber || !order.orderNumber.startsWith('TEMP-')
    ).slice(0, 5);

    if (regularOrders.length > 0) {
      regularOrders.forEach(order => {
        console.log(`  - Order ID: ${order._id}`);
        console.log(`    Order Number: ${order.orderNumber || 'No order number'}`);
        console.log(`    User: ${order.user}`);
        console.log(`    Created: ${order.createdAt}`);
        console.log('');
      });
    }

    // Check for orders without order numbers
    const ordersWithoutNumbers = orders.filter(order => !order.orderNumber);
    if (ordersWithoutNumbers.length > 0) {
      console.log(`\n⚠️  Found ${ordersWithoutNumbers.length} orders without order numbers:`);
      ordersWithoutNumbers.slice(0, 3).forEach(order => {
        console.log(`  - Order ID: ${order._id}`);
        console.log(`    User: ${order.user}`);
        console.log(`    Created: ${order.createdAt}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error checking orders:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the check
checkTempOrders();
