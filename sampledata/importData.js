import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { seedData } from "./seedData.js";
import Vendor from "../models/Vendor.js";
import MenuItem from "../models/MenuItem.js";
import PromoCode from "../models/PromoCode.js";
import { User } from "../models/usermodel.js";

// Set up environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../config.env") });

async function importData() {
  try {
    const mongoURI = process.env.MONGODB_URI;

    await mongoose.connect(mongoURI);

    console.log("Connected to MongoDB", mongoURI);

    await Promise.all([
      Vendor.deleteMany({}),
      MenuItem.deleteMany({}),
      PromoCode.deleteMany({}),
      User.deleteMany({}),
    ]);

    console.log("Cleared existing data");

    // Seed the database with sample data
    await seedData();

    console.log("Database seeding completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

// Run the import function
importData();
