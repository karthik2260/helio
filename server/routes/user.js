const express = require('express');
const route = express.Router();
const usercontrol = require('../controller/user_control/user_controller.js')
const product = require('../controller/user_control/category_control.js')











// USER Login & Signup
route.get('/login',usercontrol.get_login)
route.post('/login',usercontrol.post_login)
route.get('/usersignup',usercontrol.get_sigin)
route.post('/usersignup',usercontrol.signup)
route.get('/home',usercontrol.index)
route.post('/otp',usercontrol.verify);
route.get('/resend',usercontrol.resend)
route.get('/logout',usercontrol.logout)






//shop


    route.get('/business',product.business)
    route.get('/prod',product.allproduct)















//FORGOT
// route.get('/forgotemail',usercontrol.forgotemail)
// route.post('/forgotemail',usercontrol.post_forgot)
// route.post('/forgototp',usercontrol.forgot_verify)
















module.exports = route