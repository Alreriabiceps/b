const mongoose = require("mongoose");

// ServiceProvider Schema - for users who offer services
const serviceProviderSchema = new mongoose.Schema({
  // Basic user info
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  phone: { type: String, required: true },
  
  // Business information
  business_name: { type: String, required: true },
  business_type: { 
    type: String, 
    enum: ["individual", "company", "cooperative"], 
    default: "individual" 
  },
  
  // Business address
  business_address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip_code: { type: String, required: true },
    country: { type: String, default: "Philippines" }
  },
  
  // Service area
  service_areas: [{
    city: { type: String, required: true },
    state: { type: String, required: true },
    radius_km: { type: Number, default: 10 }
  }],
  
  // Professional information
  years_experience: { type: Number, default: 0 },
  certifications: [{
    name: { type: String },
    issuing_organization: { type: String },
    issue_date: { type: Date },
    expiry_date: { type: Date }
  }],
  
  // Business details
  business_license: { type: String },
  tax_id: { type: String },
  insurance_info: {
    provider: { type: String },
    policy_number: { type: String },
    expiry_date: { type: Date }
  },
  
  // Availability
  availability: {
    monday: { start: String, end: String, available: { type: Boolean, default: true } },
    tuesday: { start: String, end: String, available: { type: Boolean, default: true } },
    wednesday: { start: String, end: String, available: { type: Boolean, default: true } },
    thursday: { start: String, end: String, available: { type: Boolean, default: true } },
    friday: { start: String, end: String, available: { type: Boolean, default: true } },
    saturday: { start: String, end: String, available: { type: Boolean, default: false } },
    sunday: { start: String, end: String, available: { type: Boolean, default: false } }
  },
  
  // Emergency services
  emergency_available: { type: Boolean, default: false },
  emergency_surcharge: { type: Number, default: 0 },
  
  // Account status
  is_verified: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  verification_status: { 
    type: String, 
    enum: ["pending", "verified", "rejected"], 
    default: "pending" 
  },
  
  // Rating and reviews
  rating: { type: Number, default: 0 },
  total_reviews: { type: Number, default: 0 },
  
  // Timestamps
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  last_login: { type: Date }
});

// Update the updated_at field before saving
serviceProviderSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model("ServiceProvider", serviceProviderSchema);









