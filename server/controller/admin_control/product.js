const Categorydb = require('../../model/category');
const productdb = require('../../model/product');
const path = require('path')








const list = async(req,res) => {
    try{
        const categories = await Categorydb.find();
        const products = await productdb.find().populate('Category')
        res.render('admin/products',{categories,products})
    }catch(err){
        console.log(err);
        res.status(500).render('admin/err500')
    }
}

const createproduct = async(req,res) => {
    if(!req.body){
        res.render('admin/err500');
        return;
    }


  

const images = req.files.map(file => file.path);

const price = parseInt(req.body.price);
console.log(req.body);
const discount = parseInt(req.body.discount)||0
if(isNaN(price) || isNaN(discount)){
    res.render('admin/err500');
    return;
}

const totalprice = Math.round(price * (1-discount /100))
try{
    const category =  await Categorydb.findById(req.body.category);
   console.log(category._id,'jhhhhh');
    if(!category){
        res.status(400).send({message:'category not found'})
        return
    }
    console.log("saving side");
    const product = new productdb({
        product_name : req.body.product_name,
        Category : category._id,
        brand : req.body.brand,
        price : price,
        color : req.body.color,
        size : req.body.size,
        description : req.body.stat,
        discount : discount,
        stock : req.body.stock,
        images : images,
        totalprice : totalprice,
    })

    await product.save();
   
    res.redirect('/products')
}catch(err){
    console.log(err);
    res.status(500).send({message:'Something wrong'})
}
}





const add_product = async(req,res) => {
    try {
        const categories = await Categorydb.find()
       
        res.render('admin/add_products',{categories})
        
    }catch(err){
        console.log(err);
        res.status(500).send('internal server error')
    }
}

















module.exports = {list,add_product,createproduct};