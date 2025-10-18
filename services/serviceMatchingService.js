const { ServiceMatch } = require("../models");
const { analyzeImageForService } = require("./aiService");

// Calculate cost and time estimates based on real service providers
const calculateRealProviderEstimates = (providers) => {
  if (!providers || providers.length === 0) {
    return null; // No estimates if no providers
  }

  try {
    // Calculate average cost from real providers
    const allPrices = [];
    const allDurations = [];
    let difficulty = "Medium";

    providers.forEach((provider) => {
      if (provider.services && provider.services.length > 0) {
        provider.services.forEach((service) => {
          if (service.base_price) {
            allPrices.push(service.base_price);
          }
          if (service.estimated_duration) {
            allDurations.push(service.estimated_duration);
          }
        });
      }
    });

    if (allPrices.length === 0 || allDurations.length === 0) {
      return null; // No valid pricing data
    }

    // Calculate statistics
    const avgPrice =
      allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);

    const avgDuration =
      allDurations.reduce((sum, duration) => sum + duration, 0) /
      allDurations.length;
    const minDuration = Math.min(...allDurations);
    const maxDuration = Math.max(...allDurations);

    // Determine difficulty based on price range
    const priceRange = maxPrice - minPrice;
    if (priceRange > avgPrice * 0.5) {
      difficulty = "Hard";
    } else if (priceRange < avgPrice * 0.2) {
      difficulty = "Easy";
    }

    console.log("💰 Real provider estimates calculated:", {
      providers: providers.length,
      avgPrice: avgPrice.toFixed(0),
      priceRange: `${minPrice} - ${maxPrice}`,
      avgDuration: avgDuration.toFixed(1),
      durationRange: `${minDuration} - ${maxDuration}`,
      difficulty,
    });

    return {
      costMin: Math.round(minPrice),
      costMax: Math.round(maxPrice),
      costAverage: Math.round(avgPrice),
      timeMin: Math.round(minDuration),
      timeMax: Math.round(maxDuration),
      timeAverage: Math.round(avgDuration),
      timeUnit: "hours",
      difficulty,
      currency: "PHP",
      basedOnRealData: true,
      providerCount: providers.length,
    };
  } catch (error) {
    console.error("❌ Error calculating real provider estimates:", error);
    return null;
  }
};

// Enhanced service category detection
const detectServiceCategory = (analysisText, detectedDevice) => {
  // Use detected device for category mapping
  if (detectedDevice) {
    const deviceLower = detectedDevice.toLowerCase();

    // Direct device-to-category mapping (maps to actual database categories)
    const deviceMapping = {
      tv: "Appliance Repair",
      television: "Appliance Repair",
      "smart tv": "Appliance Repair",
      "led tv": "Appliance Repair",
      "lcd tv": "Appliance Repair",
      "oled tv": "Appliance Repair",
      refrigerator: "Appliance Repair",
      fridge: "Appliance Repair",
      "washing machine": "Appliance Repair",
      washer: "Appliance Repair",
      dryer: "Appliance Repair",
      microwave: "Appliance Repair",
      oven: "Appliance Repair",
      dishwasher: "Appliance Repair",
      "air conditioner": "HVAC",
      aircon: "HVAC",
      "ac unit": "HVAC",
      phone: "Appliance Repair",
      smartphone: "Appliance Repair",
      tablet: "Appliance Repair",
      laptop: "Appliance Repair",
      computer: "Appliance Repair",
    };

    // Check for direct device mapping
    for (const [device, category] of Object.entries(deviceMapping)) {
      if (deviceLower.includes(device)) {
        return category;
      }
    }
  }

  // Fallback to keyword matching in analysis text (using actual database categories)
  const text = analysisText.toLowerCase();
  const serviceKeywords = {
    "Appliance Repair": [
      "tv",
      "television",
      "screen",
      "display",
      "smart tv",
      "led",
      "lcd",
      "oled",
      "refrigerator",
      "washing machine",
      "microwave",
      "oven",
      "dishwasher",
      "dryer",
      "phone",
      "tablet",
      "laptop",
      "computer",
      "electronics",
    ],
    HVAC: [
      "air conditioner",
      "aircon",
      "ac",
      "cooling",
      "hvac",
      "compressor",
      "heating",
      "ventilation",
    ],
    Electrical: [
      "electrical",
      "wiring",
      "outlet",
      "switch",
      "circuit",
      "power",
    ],
    Plumbing: ["plumbing", "pipe", "leak", "faucet", "drain", "water"],
    Painting: ["paint", "wall", "ceiling", "exterior", "interior", "color"],
    Cleaning: ["clean", "dirty", "mess", "house", "office", "maintenance"],
    Landscaping: ["garden", "lawn", "tree", "grass", "plant", "landscape"],
    Roofing: ["roof", "shingle", "leak", "gutter", "tile"],
    Flooring: ["floor", "tile", "carpet", "hardwood", "laminate"],
  };

  let bestMatch = "Appliance Repair";
  let highestScore = 0;

  for (const [category, keywords] of Object.entries(serviceKeywords)) {
    let score = 0;
    keywords.forEach((keyword) => {
      if (text.includes(keyword)) {
        score += 1;
      }
    });

    if (score > highestScore) {
      highestScore = score;
      bestMatch = category;
    }
  }

  return bestMatch;
};

