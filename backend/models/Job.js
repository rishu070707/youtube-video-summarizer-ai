const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  jobId: String,
  youtubeUrl: String,
  audioUrl: String,
  status: {
    type: String,
    enum: ["processing", "completed", "failed"],
    default: "processing",
  },
  summary: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Job", jobSchema);
