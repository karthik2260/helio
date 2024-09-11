
const passport = require('passport');
const GoogleStrategy=require('passport-google-oauth20').Strategy
const userModel=require('../model/usermodel')
const jwt=require('jsonwebtoken')
const secretKey = 'your_key';
require('dotenv').config(); // This should be at the top






passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: 'http://www.helio.strangled.net/auth/google/callback'
}, 
async (accessToken, refreshToken, profile, cb) => {
  try {
    // Find the user by email or create a new one
    let user = await userModel.findOne({ email: profile._json.email });

    if (!user) {
      // User does not exist, create a new user
      user = new userModel({
        name: profile._json.name,
        email: profile._json.email,
        googleId: profile.id,
        profilePicture: profile._json.picture,
        // You can add more fields as needed
      });
      await user.save();
    }

    // Generate a JWT token
    const userToken = jwt.sign(
      { email: user.email },
      'your_key', // Use your secret key here
      { expiresIn: '1hr' }
    );

    // Pass the user and token to the callback
    return cb(null, { user, userToken });
  } catch (error) {
    return cb(error, null);
  }
}));

passport.serializeUser(function(user, done) {
  done(null, user.userToken); // Store only the token
});

passport.deserializeUser(async function(token, done) {
  try {
    const decodedToken = jwt.verify(token, 'your_key'); // Verify token
    const user = await userModel.findOne({ email: decodedToken.email });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});