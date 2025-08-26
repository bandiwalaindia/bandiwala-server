import mongoose from "mongoose";

export const connection = async () => {
  // Use environment variable first, fallback to local MongoDB for development
  const URI =
    process.env.MONGODB_URI ||
    "mongodb+srv://bandiwala:karthik@bandiwala.lyx1xbj.mongodb.net/bandiwala?retryWrites=true&w=majority";

  try {
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
    mongoose.set("bufferCommands", false);

    await mongoose.connect(URI, options);
    console.log(
      "✅ Connected to database: ",
      URI,
      URI.includes("mongodb+srv") ? "MongoDB Atlas" : "Local MongoDB"
    );

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
    });
  } catch (err) {
    console.error("❌ Failed to connect to database:", err);
    // Don't exit the process, let it retry
    setTimeout(() => {
      console.log("🔄 Retrying database connection...");
      connection();
    }, 5000);
  }
};
