const express = require('express');
const multer = require('multer');
const userSchema = require('../models/User');
const router = express.Router();
const path = require('path');
const { redisClient } = require('../apps.js');

const getConnection = require('../utils/dbConnection');
// multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

//adding new user
router.post('/newUser', upload.single('photo'), async (req, res) => {
  console.log("inside register user")
  //console.log("req.file:", req.file);
  try {
    let {
      firstname, lastname, email, password,
      mobile, dob, gender, selectedCourses, selectedStandards
    } = req.body;
    console.log("selectedCourse from req.body:", selectedCourses);
console.log("selectedStandard from req.body:", selectedStandards);
// const verified = await redisClient.get(`otp:verified:${email}`);
//     if (!verified) {
//       return res.status(400).json({ error: "Please verify your email with OTP before registering." });
//     }

 selectedCourses = JSON.parse(selectedCourses || "[]");
    selectedStandards = JSON.parse(selectedStandards || "[]");
let courseMap = {};
    selectedCourses.forEach(course => {
      courseMap[course] = [...selectedStandards]; // copy array
    });
    // Handle "both" case first
// if (selectedCourse === 'Both') {
//   selectedCourse = ['NEET', 'JEE'];
// } else {
//   selectedCourse = Array.isArray(selectedCourse)
//     ? selectedCourse
//     : selectedCourse ? [selectedCourse] : [];
// }

// if (selectedStandard === 'Both (11th + 12th)') {
//   selectedStandard = ['11', '12'];
// } else {
//   selectedStandard = Array.isArray(selectedStandard)
//     ? selectedStandard
//     : selectedStandard ? [selectedStandard] : [];
// }
console.log(courseMap)
 const dbName = "studentUsers" // 👈 e.g., jee, neet, etc.
    const connection = await getConnection(dbName);
    const User = connection.model('studentUserDetail', userSchema,'studentUserDetail'); 
      let photoUrl = null;
   if (req.file) {
  const baseUrl = req.protocol + '://' + req.get('host');
  photoUrl = `${baseUrl}/uploads/${req.file.filename}`;
}
  
    const newUser = new User({
      firstname,
      lastname,
      email,
      password,
      mobile, 
      dob,
      gender,
      selectedCourse: courseMap,
      photo:photoUrl,
      isVerified:true
    });

    await newUser.save();
     //await redisClient.del(`otp:verified:${email}`);
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

module.exports = router;
