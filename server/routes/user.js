const express = require('express');
const route = express.Router();
const usercontrol = require('../controller/user_control/user_controller.js')
const product = require('../controller/user_control/category_control.js')
const check= require("../middleware/check");
const { get } = require('mongoose');
const profile = require('../controller/user_control/profile_control');
const cart = require('../controller/user_control/cart_control.js')
const checkout=require('../controller/user_control/checkout_control')
const invoice=require('../controller/user_control/invoicecontroller')
const admincontrol = require("../controller/admin_control/admin_controller");










// USER Login & Signup


route.get('/login',usercontrol.get_login)
route.post('/login',usercontrol.post_login)
route.get('/usersignup',usercontrol.get_sigin)
route.post('/usersignup',usercontrol.signup)
route.get('/',usercontrol.index)
route.post('/otp',usercontrol.verify);
route.get('/resend',usercontrol.resend)
route.get('/logout',usercontrol.logout)




// User Profile

route.get('/profile',check.checklog,profile.profile)
route.post('/update-user/:id',check.active,profile.editProfile)
route.get('/useraddress',check.active,profile.address)
route.get('/userorders',check.active,profile.userorders)
route.get('/addaddress',check.active,profile.get_address)
route.post('/addaddress',check.active,profile.add_address)
route.delete('/useraddress/:id',check.active,profile.delete_address)
route.get('/updateAddress/:addressId',check.active,profile.edit_address)
route.post('/updateAddress/:addressId',check.active,profile.post_edit_address)
route.get('/cancelOrder/:orderId',check.active,profile.cancelOrder)
route.get('/wishlisted',check.active,profile.wishlisted)
route.get('/wishlist/:id',check.active,profile.add_wishlist)
route.delete('/deleteWishlist/:id',check.active,profile.remove_wishlist)
route.get('/wallethistory',check.active,profile.getwallet)
route.get('/orderDetail/:id',check.active,profile.orderDetail)
route.get('/returnOrder/:id',check.active,profile.retur)
route.get('/orders/:orderId/invoice', check.active, invoice.generateOrderInvoice);






// cart

route.get('/cart',check.active,cart.get_cart)
route.get('/cart/:id',check.active,cart.add_cart)
route.get('/remove/:id',check.active,cart.remove)
route.put('/up-quantity/:id',check.active,cart.update_quandity)
route.post('/up-amount',check.active,cart.update_amount)




// Checkout
route.get('/checkout',check.active,checkout.get_checkout)
route.post('/stockresult',check.active,checkout.cod)
route.post('/verifyStock',check.active,checkout.check_stock)
route.get('/thankyou',check.active,checkout.placed)
route.post('/razorpayment',check.active,checkout.onlinepayment)
route.post('/onlinepayment',check.active,checkout.onlinepayed)
route.post('/retrypayment',check.active,checkout.retrypayment)
route.post('/applycoupon', check.active, checkout.apply_coupon);
route.post('/removeCoupon', check.active, checkout.removeCoupon);
route.post('/walletpay',check.active,checkout.walletpay)
route.post('/failurePayment',check.active,checkout.failpayment)
route.post('/retrysuccess',check.active,checkout.paymentSucces)





//shop
route.get('/category/:id', check.active, product.categoryProducts);
    route.get('/prod',check.active,product.allproduct)
    route.post('/prod',product.sortproduct)
    route.get('/block',usercontrol.block)
    route.post('/search',check.active,product.search)
    route.get('/viewmoreorder',check.active,product.pagination)
    route.get('/allviewmoreorder',product.allpage)






//FORGOT
route.get('/forgotemail',usercontrol.forgotemail)
route.post('/forgotemail',usercontrol.post_forgot)
 route.post('/forgototp',usercontrol.forgot_verify)
route.post('/reset',usercontrol.reset_password)
route.get('/forgot-resend',usercontrol.forgot_resent)













// Product

route.get('/productDetail/:id',check.active,usercontrol.productDetails)
route.all('*',(req,res,next)=>{
    res.redirect('/error500')
})

module.exports = route