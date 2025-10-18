const mongoose = require("mongoose");

// Service Category Schema
const serviceCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  keywords: { type: String },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ServiceCategory", serviceCategorySchema);

