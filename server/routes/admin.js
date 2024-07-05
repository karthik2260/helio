const express = require('express');
const route = express.Router()
const path = require('path')

const categoryController = require('../controller/admin_control/category')
const admincontrol = require('../controller/admin_control/admin_controller')
const productController = require('../controller/admin_control/product')
const multer = require('multer')


//multer/

const storage=multer.diskStorage({
    destination:'uploads/',
    filename:function (req,file,cb){
        const uniqueSuffix= Date.now()+'-'+Math.round(Math.random() * 1E9);
        const fileExtension= path.extname(file.originalname);
        cb(null,file.fieldname+'-'+ uniqueSuffix + fileExtension);
 
    }
});
const upload=multer({storage:storage});












route.get('/edit/:id',categoryController.get_edit)
route.get('/addcategory',categoryController.get_add)
route.get('/category',categoryController.list)
route.post('/addcategory',categoryController.post_category)
route.post('/edit/:id',categoryController.post_edit)
route.get('/products',productController.list)
route.get('/addProducts',productController.add_product)












route.post('/multproduct',upload.array('images',4),productController.createproduct)



route.get('/error500',admincontrol.err)













module.exports = route
