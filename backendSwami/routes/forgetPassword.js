// server.js (or routes/auth.js)
const express = require("express");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const userSchema = require("../models/User.js"); // your mongoose model
 const getConnection = require('../utils/dbConnection.js');
const Redis = require('ioredis');
 const router = express.Router();
const { redisClient } = require('../apps.js');
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
const db = await getConnection("studentUsers");
    const con = db.model("studentUserDetail", userSchema, "studentUserDetail");

    const findUser = await con.findOne({ email });
    if (!findUser) {
      return res.json({ message: 'User not found' });
    }

    // generate reset token (valid for 15 mins)
    const token = jwt.sign({ id: findUser._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    await redisClient.set(`reset:${findUser._id}`, token, "EX", 900); // 900s = 15min

    // const resetLink = `http://localhost:5173/reset-password/${token}`; 
    const resetLink = `https://celebrated-eclair-e6ee30.netlify.app/reset-password/${token}`; 
    // https://celebrated-eclair-e6ee30.netlify.app/
    // use frontend URL (adjust if deployed)

    // send email
    const transporter = nodemailer.createTransport({
      service: "gmail", // or smtp
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Padmasini" <${process.env.EMAIL_USER}>`,
      to: findUser.email,
      subject: "Password Reset Request",
      html: `<p>You requested a password reset.</p>
             <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
             <p>This link will expire in 15 minutes.</p>`
    });

    res.json({ message: "Password reset email sent. Please check your inbox." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});


router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const storedToken = await redisClient.get(`reset:${decoded.id}`);
    if (!storedToken || storedToken !== token) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
 const db = await getConnection("studentUsers");
    const con = db.model("studentUserDetail", userSchema, "studentUserDetail");

    const findUser = await con.findById(decoded.id);
    if (!findUser) return res.status(400).json({ message: "Invalid token" });

    findUser.password = newPassword; // hash before saving
    await findUser.save();
const keys = await redisClient.keys("sess:*");
    for (const key of keys) {
      const sessionData = await redisClient.get(key);
      if (sessionData) {
        const sessionObj = JSON.parse(sessionData);
        if (sessionObj.user && sessionObj.user.id === findUser._id.toString()) {
          await redisClient.del(key);
        }
      }
    }
    await redisClient.del(`reset:${findUser._id}`);
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.log(err)
    res.status(400).json({ message: "Invalid or expired token" ,err});
  }
});


module.exports = router;
