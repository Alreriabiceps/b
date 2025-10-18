const mongoose = require("mongoose");

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

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);