// Find real service providers from database based on detected device and problem
const findRealServiceProviders = async (
  detectedDevice,
  detectedProblem,
  detectedCategory
) => {
  try {
    console.log("🔍 Searching for real service providers for:", {
      detectedDevice,
      detectedProblem,
      detectedCategory,
    });

    const { ServiceProvider, Service } = require("../models");

    // First, find service providers who offer services in the detected category
    const serviceProviders = await ServiceProvider.find({
      is_active: true,
      verification_status: { $in: ["verified", "pending"] },
    }).populate({
      path: "services",
      match: {
        category_name: { $regex: new RegExp(detectedCategory, "i") },
        is_active: true,
      },
    });

    // Filter providers who actually have services in the detected category
    const matchingProviders = serviceProviders.filter(
      (provider) => provider.services && provider.services.length > 0
    );

    console.log(
      `📊 Found ${matchingProviders.length} real service providers for category: ${detectedCategory}`
    );

    // If no providers found, return empty array
    if (matchingProviders.length === 0) {
      console.log(
        "❌ No real service providers found for this service category"
      );
      return [];
    }

    // Format the providers for the response
    const formattedProviders = matchingProviders
      .slice(0, 5)
      .map((provider) => ({
        id: provider._id,
        business_name: provider.business_name,
        business_type: provider.business_type,
        business_address: provider.business_address,
        phone: provider.phone,
        email: provider.email,
        years_experience: provider.years_experience,
        rating: provider.rating || 0,
        total_reviews: provider.total_reviews || 0,
        services: provider.services.map((service) => ({
          service_name: service.service_name,
          category_name: service.category_name,
          base_price: service.base_price,
          price_unit: service.price_unit,
          estimated_duration: service.estimated_duration,
          duration_unit: service.duration_unit,
          description: service.description,
          is_emergency: service.is_emergency,
        })),
        // Calculate average pricing from their services
        average_price:
          provider.services.reduce(
            (sum, service) => sum + (service.base_price || 0),
            0
          ) / provider.services.length,
        // Calculate average duration from their services
        average_duration:
          provider.services.reduce(
            (sum, service) => sum + (service.estimated_duration || 0),
            0
          ) / provider.services.length,
      }));

    console.log(
      `✅ Returning ${formattedProviders.length} real service providers`
    );
    return formattedProviders;
  } catch (error) {
    console.error("❌ Error finding real service providers:", error);
    return [];
  }
};

// Find real service providers from database
const findMatchingProviders = async (
  category,
  detectedProblem,
  location = null,
  detectedDevice = "general"
) => {
  try {
    console.log("🔍 Finding real service providers for:", {
      category,
      detectedProblem,
      location,
      detectedDevice,
    });

    // Use real data from database instead of sample data
    const realProviders = await findRealServiceProviders(
      detectedDevice,
      detectedProblem,
      category
    );

    console.log(
      `✅ Found ${realProviders.length} real service providers for device: ${detectedDevice}`
    );

    // Debug: Log first few providers to see what we found
    if (realProviders.length > 0) {
      console.log("📋 Real service providers found:");
      realProviders.slice(0, 3).forEach((provider, index) => {
        console.log(
          `  ${index + 1}. ${provider.business_name} - ${
            provider.services.length
          } services - Avg: ₱${provider.average_price?.toFixed(0) || "N/A"}`
        );
      });
    } else {
      console.log("❌ No real service providers found for this category");
    }

    return realProviders;
  } catch (error) {
    console.error("❌ Error finding real service providers:", error);
    return []; // Return empty array instead of throwing error
  }
};

// Enhanced service matches creation with dynamic pricing
const createServiceMatches = async (requestId, providers, estimates) => {
  try {
    const matches = [];

    for (const provider of providers) {
      // Calculate enhanced match score
      const matchScore = calculateEnhancedMatchScore(provider, estimates);

      // Use dynamic estimates or provider base pricing
      const estimatedCost = estimates
        ? (estimates.costMin + estimates.costMax) / 2
        : provider.base_price;

      const estimatedTime = estimates
        ? (estimates.timeMin + estimates.timeMax) / 2
        : provider.estimated_duration;

      // Create service match
      const match = await ServiceMatch.create({
        request_id: requestId,
        business_id: provider.business_id || provider.id,
        service_id: provider.id,
        estimated_cost: estimatedCost,
        estimated_time: estimatedTime,
        time_unit: estimates?.timeUnit || provider.duration_unit,
        match_score: matchScore,
      });

      matches.push(match);
    }

    return matches;
  } catch (error) {
    console.error("❌ Error creating enhanced service matches:", error);
    throw error;
  }
};

