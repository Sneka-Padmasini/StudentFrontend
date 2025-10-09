require('dotenv').config({ path: '../.env' }); // ✅ Top of file

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3000;
app.set('trust proxy', 1); 
const session = require('express-session');
const RedisStore = require('connect-redis');
const RedisSessionStore = RedisStore(session);
const Redis = require('ioredis');
app.use(cors({
  origin: ['http://localhost:5173',
  'https://celebrated-eclair-e6ee30.netlify.app',
'https://padmasini.com',
'https://www.padmasini.com'], // 👈 your React app's address
  credentials: true               // 👈 required to accept cookies or headers
}));
app.options('/', cors({
  origin: ['http://localhost:5173',
  'https://celebrated-eclair-e6ee30.netlify.app',
'https://padmasini.com',
'https://www.padmasini.com'],
  credentials: true
}));

const redisClient = new Redis(process.env.REDIS_URL); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());
// const redisClient = new Redis({
//   host: 'localhost', // or your Redis host
//   port: 6379,
//   // password: 'your_password', // if password is set
// });
//console.log('MongoDB URI:', process.env.MONGODB_URI); // ✅ Debug log
app.use(session({
  store: new RedisSessionStore({ client: redisClient }),
  secret: 'your_session_secret', // 🔐 use strong secret in .env
  resave: false,
  saveUninitialized: false,
  cookie: {//change this according to localhosting and deploying 
    secure: true, // Set to true if using HTTPS 
    // for local hosting secure false and samesite:"lax" no doamin is needed
    //for production secure true and same site none 
    httpOnly: true,
    sameSite:'none',//Set none if use true in secure lax if same like s3 and ec2
    
    //domain:'.padmasini.com',
    maxAge: 1000 *60 *60 *24// 1 day
  }
}));
module.exports = {  redisClient };
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection failed:', err));
const forgetPassword=require("./routes/forgetPassword.js")
app.use("/",forgetPassword)
const userRoutes = require('./routes/userRoutes');
app.use('/', userRoutes);
const registerRoutes = require('./routes/register');
app.use('/register', registerRoutes);
// app.get('/', (req, res) => {
//    //req.session.counter = (req.session.counter || 0) + 1;
//   res.send('Welcome to the Node + MongoDB CRUD API');
// });
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
