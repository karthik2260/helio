const jwt = require('jsonwebtoken');
const Categorydb = require('../../model/category');
const productdb = require('../../model/product');
const userdb = require('../../model/usermodel');







const list = async(req,res) => {
    try {
        const category = await Categorydb.find();
        console.log(category,'akhil');
        res.render('admin/category',{category})
    }catch (err){
        console.log(error);
        res.render('admin/err500')
    }
}






const get_add = async (req,res) => {
    res.render('admin/add_category')
}







const user_details = async (req,res) => {
    const allusers = await userdb.find();
    res.render('admin/userdetails',{allusers})
}







const add_category = async(req,res) => {
    try {

        if(!req.body){
            res.status(400).send({message:'Content cannot be empty'});
            return;
        }
        let category = await Categorydb.findOne({CategoryName:req.body.CategoryName})
        if(category){
            res.render('/admin/add_category',{message:'Category already exists'})
            return ;
        }else{
            const newcategory = new Categorydb({
                CategoryName:req.body.CategoryName,
                discription:req.body.discription
            })
            await newcategory.save();
            res.redirect('/category')
        }
    }catch (err){
        console.log(err);
        res.status(500).render('admin/err500')
    }
}






const get_edit = async(req,res) => {
    const id = req.params.id 
    const get = await Categorydb.findById(id)
    const message = ''
    res.render('admin/edit_category',{get,message})

}





const post_edit=async(req,res)=>{
    try{
        const categoryId=req.params.id;
        const updateData=req.body
        const get = await Categorydb.findById(categoryId)
        const categorysame=await Categorydb.findOne({CategoryName:updateData.CategoryName})
        if(categorysame){
            return res.render('admin/edit_category',{get,message:'category already exist'})
        }
        const updateCategory=await Categorydb.findByIdAndUpdate(categoryId,updateData,{new:true})
       await updateCategory.save()
        res.redirect('/category')
    }catch(err){
        console.error(err);
        res.render('admin/err500')
    }
 }





const delet = async (req,res) => {
    try {
        const id = req.params.id;
        await productdb.deleteMany({category:id})
        const data = await Categorydb.findOneAndDelete(id)
        if(!data) {
            res.status(400).send({message:`Cannot delete this with id ${id}`})
        }else{
            res.send({message:`Category and assosiated products deleted successfully`})
        }
    }catch(err){
        res.status(500).send({message:"Coudnot delete this product"})
    }
}





module.exports = {list,delet,post_edit,get_edit,get_add,user_details,add_category}