const mongoose = require("mongoose");

// Client Schema - for users who need services
const clientSchema = new mongoose.Schema({
  // Basic user info
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  phone: { type: String },
  
  // Client-specific fields
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zip_code: { type: String },
    country: { type: String, default: "Philippines" }
  },
  
  // Preferences
  preferred_contact_method: { 
    type: String, 
    enum: ["phone", "email", "sms"], 
    default: "phone" 
  },
  preferred_language: { 
    type: String, 
    enum: ["en", "fil", "ceb"], 
    default: "en" 
  },
  
  // Service history and preferences
  service_preferences: {
    budget_range: {
      min: { type: Number },
      max: { type: Number }
    },
    preferred_time: {
      weekdays: { type: Boolean, default: true },
      weekends: { type: Boolean, default: false },
      morning: { type: Boolean, default: true },
      afternoon: { type: Boolean, default: true },
      evening: { type: Boolean, default: false }
    }
  },
  
  // Account status
  is_verified: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  
  // Timestamps
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  last_login: { type: Date }
});

// Update the updated_at field before saving
clientSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model("Client", clientSchema);









