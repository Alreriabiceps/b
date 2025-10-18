const mongoose = require("mongoose");

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/marketplace";

    await mongoose.connect(mongoURI);

    console.log("📁 Connected to MongoDB database");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  user_type: {
    type: String,
    required: true,
    enum: ["service_provider", "client"],
  },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  phone: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Business Schema
const businessSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  business_name: { type: String, required: true },
  business_type: { type: String, required: true },
  description: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  zip_code: { type: String },
  phone: { type: String },
  email: { type: String },
  website: { type: String },
  license_number: { type: String },
  years_in_business: { type: Number },
  logo_url: { type: String },
  is_verified: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Service Category Schema
const serviceCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  keywords: { type: String },
  created_at: { type: Date, default: Date.now },
});

// Service Schema
const serviceSchema = new mongoose.Schema({
  business_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true,
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceCategory",
    required: true,
  },
  service_name: { type: String, required: true },
  description: { type: String },
  base_price: { type: Number },
  price_unit: { type: String },
  estimated_duration: { type: Number },
  duration_unit: { type: String, default: "hours" },
  is_emergency: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Service Request Schema
const serviceRequestSchema = new mongoose.Schema({
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String },
  image_url: { type: String },
  ai_analysis: { type: String },
  detected_service_category: { type: String },
  location: { type: String },
  urgency: { type: String, default: "normal" },
  budget_min: { type: Number },
  budget_max: { type: Number },
  status: {
    type: String,
    default: "open",
    enum: ["open", "matched", "in_progress", "completed", "cancelled"],
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Service Match Schema
const serviceMatchSchema = new mongoose.Schema({
  request_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceRequest",
    required: true,
  },
  business_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true,
  },
  service_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },
  estimated_cost: { type: Number },
  estimated_time: { type: Number },
  time_unit: { type: String, default: "hours" },
  match_score: { type: Number },
  status: {
    type: String,
    default: "suggested",
    enum: ["suggested", "contacted", "accepted", "rejected"],
  },
  created_at: { type: Date, default: Date.now },
});

// Create models
const User = mongoose.model("User", userSchema);
const Business = mongoose.model("Business", businessSchema);
const ServiceCategory = mongoose.model(
  "ServiceCategory",
  serviceCategorySchema
);
const Service = mongoose.model("Service", serviceSchema);
const ServiceRequest = mongoose.model("ServiceRequest", serviceRequestSchema);
const ServiceMatch = mongoose.model("ServiceMatch", serviceMatchSchema);

// Initialize database with default data
const initializeDatabase = async () => {
  try {
    // Insert default service categories if they don't exist
    const categories = [
      {
        name: "Carpentry",
        description: "Wood work, furniture repair, cabinet installation",
        keywords: "door,window,cabinet,furniture,wood,repair,broken",
      },
      {
        name: "Plumbing",
        description: "Pipe repair, fixture installation, leak fixes",
        keywords: "pipe,leak,faucet,toilet,water,drain,plumbing",
      },
      {
        name: "Electrical",
        description: "Wiring, outlet installation, electrical repairs",
        keywords: "wire,outlet,switch,electrical,power,light,circuit",
      },
      {
        name: "Painting",
        description: "Interior and exterior painting services",
        keywords: "paint,wall,ceiling,exterior,interior,color",
      },
      {
        name: "Cleaning",
        description: "House cleaning, deep cleaning, maintenance",
        keywords: "clean,dirty,mess,house,office,maintenance",
      },
      {
        name: "Landscaping",
        description: "Garden maintenance, lawn care, tree services",
        keywords: "garden,lawn,tree,grass,plant,landscape",
      },
      {
        name: "Appliance Repair",
        description: "Fixing household appliances",
        keywords:
          "refrigerator,washer,dryer,dishwasher,oven,microwave,appliance",
      },
      {
        name: "HVAC",
        description: "Heating, ventilation, air conditioning",
        keywords: "air,heating,cooling,ventilation,hvac,temperature",
      },
      {
        name: "Roofing",
        description: "Roof repair and installation",
        keywords: "roof,shingle,leak,gutter,tile",
      },
      {
        name: "Flooring",
        description: "Floor installation and repair",
        keywords: "floor,tile,carpet,hardwood,laminate",
      },
    ];

    for (const category of categories) {
      await ServiceCategory.findOneAndUpdate(
        { name: category.name },
        category,
        { upsert: true }
      );
    }

    console.log("✅ Database initialization complete");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

// Database helper functions
const dbHelpers = {
  // User operations
  createUser: async (userData) => {
    try {
      const user = new User(userData);
      const savedUser = await user.save();
      return {
        id: savedUser._id,
        email: savedUser.email,
        userType: savedUser.user_type,
        firstName: savedUser.first_name,
        lastName: savedUser.last_name,
      };
    } catch (error) {
      throw error;
    }
  },

  getUserByEmail: async (email) => {
    try {
      return await User.findOne({ email });
    } catch (error) {
      throw error;
    }
  },

  getUserById: async (id) => {
    try {
      return await User.findById(id);
    } catch (error) {
      throw error;
    }
  },

  // Business operations
  createBusiness: async (businessData) => {
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
  },

  getBusinessByUserId: async (userId) => {
    try {
      return await Business.findOne({ user_id: userId });
    } catch (error) {
      throw error;
    }
  },

  // Service operations
  createService: async (serviceData) => {
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
  },

  getServicesByBusinessId: async (businessId) => {
    try {
      return await Service.find({ business_id: businessId })
        .populate("category_id", "name")
        .lean();
    } catch (error) {
      throw error;
    }
  },

  // Service category operations
  getAllServiceCategories: async () => {
    try {
      return await ServiceCategory.find().sort({ name: 1 });
    } catch (error) {
      throw error;
    }
  },

  // Service request operations
  createServiceRequest: async (requestData) => {
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
  },

  getServiceRequestsByClientId: async (clientId) => {
    try {
      return await ServiceRequest.find({ client_id: clientId }).sort({
        created_at: -1,
      });
    } catch (error) {
      throw error;
    }
  },

  // Service matching operations
  findMatchingServices: async (category, location) => {
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
  },

  createServiceMatch: async (matchData) => {
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
  },

  getServiceMatchesByRequestId: async (requestId) => {
    try {
      return await ServiceMatch.find({ request_id: requestId })
        .populate("business_id", "business_name city state phone email")
        .populate("service_id", "service_name description")
        .sort({ match_score: -1 });
    } catch (error) {
      throw error;
    }
  },

  // Get all service providers with their services
  getAllServiceProviders: async () => {
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
  },
};

module.exports = {
  connectDB,
  initializeDatabase,
  dbHelpers,
  User,
  Business,
  ServiceCategory,
  Service,
  ServiceRequest,
  ServiceMatch,
};
