const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  repoName: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  feedback: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Review", reviewSchema);