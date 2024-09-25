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
        // Check if user is authenticated
        if (!req.session || !req.session.email) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const user = await userdb.findOne({ email: req.session.email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userid = user._id;
        const [wishlist, usercart, wallet] = await Promise.all([
            wishlistdb.findOne({ user: userid }),
            cartdb.findOne({ user: userid }).populate('items.productId'),
            walletdb.findOne({ user: userid })
        ]);

        let totalAmount = 0;
        let wishCount = wishlist ? wishlist.items.length : 0;
        let walletBalance = wallet ? wallet.balance : 0;

        if (!usercart || !usercart.items || usercart.items.length === 0) {
            return res.render('user/cart', { 
                user, 
                usercart: null, 
                wishCount, 
                walletHistory: { balance: walletBalance, transactions: [] }
            });
        }

        // Filter out unlisted products and apply offers
        usercart.items = await Promise.all(usercart.items
            .filter(item => item.productId && item.productId.list !== 'unlisted')
            .map(async (item) => {
                try {
                    const productWithOffer = await applyoffer(item.productId);
                    item.productId.offerPrice = productWithOffer.offerPrice;
                    item.productId.originalPrice = productWithOffer.originalPrice;
                    totalAmount += productWithOffer.offerPrice * item.quantity;
                    return item;
                } catch (error) {
                    console.error(`Error applying offer to product ${item.productId._id}:`, error);
                    return null;
                }
            }));

        // Remove null items (products that failed offer application)
        usercart.items = usercart.items.filter(item => item !== null);

        if (usercart.items.length === 0) {
            return res.render('user/cart', { 
                user, 
                usercart: null, 
                wishCount, 
                walletHistory: { balance: walletBalance, transactions: [] }
            });
        }

        usercart.totalAmount = totalAmount;

        let totalDiscount = usercart.items.reduce((sum, item) => 
            sum + (item.productId.originalPrice - item.productId.offerPrice) * item.quantity, 0);

        usercart.totalDiscount = totalDiscount;
        usercart.balance = totalAmount;

        await usercart.save();

        res.render('user/cart', { 
            user, 
            usercart, 
            wishCount, 
            walletHistory: { balance: walletBalance, transactions: wallet ? wallet.transactions : [] }
        });
    } catch (err) {
        console.error('Error in get_cart:', err);
        res.status(500).json({ error: 'An error occurred while processing your request' });
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