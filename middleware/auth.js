const jwt = require("jsonwebtoken");
const { User } = require("../models");

// JWT secret key (in production, use environment variable)
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is service provider
const requireServiceProvider = (req, res, next) => {
  console.log("🔍 Checking user type for service provider:", req.user);
  // Check both userType and user_type for compatibility
  const userType = req.user.userType || req.user.user_type;
  if (userType !== "service_provider") {
    console.log("❌ Access denied - user type:", userType);
    return res.status(403).json({ error: "Service provider access required" });
  }
  console.log("✅ Service provider access granted");
  next();
};

// Middleware to check if user is client
const requireClient = (req, res, next) => {
  console.log("🔍 Checking user type for client:", req.user);
  // Check both userType and user_type for compatibility
  const userType = req.user.userType || req.user.user_type;
  if (userType !== "client") {
    console.log("❌ Access denied - user type:", userType);
    return res.status(403).json({ error: "Client access required" });
  }
  console.log("✅ Client access granted");
  next();
};

module.exports = {
  authenticateToken,
  requireServiceProvider,
  requireClient,
};









