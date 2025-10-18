const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const {
  hashPassword,
  comparePassword,
  generateToken,
  createUser,
  getUserByEmail,
  getUserById,
} = require("../services/authService");

const router = express.Router();

// Register new user
router.post("/register", async (req, res) => {
  try {
    const {
      email,
      password,
      userType,
      firstName,
      lastName,
      phone,
      ...additionalData
    } = req.body;

    // Validate required fields
    if (!email || !password || !userType || !firstName || !lastName) {
      return res
        .status(400)
        .json({ error: "All required fields must be provided" });
    }

    // Validate user type
    if (!["service_provider", "client"].includes(userType)) {
      return res.status(400).json({ error: "Invalid user type" });
    }

    // Validate phone number format
    if (phone) {
      const localFormat = /^0\d{10}$/;
      const internationalFormat = /^\+63\d{10}$/;

      if (!localFormat.test(phone) && !internationalFormat.test(phone)) {
        return res.status(400).json({
          error:
            "Phone number must be 11 digits (09613790775) or +63 format (+639613790775)",
        });
      }
    }

    // Validate user type specific required fields
    if (userType === "service_provider") {
      if (!additionalData.business_name || !additionalData.business_address) {
        return res.status(400).json({
          error: "Business name and address are required for service providers",
        });
      }
      if (
        !additionalData.business_address.street ||
        !additionalData.business_address.city ||
        !additionalData.business_address.state ||
        !additionalData.business_address.zip_code
      ) {
        return res.status(400).json({
          error: "Complete business address is required for service providers",
        });
      }
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Prepare user data based on type
    const userData = {
      email,
      password: hashedPassword,
      userType,
      first_name: firstName,
      last_name: lastName,
      phone,
      ...additionalData,
    };

    // Create user
    const newUser = await createUser(userData);

    // Generate token
    console.log("🔐 Creating token for new user:", {
      id: newUser.id,
      email: newUser.email,
      userType: newUser.userType,
    });

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      user_type: newUser.userType,
      first_name: newUser.firstName,
      last_name: newUser.lastName,
    });

    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      userType: newUser.userType,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
    };

    console.log("📤 Sending registration response:", userResponse);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    console.log("🔐 Creating token for login user:", {
      id: user.id,
      email: user.email,
      userType: user.user_type,
    });

    const token = generateToken(user);

    const userResponse = {
      id: user.id,
      email: user.email,
      userType: user.user_type,
      firstName: user.first_name,
      lastName: user.last_name,
    };

    console.log("📤 Sending login response:", userResponse);

    res.json({
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get current user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.user.id, req.user.user_type);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return appropriate fields based on user type
    const baseProfile = {
      id: user._id || user.id,
      email: user.email,
      userType: user.user_type,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      createdAt: user.created_at,
    };

    if (req.user.user_type === "service_provider") {
      res.json({
        ...baseProfile,
        business_name: user.business_name,
        business_type: user.business_type,
        business_address: user.business_address,
        service_areas: user.service_areas,
        years_experience: user.years_experience,
        certifications: user.certifications,
        business_license: user.business_license,
        tax_id: user.tax_id,
        insurance_info: user.insurance_info,
        availability: user.availability,
        emergency_available: user.emergency_available,
        emergency_surcharge: user.emergency_surcharge,
        is_verified: user.is_verified,
        verification_status: user.verification_status,
        rating: user.rating,
        total_reviews: user.total_reviews,
      });
    } else {
      res.json({
        ...baseProfile,
        address: user.address,
        preferred_contact_method: user.preferred_contact_method,
        preferred_language: user.preferred_language,
        service_preferences: user.service_preferences,
        is_verified: user.is_verified,
      });
    }
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Failed to get user profile" });
  }
});

// Logout user (client-side token removal)
router.post("/logout", authenticateToken, (req, res) => {
  res.json({ message: "Logout successful" });
});

module.exports = router;
