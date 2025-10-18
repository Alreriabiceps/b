const express = require("express");
const {
  authenticateToken,
  requireServiceProvider,
} = require("../middleware/auth");
const {
  createBusiness,
  getBusinessByUserId,
  createService,
  getServicesByBusinessId,
} = require("../services/businessService");

const router = express.Router();

// Register business (service providers only)
router.post(
  "/register",
  authenticateToken,
  requireServiceProvider,
  async (req, res) => {
    try {
      const {
        businessName,
        businessType,
        description,
        address,
        city,
        state,
        zipCode,
        phone,
        email,
        website,
        licenseNumber,
        yearsInBusiness,
      } = req.body;

      // Check if business already exists for this user
      const existingBusiness = await getBusinessByUserId(req.user.id);
      if (existingBusiness) {
        return res
          .status(409)
          .json({ error: "Business already registered for this user" });
      }

      // Create business
      const business = await createBusiness({
        userId: req.user.id,
        businessName,
        businessType,
        description,
        address,
        city,
        state,
        zipCode,
        phone,
        email,
        website,
        licenseNumber,
        yearsInBusiness,
      });

      res.status(201).json({
        message: "Business registered successfully",
        business,
      });
    } catch (error) {
      console.error("Business registration error:", error);
      res.status(500).json({ error: "Business registration failed" });
    }
  }
);

// Get business profile
router.get(
  "/profile",
  authenticateToken,
  requireServiceProvider,
  async (req, res) => {
    try {
      const business = await getBusinessByUserId(req.user.id);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }

      res.json(business);
    } catch (error) {
      console.error("Get business profile error:", error);
      res.status(500).json({ error: "Failed to get business profile" });
    }
  }
);

// Add service to business
router.post(
  "/services",
  authenticateToken,
  requireServiceProvider,
  async (req, res) => {
    try {
      const {
        categoryId,
        serviceName,
        description,
        basePrice,
        priceUnit,
        estimatedDuration,
        durationUnit,
        isEmergency,
      } = req.body;

      // Get business ID for the user
      const business = await getBusinessByUserId(req.user.id);
      if (!business) {
        return res.status(404).json({
          error: "Business not found. Please register your business first.",
        });
      }

      // Create service
      const service = await createService({
        businessId: business.id,
        categoryId,
        serviceName,
        description,
        basePrice,
        priceUnit,
        estimatedDuration,
        durationUnit,
        isEmergency,
      });

      res.status(201).json({
        message: "Service added successfully",
        service,
      });
    } catch (error) {
      console.error("Add service error:", error);
      res.status(500).json({ error: "Failed to add service" });
    }
  }
);

// Get business services
router.get(
  "/services",
  authenticateToken,
  requireServiceProvider,
  async (req, res) => {
    try {
      const business = await getBusinessByUserId(req.user.id);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }

      const services = await getServicesByBusinessId(business.id);
      res.json(services);
    } catch (error) {
      console.error("Get services error:", error);
      res.status(500).json({ error: "Failed to get services" });
    }
  }
);

module.exports = router;









