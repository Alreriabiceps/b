const { Business, Service, ServiceCategory } = require("../models");

// Business operations
const createBusiness = async (businessData) => {
  try {
    const business = new Business({
      user_id: businessData.userId,
      business_name: businessData.businessName,
      business_type: businessData.businessType,
      description: businessData.description,
      address: businessData.address,
      city: businessData.city,
      state: businessData.state,
      zip_code: businessData.zipCode,
      phone: businessData.phone,
      email: businessData.email,
      website: businessData.website,
      license_number: businessData.licenseNumber,
      years_in_business: businessData.yearsInBusiness,
    });
    const savedBusiness = await business.save();
    return {
      id: savedBusiness._id,
      ...businessData,
    };
  } catch (error) {
    throw error;
  }
};

const getBusinessByUserId = async (userId) => {
  try {
    return await Business.findOne({ user_id: userId });
  } catch (error) {
    throw error;
  }
};

// Service operations
const createService = async (serviceData) => {
  try {
    const service = new Service({
      business_id: serviceData.businessId,
      category_id: serviceData.categoryId,
      service_name: serviceData.serviceName,
      description: serviceData.description,
      base_price: serviceData.basePrice,
      price_unit: serviceData.priceUnit,
      estimated_duration: serviceData.estimatedDuration,
      duration_unit: serviceData.durationUnit,
      is_emergency: serviceData.isEmergency,
    });
    const savedService = await service.save();
    return {
      id: savedService._id,
      ...serviceData,
    };
  } catch (error) {
    throw error;
  }
};

const getServicesByBusinessId = async (businessId) => {
  try {
    return await Service.find({ business_id: businessId })
      .populate("category_id", "name")
      .lean();
  } catch (error) {
    throw error;
  }
};

// Service category operations
const getAllServiceCategories = async () => {
  try {
    return await ServiceCategory.find().sort({ name: 1 });
  } catch (error) {
    throw error;
  }
};

// Get all service providers with their services
const getAllServiceProviders = async () => {
  try {
    return await Business.aggregate([
      {
        $lookup: {
          from: "services",
          localField: "_id",
          foreignField: "business_id",
          as: "services",
        },
      },
      {
        $lookup: {
          from: "servicecategories",
          localField: "services.category_id",
          foreignField: "_id",
          as: "service_categories",
        },
      },
      {
        $project: {
          business_id: "$_id",
          business_name: 1,
          business_type: 1,
          business_description: "$description",
          city: 1,
          state: 1,
          phone: 1,
          email: 1,
          website: 1,
          years_in_business: 1,
          is_verified: 1,
          services: {
            $map: {
              input: "$services",
              as: "service",
              in: {
                service_id: "$$service._id",
                service_name: "$$service.service_name",
                service_description: "$$service.description",
                base_price: "$$service.base_price",
                price_unit: "$$service.price_unit",
                estimated_duration: "$$service.estimated_duration",
                duration_unit: "$$service.duration_unit",
                is_emergency: "$$service.is_emergency",
                category_id: "$$service.category_id",
                category_name: {
                  $arrayElemAt: [
                    {
                      $map: {
                        input: {
                          $filter: {
                            input: "$service_categories",
                            cond: {
                              $eq: ["$$this._id", "$$service.category_id"],
                            },
                          },
                        },
                        as: "cat",
                        in: "$$cat.name",
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },
    ]);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createBusiness,
  getBusinessByUserId,
  createService,
  getServicesByBusinessId,
  getAllServiceCategories,
  getAllServiceProviders,
};









