const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "can't be blank"],
      },
      mobno: {
        type: Number,
        match: /^\d{10}$/, // This regex matches exactly 10 digits
        required: [true, "Mobile number is required"],
        unique: true,
      },
      username: {
        type: String,
        lowercase: true,
        required: [true, "can't be blank"],
        index: true,
        unique: true,
      },
      email: {
        type: String,
        lowercase: true,
        required: [true, "can't be blank"],
        match: [/\S+@\S+\.\S+/, "is invalid"],
        index: true,
      },
      gender: String,
      school: String,
      course: String,
      degree: String,
      passout: Number,
      currentYear: Number,
      linkedProfile: String,
      github: String,
      skills: [String],
      pastProjects: [String],
      country: String,
      password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"],
      },
      confirmPassword: String,
});

module.exports = mongoose.model("Student", studentSchema);
