import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

const testConnection = async () => {
  try {
    console.log('🔍 Testing database connection...');
    console.log('Using MONGO_URL:', process.env.MONGO_URL ? 'MongoDB Atlas' : 'Not found in env');

    const URI = process.env.MONGO_URL || "mongodb+srv://bandiwala:karthik@bandiwala.lyx1xbj.mongodb.net/bandiwala?retryWrites=true&w=majority";
    console.log('Connection URI type:', URI.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB');

    // Connection options for better reliability
    const options = {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 5, // Maintain a minimum of 5 socket connections
      retryWrites: true,
      retryReads: true,
    };

    // Disable mongoose buffering to prevent timeout issues
    mongoose.set('bufferCommands', false);

    console.log('⏳ Attempting to connect...');
    await mongoose.connect(URI, options);
    console.log('✅ Successfully connected to database!');

    // Test a simple query
    console.log('🔍 Testing database query...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Available collections:', collections.map(c => c.name));

    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Connection closed successfully');

  } catch (error) {
    console.error('❌ Database connection failed:', error);

    if (error.name === 'MongooseServerSelectionError') {
      console.error('💡 This is likely a network connectivity issue or incorrect MongoDB URI');
    }

    process.exit(1);
  }
};

// Run the test
testConnection();
