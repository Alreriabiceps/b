const express = require("express");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();

// Import configurations and utilities
const { connectDB } = require("./config/database");
const { initializeDatabase } = require("./utils/databaseInitializer");
const { errorHandler } = require("./middleware/errorHandler");

// Import routes
const authRoutes = require("./routes/auth");
const businessRoutes = require("./routes/business");
const clientRoutes = require("./routes/client");
const generalRoutes = require("./routes/general");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database on startup
connectDB()
  .then(() => {
    return initializeDatabase();
  })
  .then(() => {
    console.log("✅ Database initialized successfully");
  })
  .catch((err) => {
    console.error("❌ Database initialization failed:", err);
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/client", clientRoutes);
app.use("/api", generalRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Marketplace Backend Server running on port ${PORT}`);
  console.log(
    `🔑 Gemini API configured: ${
      process.env.GEMINI_API_KEY ? "✅ Yes" : "❌ No"
    }`
  );
  console.log(`📁 Database: ✅ MongoDB Connected`);
  console.log(
    `📁 Uploads directory: ${
      fs.existsSync("uploads") ? "✅ Ready" : "❌ Will be created"
    }`
  );
  console.log(`💼 Service: Business Marketplace Platform`);
});
