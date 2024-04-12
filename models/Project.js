const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
    industry: String,
    projectdetails: String,
    projectduration: String,
    skills: String,
    outcome: String,
    budget: String,
    timeline: String,
    comments: String,
    company: String
});

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;