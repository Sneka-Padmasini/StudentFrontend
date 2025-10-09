const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();
const getConnection = require("../utils/dbConnection");
const userSchema = require("../models/User");
const { redisClient } = require("../apps");
// const getConnection = require('../utils/dbConnection');
// ✅ Send OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
const db = await getConnection("studentUsers");
    const con = db.model("studentUserDetail", userSchema, "studentUserDetail");

    const findUser = await con.findOne({ email });
    console.log(findUser)
    if (findUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Redis with 5 min expiry
    await redisClient.setex(`otp:${email}`, 300, otp);

    // Send email with nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"Padmasini" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your email - OTP",
      html: `<h3>Your OTP is: ${otp}</h3><p>It will expire in 5 minutes.</p>`,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sending OTP" });
  }
});

// ✅ Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

    const storedOtp = await redisClient.get(`otp:${email}`);
    if (!storedOtp) return res.status(400).json({ message: "OTP expired or not found" });

    if (storedOtp !== otp) return res.status(400).json({ message: "Invalid OTP" });
    await redisClient.set(`otp:verified:${email}`, "true", "EX", 600);
    // OTP is valid → delete it so it can’t be reused
    await redisClient.del(`otp:${email}`);

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error verifying OTP" });
  }
});

module.exports = router;
