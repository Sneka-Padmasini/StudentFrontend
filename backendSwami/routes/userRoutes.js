const express = require('express');
const router = express.Router();
//const getUserModel  = require('../models/dynamicModel');
const getUnitModel = require('../models/getUnitModel');
 const getConnection = require('../utils/dbConnection');
const userSchema = require('../models/User');
//get subject details
router.get('/getSubjectDetails',async(req,res)=>{
  const{courseName,subjectName,standard}=req.query
  console.log(req.session.user)
  try{
    const UnitModel=getUnitModel(courseName,subjectName);
    const units=await UnitModel.find({standard}).lean()
    console.log(units)
    res.json(units)
  }catch(err){
    console.log(err)
    res.status(500).json({error:err.message})
  }
})
//login
router.post('/login', async (req, res) => {
  const { userName, password } = req.body;
  try{
    const db=await getConnection("studentUsers")
    const con=db.model('studentUserDetail',userSchema,"studentUserDetail")
    console.log('Session store:', req.sessionStore.constructor.name);

    const findUser=await con.findOne({email:userName})
    console.log(findUser)
     if (!findUser || findUser.password !== password) {
      return res.json({ message: 'Invalid credentials' });
    }
    if(findUser){
      req.session.user={
        id:findUser._id,
        firstname:findUser.firstname,
        lastname:findUser.lastname,
        email:findUser.email,
        mobile:findUser.mobile,
        dob:findUser.dob,
        gender:findUser.gender,
        selectedCourse:findUser.selectedCourse,
        selectedStandard:findUser.selectedStandard,
        photo:findUser.photo
      }
      return res.json({ message: 'Login successful', user: req.session.user });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
 
});
//logout
router.post('/logout', (req, res) => {
  console.log('user before destroying : ',req.session.user)
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.clearCookie('connect.sid'); // default cookie name
    return res.json({ message: 'Logged out successfully' });
  });
 
  
});
//check session
router.get('/checkSession', (req, res) => {
  if (req.session.user) {
    return res.json({ loggedIn: true, user: req.session.user });
  } else {
    return res.json({ loggedIn: false });
  }
});

module.exports = router;