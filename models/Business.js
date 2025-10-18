const mongoose = require("mongoose");

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

module.exports = mongoose.model("Business", businessSchema);

