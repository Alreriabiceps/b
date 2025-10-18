const mongoose = require("mongoose");

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

module.exports = mongoose.model("Service", serviceSchema);