// Enhanced match scoring
const calculateEnhancedMatchScore = (provider, estimates) => {
  let score = 0.5; // Base score

  // Factor in provider pricing vs. estimated cost
  if (provider.base_price && estimates) {
    const providerPrice = provider.base_price;
    const estimatedPrice = (estimates.costMin + estimates.costMax) / 2;

    // Score higher if provider price is close to estimated cost
    const priceDifference =
      Math.abs(providerPrice - estimatedPrice) / estimatedPrice;
    if (priceDifference < 0.2) score += 0.3;
    else if (priceDifference < 0.5) score += 0.1;
  }

  // Factor in estimated duration
  if (provider.estimated_duration && estimates) {
    const providerTime = provider.estimated_duration;
    const estimatedTime = (estimates.timeMin + estimates.timeMax) / 2;

    // Score higher if provider time is close to estimated time
    const timeDifference =
      Math.abs(providerTime - estimatedTime) / estimatedTime;
    if (timeDifference < 0.3) score += 0.2;
  }

  // Location bonus (if implemented)
  if (provider.city) {
    score += 0.1;
  }

  return Math.max(0, Math.min(1, score));
};

// Enhanced service request processing
const processServiceRequest = async (requestData, imagePath) => {
  try {
    console.log("🚀 Processing enhanced service request...");

    // Step 1: Enhanced AI analysis
    const serviceAnalysis = await analyzeImageForService(imagePath);

    // Step 2: Create service request in database
    let serviceRequest = null;
    if (requestData.clientId) {
      const { createServiceRequest } = require("./serviceRequestService");
      serviceRequest = await createServiceRequest({
        ...requestData,
        aiAnalysis: serviceAnalysis.fullAnalysis,
        detectedServiceCategory: detectServiceCategory(
          serviceAnalysis.fullAnalysis,
          serviceAnalysis.detectedDevice
        ),
      });
    } else {
      serviceRequest = {
        id: "anonymous",
        ...requestData,
        aiAnalysis: serviceAnalysis.fullAnalysis,
        detectedServiceCategory: detectServiceCategory(
          serviceAnalysis.fullAnalysis,
          serviceAnalysis.detectedDevice
        ),
      };
    }

    // Step 3: Find matching providers with enhanced logic
    const detectedCategory = detectServiceCategory(
      serviceAnalysis.fullAnalysis,
      serviceAnalysis.detectedDevice
    );
    const matchingProviders = await findMatchingProviders(
      detectedCategory,
      serviceAnalysis.detectedProblem,
      requestData.location,
      serviceAnalysis.detectedDevice
    );

    // Step 4: Calculate estimates based on real providers (only if providers exist)
    const realEstimates = calculateRealProviderEstimates(matchingProviders);

    // Step 5: Create service matches only if we have real providers
    let matches = null;
    if (
      requestData.clientId &&
      serviceRequest.id !== "anonymous" &&
      matchingProviders.length > 0
    ) {
      matches = await createServiceMatches(
        serviceRequest.id,
        matchingProviders,
        realEstimates
      );
    }

    console.log("✅ Real data service request processed successfully");

    return {
      request: serviceRequest,
      analysis: serviceAnalysis,
      providers: matchingProviders,
      matches,
      // Enhanced response data
      detectedItem: serviceAnalysis.detectedDevice,
      detectedProblem: serviceAnalysis.detectedProblem,
      detectedBrand: serviceAnalysis.detectedBrand,
      severity: serviceAnalysis.severity,
      difficulty: serviceAnalysis.difficulty,
      estimatedTime: serviceAnalysis.estimatedTime,
      analysisSuccess: serviceAnalysis.analysisSuccess,
      fallbackUsed: serviceAnalysis.fallbackUsed,
      estimates: realEstimates, // Only show estimates if real providers exist
      hasProviders: matchingProviders.length > 0,
      providerCount: matchingProviders.length,
    };
  } catch (error) {
    console.error("❌ Error processing enhanced service request:", error);
    throw error;
  }
};

module.exports = {
  calculateRealProviderEstimates,
  detectServiceCategory,
  findRealServiceProviders,
  findMatchingProviders,
  createServiceMatches,
  calculateEnhancedMatchScore,
  processServiceRequest,
};
