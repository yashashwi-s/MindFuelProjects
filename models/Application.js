const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  description: String,
  status: {
    type: String,
    enum: ["pending", "wip", "completed"],
    default: "pending",
  },
});

module.exports = mongoose.model("Application", applicationSchema);
