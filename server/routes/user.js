const express = require('express');
const route = express.Router();
const usercontrol = require('../controller/user_control/user_controller.js')












// USER Login & Signup
route.get('/login',usercontrol.get_login)
route.get('/usersignup',usercontrol.get_sigin)
route.post('/usersignup',usercontrol.signup)
route.get('/',usercontrol.index)
route.get('/otp',usercontrol.get_otp)
route.post('/otp',usercontrol.get_otp)
route.get('/resend',usercontrol.resend)





//FORGOT
route.get('/forgot',usercontrol.forgot)
route.post('/forgot',usercontrol.post_forgot)
route.post('/forgototp',usercontrol.forgot_verify)
















module.exports = route