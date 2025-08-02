import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import { User } from '../models/usermodel.js';

// Load environment variables
dotenv.config({ path: './config.env' });

const testReviews = async () => {
  try {
    // Connect to MongoDB
    const URI = process.env.MONGO_URL || "mongodb+srv://bandiwala:karthik@bandiwala.lyx1xbj.mongodb.net/bandiwala?retryWrites=true&w=majority";
    await mongoose.connect(URI);
    console.log('Connected to MongoDB');

    // Check for existing reviews
    const reviewCount = await Review.countDocuments();
    console.log(`Total reviews in database: ${reviewCount}`);

    // Check for existing orders
    const orderCount = await Order.countDocuments();
    console.log(`Total orders in database: ${orderCount}`);

    // Check for delivered orders
    const deliveredOrderCount = await Order.countDocuments({ orderStatus: 'delivered' });
    console.log(`Delivered orders in database: ${deliveredOrderCount}`);

    // Check for users
    const userCount = await User.countDocuments();
    console.log(`Total users in database: ${userCount}`);

    // Get all users
    const allUsers = await User.find();
    console.log('\nAll users:');
    for (const user of allUsers) {
      console.log(`User: ${user.name} (${user.email}) - Phone: ${user.phone} - ID: ${user._id}`);

      // Check reviews for this user
      const userReviews = await Review.find({ userId: user._id });
      console.log(`  Reviews: ${userReviews.length}`);

      // Check orders for this user
      const userOrders = await Order.find({ user: user._id });
      console.log(`  Orders: ${userOrders.length}`);
      console.log('---');
    }

    // Check for user with phone number +918247696048
    const userWithPhone = await User.findOne({ phone: '+918247696048' });
    if (userWithPhone) {
      console.log(`\nFound user with phone +918247696048:`);
      console.log(`Name: ${userWithPhone.name}, Email: ${userWithPhone.email}, ID: ${userWithPhone._id}`);

      const phoneUserReviews = await Review.find({ userId: userWithPhone._id });
      console.log(`Reviews for this user: ${phoneUserReviews.length}`);
    } else {
      console.log(`\nNo user found with phone +918247696048`);
    }

    // List all reviews with details
    const allReviews = await Review.find().populate('userId', 'name email').populate('targetId');
    console.log('\nAll reviews:');
    allReviews.forEach((review, index) => {
      console.log(`${index + 1}. User: ${review.userId?.name}, Target: ${review.targetType}, Rating: ${review.rating}, Status: ${review.moderationStatus}`);
    });

    // Test getUserReviews logic for bhavishwareddy user
    const bhavishwareddyUser = await User.findOne({ name: 'bhavishwareddy' });
    if (bhavishwareddyUser) {
      console.log(`\nTesting getUserReviews for bhavishwareddy (${bhavishwareddyUser._id}):`);

      // Generate a JWT token for this user
      const jwt = await import('jsonwebtoken');
      const token = jwt.default.sign(
        { id: bhavishwareddyUser._id },
        process.env.JWT_SECRET || 'bandiwala123dfghadfsjtktfgdsaDGFHGJHKJJDSAFGHJ',
        { expiresIn: '7d' }
      );
      console.log(`Generated token for bhavishwareddy: ${token.substring(0, 20)}...`);

      // Simulate the getUserReviews controller logic
      const userReviews = await Review.find({ userId: bhavishwareddyUser._id })
        .populate('targetId')
        .sort({ createdAt: -1 });

      console.log(`Found ${userReviews.length} reviews for bhavishwareddy`);
      userReviews.forEach((review, index) => {
        console.log(`  ${index + 1}. Target: ${review.targetType}, Rating: ${review.rating}, Comment: ${review.comment.substring(0, 50)}...`);
      });

      // Test the API endpoint with this token
      console.log('\nTesting API endpoint with curl...');
      console.log(`curl -X GET "http://localhost:6111/api/reviews/user/my-reviews" -H "Authorization: Bearer ${token}" -H "Content-Type: application/json"`);
    }

    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testReviews();
