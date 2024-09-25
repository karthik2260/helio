const jwt = require('jsonwebtoken');
const Categorydb = require('../../model/category');
const productdb = require('../../model/product');
const userdb = require('../../model/usermodel');







const list = async(req,res) => {
    try {
        const category = await Categorydb.find();
        res.render('admin/category',{category})
    }catch (err){
        res.render('admin/err500')
    }
}






const get_add = async (req,res) => {
    res.render('admin/add_category')
}






// user details change 
const user_details = async (req,res) => {
    const allusers = await userdb.find();
    res.render('admin/Userdetails',{allusers})
}







const add_category = async (req, res) => {
    try {
        if (!req.body || !req.file) {
            res.status(400).send({ message: 'Content cannot be empty' });
            return;
        }

        const categoryName = req.body.CategoryName.trim();
        const words = categoryName.split(/\s+/);

        // Server-side validation
        if (words.length > 10) {
            res.render('admin/add_category', { message: 'Category name should not exceed 10 words.' });
            return;
        }

        if (!/^[A-Za-z\s]+$/.test(categoryName)) {
            res.render('admin/add_category', { message: 'Category name should contain only alphabets and spaces.' });
            return;
        }

        let category = await Categorydb.findOne({ CategoryName: categoryName });
        if (category) {
            res.render('admin/add_category', { message: 'Category already exists' });
            return;
        } else {
            // Save the full path to the image
            const imagePath = req.file.path;
            
            const newcategory = new Categorydb({
                CategoryName: categoryName,
                discription: req.body.discription,
                image: imagePath
            });
            
            await newcategory.save();
            res.redirect('/category');
        }
    } catch (err) {
        console.log(err);
        res.status(500).render('admin/err500');
    }
};
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






const delet = async (req, res) => {
    try {
        const id = req.params.id;

        // Delete all products associated with the category
        await productdb.deleteMany({ Category: id });

        // Delete the category
        const data = await Categorydb.findOneAndDelete({ _id: id });

        if (!data) {
            res.status(400).send({ message: `Cannot delete category with id ${id}` });
        } else {
            res.send({ message: `Category and associated products deleted successfully` });
        }
    } catch (err) {
        res.status(500).send({ message: "Could not delete this category" });
    }
}



module.exports = {list,delet,post_edit,get_edit,get_add,user_details,add_category}