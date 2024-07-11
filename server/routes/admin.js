const express = require("express");
const route = express.Router();
const path = require("path");
const admincontrol = require("../controller/admin_control/admin_controller");
const productController = require('../controller/admin_control/product')
const categoryController = require('../controller/admin_control/category')
const multer= require('multer')




const storage=multer.diskStorage({
    destination:'uploads/',
    filename:function (req,file,cb){
        const uniqueSuffix= Date.now()+'-'+Math.round(Math.random() * 1E9);
        const fileExtension= path.extname(file.originalname);
        cb(null,file.fieldname+'-'+ uniqueSuffix + fileExtension);
 
    }
});
const upload=multer({storage:storage});

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





route.post('/adminsignup',admincontrol.adminsign)
route.post('/addcategory',categoryController.add_category)
route.post('/edit/:id',categoryController.post_edit)
route.delete('/category-delete/:id',categoryController.delet)
route.post('/multproduct',upload.array('images',4),productController.creatProduct)
route.post('/productedit/:id',upload.array('images',4),productController.post_edit)
route.delete('/product-delete/:id',productController.pro_delete)













module.exports = route;
