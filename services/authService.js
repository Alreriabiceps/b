const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Client, ServiceProvider } = require("../models");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Helper functions
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      userType: user.user_type || user.userType,
      user_type: user.user_type || user.userType, // Keep both for compatibility
      firstName: user.first_name || user.firstName,
      lastName: user.last_name || user.lastName,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// User operations
const createUser = async (userData) => {
  try {
    const { userType, ...userInfo } = userData;
    
    let savedUser;
    if (userType === "client") {
      const client = new Client(userInfo);
      savedUser = await client.save();
    } else if (userType === "service_provider") {
      const serviceProvider = new ServiceProvider(userInfo);
      savedUser = await serviceProvider.save();
    } else {
      throw new Error("Invalid user type");
    }
    
    return {
      id: savedUser._id,
      email: savedUser.email,
      userType: userType,
      firstName: savedUser.first_name,
      lastName: savedUser.last_name,
    };
  } catch (error) {
    throw error;
  }
};

const getUserByEmail = async (email) => {
  try {
    // Check in both Client and ServiceProvider collections
    let user = await Client.findOne({ email });
    if (user) {
      return { ...user.toObject(), user_type: "client" };
    }
    
    user = await ServiceProvider.findOne({ email });
    if (user) {
      return { ...user.toObject(), user_type: "service_provider" };
    }
    
    return null;
  } catch (error) {
    throw error;
  }
};

const getUserById = async (id, userType) => {
  try {
    if (userType === "client") {
      return await Client.findById(id);
    } else if (userType === "service_provider") {
      return await ServiceProvider.findById(id);
    } else {
      // Fallback: search in both collections
      let user = await Client.findById(id);
      if (user) {
        return { ...user.toObject(), user_type: "client" };
      }
      
      user = await ServiceProvider.findById(id);
      if (user) {
        return { ...user.toObject(), user_type: "service_provider" };
      }
      
      return null;
    }
  } catch (error) {
    throw error;
  }
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  createUser,
  getUserByEmail,
  getUserById,
};
