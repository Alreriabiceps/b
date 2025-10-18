const { ServiceRequest, ServiceMatch } = require("../models");

// Service request operations
const createServiceRequest = async (requestData) => {
  try {
    const serviceRequest = new ServiceRequest({
      client_id: requestData.clientId,
      title: requestData.title,
      description: requestData.description,
      image_url: requestData.imageUrl,
      ai_analysis: requestData.aiAnalysis,
      detected_service_category: requestData.detectedServiceCategory,
      location: requestData.location,
      urgency: requestData.urgency,
      budget_min: requestData.budgetMin,
      budget_max: requestData.budgetMax,
    });
    const savedRequest = await serviceRequest.save();
    return {
      id: savedRequest._id,
      ...requestData,
    };
  } catch (error) {
    throw error;
  }
};

const getServiceRequestsByClientId = async (clientId) => {
  try {
    return await ServiceRequest.find({ client_id: clientId }).sort({
      created_at: -1,
    });
  } catch (error) {
    throw error;
  }
};

// Service matching operations
const findMatchingServices = async (category, location) => {
  try {
    return await Service.find()
      .populate({
        path: "business_id",
        match: { city: new RegExp(location, "i") },
      })
      .populate("category_id")
      .lean();
  } catch (error) {
    throw error;
  }
};

const createServiceMatch = async (matchData) => {
  try {
    const serviceMatch = new ServiceMatch({
      request_id: matchData.requestId,
      business_id: matchData.businessId,
      service_id: matchData.serviceId,
      estimated_cost: matchData.estimatedCost,
      estimated_time: matchData.estimatedTime,
      time_unit: matchData.timeUnit,
      match_score: matchData.matchScore,
    });
    const savedMatch = await serviceMatch.save();
    return {
      id: savedMatch._id,
      ...matchData,
    };
  } catch (error) {
    throw error;
  }
};

const getServiceMatchesByRequestId = async (requestId) => {
  try {
    return await ServiceMatch.find({ request_id: requestId })
      .populate("business_id", "business_name city state phone email")
      .populate("service_id", "service_name description")
      .sort({ match_score: -1 });
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createServiceRequest,
  getServiceRequestsByClientId,
  findMatchingServices,
  createServiceMatch,
  getServiceMatchesByRequestId,
};









