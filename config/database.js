const mongoose = require("mongoose");

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/marketplace";

    await mongoose.connect(mongoURI);

    console.log("📁 Connected to MongoDB database");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = { connectDB };

