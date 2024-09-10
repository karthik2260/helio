const express = require("express");
const route = express.Router();
const path = require("path");
const admincontrol = require("../controller/admin_control/admin_controller");
const productController = require('../controller/admin_control/product')
const categoryController = require('../controller/admin_control/category')
const multer= require('multer')
const check =require('../middleware/check')
const orderController = require('../controller/admin_control/order_control')
const coupon=require('../controller/admin_control/coupon')
const offer=require('../controller/admin_control/offer_controller')
const sales=require('../controller/admin_control/sales_control')





// Storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = 'uploads/';
        if (file.fieldname === 'categoryImage') {
            uploadPath = 'uploads/categories/';
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

// Initialize upload
const upload = multer({ storage: storage });

module.exports = upload;


//multer/


route.get('/adminsignup',admincontrol.adminlogin)
route.get("/error500", admincontrol.err);
route.get('/admin',admincontrol.admindash)
route.get('/adminlogout',admincontrol.adminlogout)
route.get('/category',categoryController.list)
route.get('/userdetail',categoryController.user_details)
route.get('/addcategory',categoryController.get_add)
route.get('/edit/:id',categoryController.get_edit)
route.get('/products',productController.list)
route.get('/addproduct',productController.add_products)
route.get('/productedit/:id',productController.get_edit)
route.delete('/delete-image/:productId/:imageIndex', productController.deleteImage)
route.get('/blockuser',admincontrol.block)
route.post('/up-return/:id',check.adminCheck,orderController.updateReturn)





//coupon

route.get('/coupon',check.adminCheck,coupon.get_coupon)
route.get('/addCoupons',check.adminCheck,coupon.add_coupon)
route.get('/editCoupon/:id',check.adminCheck,coupon.edit)
route.post('/addCoupons',check.adminCheck,coupon.add)
route.delete('/couponDelete/:id',check.adminCheck,coupon.delet)
route.get('/editCoupon/:id',check.adminCheck,coupon.edit)
route.post('/editCoupon/:id',check.adminCheck,coupon.post_edit)







route.post('/adminsignup',admincontrol.adminsign)
route.post('/addcategory',upload.single('categoryImage'),categoryController.add_category)
route.post('/edit/:id',categoryController.post_edit)
route.delete('/category-delete/:id',categoryController.delet)
route.post('/multproduct',upload.array('images',4),productController.creatProduct)
route.post('/productedit/:id',upload.array('images',4),productController.post_edit)
route.delete('/product-delete/:id',productController.pro_delete)
route.get('/orders',check.adminCheck,orderController.get_order)    
route.post('/updateOrderStatus/:orderId',check.adminCheck,orderController.update_status)
route.get('/orderDetails/:orderId', orderController.orderDetail);    




//offer

route.get('/offers',check.adminCheck,offer.get_offer)
route.get ('/addOffer',check.adminCheck,offer.add_offer)
route.post('/addoffer',check.adminCheck,offer.adding)
route.get('/offerlist',check.adminCheck,offer.unlistOffer)
route.get('/offeredit/:id',check.adminCheck,offer.editOffer)
route.post('/editoffer/:id',check.adminCheck,offer.postedit)





//sales

route.get('/dailyChart',sales.dailyChart)
route.get('/monthlyChart',sales.monthlySales)
route.get('/yearlyChart',sales.yearlySales)
route.get('/getSalesReport',sales.get_report)
route.get('/salesReport',sales.generateReport)







module.exports = route;
