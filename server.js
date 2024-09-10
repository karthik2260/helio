const express = require('express');
const app = express();
const port = 7000;
const path = require('path');
const nodemailer = require('nodemailer');
const connectDB = require('./server/connection/connection');
const dotenv = require('dotenv');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const auth = require('./server/middleware/auth'); // Ensure this is exporting your passport configuration

const nocache = require('nocache');

// Load environment variables
dotenv.config({ path: 'config.env' });

// Connect to the database
connectDB();

// Set view engine
app.set("view engine", "ejs");

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(nocache());
app.use(session({
  secret: uuidv4(),
  cookie: { maxAge: 3600000 },
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Google authentication route
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/usersignup' }),
  async (req, res) => {
    try {
      const userToken = req.user.userToken;
      req.session.email = req.user.user.email; // Store user email in session
      res.cookie('userToken', userToken); // Set the token cookie
      res.redirect('/'); // Redirect to home page
    } catch (error) {
      console.log(error);
      res.redirect('/error500');
    }
  });

// Static files serving
app.use(express.static(path.join(__dirname, 'assests/video')));
app.use('/assests', express.static(path.join(__dirname, 'assests')));
app.use('/css', express.static(path.join(__dirname, 'assests/css')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/js', express.static(path.join(__dirname, 'assests/js')));

// Route handlers
app.use('/', require('./server/routes/admin'));
app.use('/', require('./server/routes/user'));

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
