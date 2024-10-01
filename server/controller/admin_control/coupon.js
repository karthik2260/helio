const userdb = require('../../model/usermodel');
const coupondb = require('../../model/copunmodel');


const get_coupon = async(req,res) => {
    const user = await userdb.findOne({email:req.session.email});
    const coupon = await coupondb.find()
    res.render('admin/coupon',{coupon})
}



const add_coupon = async(req,res) => {
    res.render('admin/add_coupon',{message:''})
   
}

const add = async(req,res) => {
    try {
        let coupons = await coupondb.findOne({couponcode:req.body.couponcode})
        if(coupons){
            return res.render('admin/add_coupon',{message:'Coupon already exists'})
        }else{
            const {couponcode,discountPercentage,expireDate,minPurchaseAmount,maxDiscountAmount} = req.body
            const coupon = await coupondb.find();
            const coupe = new coupondb({
                couponcode:couponcode,
                discountPercentage:discountPercentage,
                expireDate:expireDate,
                minPurchaseAmount:minPurchaseAmount,
                maxDiscountAmount

            })

            await coupe.save();
            res.redirect('/coupon')
        }
    }catch(err){
        console.log(err);
        
    }
}
    

   


const delet = async(req,res) => {
    try {
        const id = req.params.id;
        const coupon = await coupondb.findById(id)
        if(!coupon){
            res.status(404).send({message:`Cannot delete coupon with id ${id}. Coupon not found`})
        }
        await coupondb.findByIdAndDelete(id)
        res.json({success:true,message:'Coupon was successfully deleted'})
        
    }catch(err){
        console.log(err);
        
    }
}


const edit = async(req,res) => {
    const id = req.params.id;
    const get = await coupondb.findById(id);
    res.render('admin/edit_coupon',{get,message:""})
}



const post_edit = async (req, res) => {
    try {
      const id = req.params.id;
      const get = await coupondb.findById(id);
      const updatedCoupon = req.body;
  
      if (!updatedCoupon.couponcode || !updatedCoupon.expireDate || !updatedCoupon.minPurchaseAmount || !updatedCoupon.discountPercentage) {
        return res.render('editCoupon', { get: updatedCoupon, message: 'All fields are required.' });
      }
  
      // Ensure discountPercentage is less than 10
      if (updatedCoupon.discountPercentage >= 10) {
        return res.render('editCoupon', { get: updatedCoupon, message: 'Discount percentage must be less than 10.' });
      }
  
      // Fetch existing coupon data
      if (!get) {
        return res.render('editCoupon', { get: updatedCoupon, message: 'Coupon not found.' });
      }
  
      // Check for duplicate coupon code
      const couponSame = await coupondb.findOne({ couponcode: updatedCoupon.couponcode });
      if (couponSame && couponSame._id.toString() !== id) {
        return res.render('editCoupon', { get: updatedCoupon, message: 'Coupon already exists.' });
      }
  
      // Update the coupon
      await coupondb.findByIdAndUpdate(id, updatedCoupon, { new: true });
  
      res.redirect('/coupon');
    } catch (err) {
      console.log(err);
    }
  };
  







module.exports = {delet,add,edit ,post_edit,get_coupon,add_coupon}