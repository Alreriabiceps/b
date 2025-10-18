const express = require("express");
const { upload } = require("../middleware/upload");
const { processServiceRequest } = require("../services/serviceMatchingService");
const { getAllServiceCategories } = require("../services/businessService");
const fs = require("fs");

const router = express.Router();

// Anonymous image analysis (no authentication required)
router.post("/analyze-image", upload.single("image"), async (req, res) => {
  try {
    const {
      title = "Anonymous Service Request",
      description = "Analyze this image and find matching service providers",
      location = "Not specified",
      urgency = "normal",
    } = req.body;

    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Image is required for service analysis" });
    }

    console.log(
      "📸 Processing anonymous image analysis with enhanced MVP system:",
      req.file.filename
    );

    // Process service request with enhanced AI analysis
    const result = await processServiceRequest(
      {
        clientId: null, // Anonymous request
        title,
        description,
        imageUrl: req.file.path,
        location,
        urgency,
        budgetMin: null,
        budgetMax: null,
      },
      req.file.path
    );

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: "Enhanced image analysis completed successfully",
      request: { id: "anonymous", anonymous: true },

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

      // Service provider matches (only if providers exist)
      matchingProviders: result.hasProviders
        ? result.providers.map((provider) => ({
            ...provider,
            // Include real pricing data if available
            estimated_cost_range: result.estimates
              ? {
                  min: result.estimates.costMin,
                  max: result.estimates.costMax,
                  average: result.estimates.costAverage,
                  currency: result.estimates.currency,
                }
              : null,
            estimated_time_range: result.estimates
              ? {
                  min: result.estimates.timeMin,
                  max: result.estimates.timeMax,
                  average: result.estimates.timeAverage,
                  unit: result.estimates.timeUnit,
                }
              : null,
          }))
        : [],

      totalMatches: result.providerCount,
      hasProviders: result.hasProviders,

      // Additional MVP data
      serviceCategory: result.analysis.detectedDevice,
      repairDifficulty: result.estimates?.difficulty || "Unknown",

      // Summary for user
      summary: {
        item: result.detectedItem || "Unknown Device",
        problem: result.detectedProblem || "General Issue",
        brand: result.detectedBrand || "Unknown Brand",
        severity: result.severity || "Moderate",
        estimatedCost: result.estimates
          ? `PHP ${result.estimates.costMin} - ${result.estimates.costMax} (based on ${result.estimates.providerCount} providers)`
          : "No providers available - quote needed",
        estimatedTime: result.estimates
          ? `${result.estimates.timeMin} - ${result.estimates.timeMax} ${result.estimates.timeUnit}`
          : "No providers available - time varies",
        difficulty: result.estimates?.difficulty || "Unknown",
        providersFound: result.providerCount,
        message: result.hasProviders
          ? `Found ${result.providerCount} service providers for this repair`
          : "No service providers found for this type of repair. The AI analysis is still available above.",
      },
    });
  } catch (error) {
    console.error("Anonymous image analysis error:", error);

    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: "Failed to analyze image" });
  }
});

// Get all service categories
router.get("/service-categories", async (req, res) => {
  try {
    const categories = await getAllServiceCategories();
    res.json(categories);
  } catch (error) {
    console.error("Get service categories error:", error);
    res.status(500).json({ error: "Failed to get service categories" });
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    service: "Marketplace Backend",
  });
});

// Debug endpoint
router.get("/debug/config", (req, res) => {
  res.json({
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    mongodbConfigured: !!process.env.MONGODB_URI,
    uploadsDir: fs.existsSync("uploads"),
    timestamp: new Date().toISOString(),
  });
});

// Legacy image analysis endpoint (for backwards compatibility)
router.post(
  "/vision/describe-image",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "Gemini API key not configured",
          message: "Please add your GEMINI_API_KEY to the .env file",
        });
      }

      console.log("🔍 Legacy image analysis:", req.file.filename);

      // Read the image file and convert to base64
      const imageData = fs.readFileSync(req.file.path);
      const base64Image = imageData.toString("base64");

      // Prepare the request for Gemini API
      const requestData = {
        contents: [
          {
            parts: [
              {
                text: "Analyze this image and provide a detailed description of what you see. Include objects, people, settings, actions, colors, and any other notable details.",
              },
              {
                inline_data: {
                  mime_type: req.file.mimetype,
                  data: base64Image,
                },
              },
            ],
          },
        ],
      };

      // Make request to Gemini API
      const axios = require("axios");
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      // Extract the analysis from the response
      const analysis = response.data.candidates[0].content.parts[0].text;

      console.log("✅ Legacy analysis successful");

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        text: analysis,
        filename: req.file.filename,
        filesize: req.file.size,
        service: "Google Gemini Vision",
      });
    } catch (error) {
      console.error(
        "❌ Legacy vision API error:",
        error.response?.data || error.message
      );

      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      if (error.response?.status === 400) {
        return res.status(400).json({
          error: "Invalid API request",
          message: "Check your Gemini API key and request format",
        });
      }

      if (error.response?.status === 403) {
        return res.status(403).json({
          error: "Gemini API access denied",
          message: "Your API key may not have access to Gemini Vision API",
        });
      }

      res.status(500).json({
        error: "Vision analysis failed",
        message: "Failed to analyze image with Gemini API",
      });
    }
  }
);

module.exports = router;
