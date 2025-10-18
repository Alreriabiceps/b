const express = require("express");
const { authenticateToken, requireClient } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const { processServiceRequest } = require("../services/serviceMatchingService");
const {
  createServiceRequest,
  getServiceRequestsByClientId,
  getServiceMatchesByRequestId,
} = require("../services/serviceRequestService");
const { getAllServiceProviders } = require("../services/businessService");
const fs = require("fs");

const router = express.Router();

// Submit service request with image analysis
router.post(
  "/service-request",
  authenticateToken,
  requireClient,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, description, location, urgency, budgetMin, budgetMax } =
        req.body;

      if (!req.file) {
        return res
          .status(400)
          .json({ error: "Image is required for service analysis" });
      }

      console.log(
        "📸 Processing authenticated service request with enhanced MVP system:",
        req.file.filename
      );

      // Process service request with enhanced AI analysis
      const result = await processServiceRequest(
        {
          clientId: req.user.id,
          title,
          description,
          imageUrl: req.file.path,
          location,
          urgency,
          budgetMin: budgetMin ? parseFloat(budgetMin) : null,
          budgetMax: budgetMax ? parseFloat(budgetMax) : null,
        },
        req.file.path
      );

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        message: "Enhanced service request processed successfully",
        request: result.request,

        // Frontend compatibility
        analysis: {
          analysis: result.analysis.fullAnalysis,
          confidence: result.analysisSuccess ? 0.8 : 0.3,
          detectedCategory: result.analysis.detectedDevice,
        },

        // Enhanced MVP response data
        detectedItem: result.detectedItem,
        detectedProblem: result.detectedProblem,
        detectedBrand: result.detectedBrand,
        severity: result.severity,
        difficulty: result.difficulty,
        estimatedTime: result.estimatedTime,
        analysisSuccess: result.analysisSuccess,
        fallbackUsed: result.fallbackUsed,
        estimates: result.estimates,

        // Service provider matches with enhanced scoring
        matchingProviders: result.providers.map((provider) => ({
          ...provider,
          // Include dynamic pricing if available
          estimated_cost_range: result.estimates
            ? {
                min: result.estimates.costMin,
                max: result.estimates.costMax,
                currency: result.estimates.currency,
              }
            : null,
          estimated_time_range: result.estimates
            ? {
                min: result.estimates.timeMin,
                max: result.estimates.timeMax,
                unit: result.estimates.timeUnit,
              }
            : null,
        })),

        totalMatches: result.providers.length,
        serviceMatches: result.matches,

        // Additional MVP data
        serviceCategory: result.analysis.detectedDevice,
        repairDifficulty: result.estimates?.difficulty || "Medium",

        // Summary for user
        summary: {
          item: result.detectedItem || "Unknown Device",
          problem: result.detectedProblem || "General Issue",
          brand: result.detectedBrand || "Unknown Brand",
          severity: result.severity || "Moderate",
          estimatedCost: result.estimates
            ? `PHP ${result.estimates.costMin} - ${result.estimates.costMax}`
            : "Quote needed",
          estimatedTime: result.estimates
            ? `${result.estimates.timeMin} - ${result.estimates.timeMax} ${result.estimates.timeUnit}`
            : "Time varies",
          difficulty: result.estimates?.difficulty || "Medium",
          providersFound: result.providers.length,
          averageMatchScore: result.matches
            ? (
                result.matches.reduce(
                  (sum, match) => sum + match.matchScore,
                  0
                ) / result.matches.length
              ).toFixed(2)
            : null,
        },
      });
    } catch (error) {
      console.error("Service request error:", error);

      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({ error: "Failed to process service request" });
    }
  }
);

// Get client's service requests
router.get(
  "/service-requests",
  authenticateToken,
  requireClient,
  async (req, res) => {
    try {
      const requests = await getServiceRequestsByClientId(req.user.id);
      res.json(requests);
    } catch (error) {
      console.error("Get service requests error:", error);
      res.status(500).json({ error: "Failed to get service requests" });
    }
  }
);

// Get service matches for a request
router.get(
  "/service-request/:id/matches",
  authenticateToken,
  requireClient,
  async (req, res) => {
    try {
      const { id } = req.params;
      const matches = await getServiceMatchesByRequestId(id);
      res.json(matches);
    } catch (error) {
      console.error("Get service matches error:", error);
      res.status(500).json({ error: "Failed to get service matches" });
    }
  }
);

// Get all service providers (for client browsing)
router.get(
  "/service-providers",
  authenticateToken,
  requireClient,
  async (req, res) => {
    try {
      const providers = await getAllServiceProviders();

      // Group services by business
      const businessMap = new Map();

      providers.forEach((row) => {
        const businessId = row.business_id;

        if (!businessMap.has(businessId)) {
          businessMap.set(businessId, {
            id: businessId,
            business_name: row.business_name,
            business_type: row.business_type,
            description: row.business_description,
            city: row.city,
            state: row.state,
            phone: row.phone,
            email: row.email,
            website: row.website,
            years_in_business: row.years_in_business,
            is_verified: row.is_verified,
            services: [],
          });
        }

        // Add service if it exists
        if (row.service_id) {
          businessMap.get(businessId).services.push({
            id: row.service_id,
            service_name: row.service_name,
            description: row.service_description,
            base_price: row.base_price,
            price_unit: row.price_unit,
            estimated_duration: row.estimated_duration,
            duration_unit: row.duration_unit,
            is_emergency: row.is_emergency,
            category_name: row.category_name,
            category_id: row.category_id,
          });
        }
      });

      const formattedProviders = Array.from(businessMap.values());
      res.json(formattedProviders);
    } catch (error) {
      console.error("Get service providers error:", error);
      res.status(500).json({ error: "Failed to get service providers" });
    }
  }
);

module.exports = router;









