import mongoose from "mongoose";
import dotenv from "dotenv";
import MenuItem from "../models/MenuItem.js";
import { generateMenuItemSlug, ensureUniqueSlug } from "../utils/slugUtils.js";

// Load environment variables
dotenv.config({ path: "./config.env" });

const addSlugsToMenuItems = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get all menu items that don't have slugs
    const menuItems = await MenuItem.find({ slug: { $exists: false } });
    console.log(`Found ${menuItems.length} menu items without slugs`);

    let updatedCount = 0;

    for (const item of menuItems) {
      try {
        // Generate base slug from item name
        const baseSlug = generateMenuItemSlug(item.name);

        // Ensure uniqueness by checking if slug already exists
        const checkExists = async (slug) => {
          const existing = await MenuItem.findOne({ slug });
          return !!existing;
        };

        const uniqueSlug = await ensureUniqueSlug(baseSlug, checkExists);

        // Update the item with the slug
        await MenuItem.findByIdAndUpdate(item._id, { slug: uniqueSlug });

        console.log(`Updated "${item.name}" with slug: "${uniqueSlug}"`);
        updatedCount++;
      } catch (error) {
        console.error(`Error updating item "${item.name}":`, error.message);
      }
    }

    console.log(`\nSuccessfully updated ${updatedCount} menu items with slugs`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Run the script
addSlugsToMenuItems();
