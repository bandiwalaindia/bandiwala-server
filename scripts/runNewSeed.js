import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedData } from '../sampledata/newSeedData.js';

// Load environment variables
dotenv.config({ path: './config.env' });

const runSeed = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    // Run the seed data
    await seedData();
    
  } catch (error) {
    console.error('Error running seed:', error);
    process.exit(1);
  }
};

runSeed();
