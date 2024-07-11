const Categorydb = require('../../model/category');
const productdb = require('../../model/product');





const business = async (req, res) => {
    try {
        const businesscategory = await Categorydb.findOne({ CategoryName: 'business' });

        // if (!businesscategory) {
        //     return res.status(404).send('Business category not found');
        // }
        const businessproduct = await productdb.find({ Category: businesscategory._id }).populate('Category');
        res.render('users/products', { products: businessproduct, businesscategory });

    } catch (err) {
        console.error(err);
        res.redirect('/err500');
    }
}



const gaming = async(req,res) => {
    try {
        const businesscategory = await Categorydb.findOne({CategoryName:'gaming'})
       
        const businessproduct = await productdb.find({Category:businesscategory._id}).populate('Category')
        console.log(businessproduct);

        res.render('user/products',{products:businessproduct,businesscategory})
    }catch (err){
        console.error(err)
        res.redirect('/err500')
    }
}




const convertible= async(req,res)=>{
    try{
    const businesscategory =await categorydb.findOne({CategoryName:'gaming'});
  
    const businessproduct =await productdb.find({Category:businesscategory._id}).populate('Category')
      console.log(menproduct);
    res.render('user/products',{products:businessproduct,businesscategory})
    
    }catch(err){
        console.error(err);
       res.redirect('/err500')
    }
}





const allproduct = async(req,res) => {
    try {
        const products = await productdb.find().populate('Category')
        res.render('user/products',{products,businesscategory:""})
    }catch (err) {
        console.log(err);
        response.redirect(error500)
    }
}



module.exports = {business,gaming,convertible,allproduct}