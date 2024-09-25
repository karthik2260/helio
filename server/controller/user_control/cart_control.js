const userdb = require('../../model/usermodel')
const Categorydb = require('../../model/category')
const cartdb = require('../../model/cartmodel')
const wishlistdb=require('../../model/wishlistmodel')
const walletdb=require('../../model/walletmodel')
const offerdb = require('../../model/offermodel')



const applyoffer = async (product) => {
    if (!product) {
        return null;
    }

    try {
        const productOffer = await offerdb.findOne({
            product_name: product._id,
            status: 'active'
        });
       

        const categoryOffer = await offerdb.findOne({
            category_name: product.Category._id, // Ensure this matches the field used in product's schema
            status: 'active'
        });

        if (productOffer && typeof productOffer.discount_Percentage === 'number') {
            product.offerPrice = Math.round(product.price - (product.price * (productOffer.discount_Percentage / 100)));
            console.log("Applied product offer");
        } else if (categoryOffer && typeof categoryOffer.discount_Percentage === 'number') {
            product.offerPrice = Math.round(product.price - (product.price * (categoryOffer.discount_Percentage / 100)));
            console.log("Applied category offer");
        } else {
            product.offerPrice = product.price;
            console.log("No offers applied");
        }
    } catch (error) {
        console.error('Error applying offer:', error);
    }

    return product;
    
};


const get_cart = async (req, res) => {
    try {
      const user = await userdb.findOne({ email: req.session.email });
      const userid = user._id;
      const wishlist = await wishlistdb.findOne({ user: userid });
      let usercart = await cartdb.findOne({ user: userid }).populate('items.productId');
      let totalAmount = 0;
      let wishCount = wishlist ? wishlist.items.length : 0;
      const wallet = await walletdb.findOne({ user: user }) || { balance: 0, transactions: [] };
  
      if (!wallet) {
        wallet = new walletdb({
          user: user._id,
          transactions: []
        });
        await wallet.save();
      }
  
      let totalDiscount = 0;
      let totalPrice = 0;
  
      if (usercart) {
        // Filter out unlisted products
        usercart.items = usercart.items.filter(item => item.productId && item.productId.list !== 'unlisted');
  
        for (let item of usercart.items) {
          const productWithOffer = await applyoffer(item.productId);
          item.productId.offerPrice = productWithOffer.offerPrice;
          item.productId.originalPrice = productWithOffer.originalPrice;
          totalAmount += productWithOffer.offerPrice * item.quantity;
        }
        usercart.totalAmount = totalAmount;
  
        usercart.items.forEach(item => {
          const { productId, quantity } = item;
          totalDiscount += productId.offerPrice;
        });
  
        let balance = totalAmount - totalDiscount;
  
        usercart.totalDiscount = totalDiscount;
        usercart.balance = balance;
        
        // Save the updated cart (with unlisted products removed)
        await usercart.save();
      }
  
      // If cart is empty after removing unlisted products, set it to null
      if (usercart && usercart.items.length === 0) {
        usercart = null;
      }
  
      res.render('user/cart', { user, usercart, wishCount, walletHistory: wallet });
    } catch (err) {
      console.log(err);
      res.redirect('/error500');
    }
  };

  
  
const add_cart = async (req, res) => {
    try {
        const productId = req.params.id;
        const user = await userdb.findOne({ email: req.session.email });
        let userCart = await cartdb.findOne({ user: user._id });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }


        if (!userCart) {
            userCart = new cartdb({
                user: user._id,
                items: [{ productId: productId, quantity: 1 }]
            });
        } else {
            const existingCartItemIndex = userCart.items.findIndex(item => item.productId.toString() === productId);

            if (existingCartItemIndex !== -1) {
                userCart.items[existingCartItemIndex].quantity += 1;
            } else {
                userCart.items.push({ productId: productId, quantity: 1 });
            }
        }

        await userCart.save();
        res.redirect('/cart');
    } catch (error) {
        console.log(error);
        res.redirect('/error500');
    }
};




const remove = async(req,res) => {
    try {
        const productId = req.params.id;
        const user = await userdb.findOne({email:req.session.email});

        if(!user) {
            return res.status(404).render('error500')
        }
        const userCart = await cartdb.findOne({user:user._id})

        if(!userCart){
            return res.status(404).render('error500')
        }

        const ItemIndex = userCart.items.findIndex(item => item.productId.toString() === productId)
        if (ItemIndex === -1){
            return res.redirect('/error500')
        }

        userCart.items.splice(ItemIndex,1)

        await userCart.save();
        res.redirect('/cart')
    }catch(error){
        console.error(error)
    }
}




const update_quandity=async(req,res)=>{
    try {
        const itemId = req.params.id;
    const newQuantity = req.body.quantity;
    
    const user= await userdb.findOne({email:req.session.email})
    const userId= user._id;
    
   
    const updatedCart = await cartdb.findOneAndUpdate(
        { user: userId, "items.productId": itemId }, 
        { $set: { "items.$.quantity": newQuantity } }, 
        { new: true }
    ); 

    // console.log(updatedCart,'pppppppppp');
    
        res.json({message:"changed"})

    } catch (error) {
        console.log(error);
    }
}




const update_amount=async(req,res)=>{
    
    try {
        const user= await userdb.findOne({email:req.session.email})
        const userId= user._id;
        const usercart=await cartdb.findOne({user:userId}).populate('items.productId')
        let totalAmount = 0;
        let totalDiscount=0;
        let totalPrice=0

        // for (let item of usercart.items) {
        //     const productWithOffer = await applyoffer(item.productId);
        //     item.productId.offerPrice = productWithOffer.offerPrice;
        //     item.productId.originalPrice = productWithOffer.originalPrice;
        //     totalAmount += productWithOffer.offerPrice * item.quantity;
        // }
        usercart.items.forEach(item => {
            totalAmount += item.productId.price*item.quantity
        })
        usercart.totalAmount = totalAmount;
          



        usercart.items.forEach(item => {
        const { productId, quantity } = item;   
            
        
        totalDiscount+=(productId.discount*quantity);
    })
   
    let balance= totalAmount-totalDiscount
    
   
    usercart.totalDiscount = totalDiscount;
    usercart.balance=balance;
    const save=await usercart.save()
    
    res.json({message:"update"})
       
    } catch (error) {
        console.log(error);
    }
}













module.exports = {applyoffer,get_cart,remove,add_cart,update_quandity,update_amount}