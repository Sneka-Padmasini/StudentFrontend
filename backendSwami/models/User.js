const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstname: String,
    lastname: String,
    email: { type: String, unique: true, required: true },
    password: String,
    mobile: String,
    dob: String,
    gender: String,
    // Store mapping like { JEE: ["11th","12th"], NEET: ["12th"] }
    selectedCourse: {
      type: Map,
      of: [String], // array of standards (e.g. ["11th","12th"])
      default: {},
    },
    photo: String, // filename or S3 link
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = userSchema;
