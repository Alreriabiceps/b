const mongoose = require("mongoose");

// Service Match Schema
const serviceMatchSchema = new mongoose.Schema({
  service_request_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceRequest",
    required: true,
  },
  service_provider_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  match_score: { type: Number },
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "accepted", "rejected", "completed"],
  },
  provider_response: { type: String },
  estimated_cost: { type: Number },
  estimated_timeline: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ServiceMatch", serviceMatchSchema);

