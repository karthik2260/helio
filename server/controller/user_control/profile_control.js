const userdb = require('../../model/usermodel');
const productdb = require('../../model/product');
const addressdb = require('../../model/addressmodel');
const orderdb = require('../../model/ordermodel');
const { logout } = require('./user_controller');
const walletdb=require('../../model/walletmodel')
const wishlistdb=require('../../model/wishlistmodel')
const cartdb=require('../../model/cartmodel')















const  profile = async (req, res) => {
    try {
        const userToken = req.cookies.userToken;
        const user = await userdb.findOne({ email: req.session.email });
        const wallet= await walletdb.findOne({user:user})|| { balance: 0, transactions: [] };
        if(!wallet){
            wallet = new walletdb({
                user : user._id,
                transactions : []
            })
            await wallet.save();
        }
        res.render('user/profile', { user, userToken ,wallet,walletHistory:wallet});
    } catch (err) {
        console.log(err);
        res.redirect('/error500');
    }
};


const editProfile=async(req,res)=>{
    try {
        const userdetail = await userdb.findOne({ email: req.session.email })
        const userId = req.params.id;

        const updatedData = req.body;
        const updateData = await userdb.findByIdAndUpdate(userId, updatedData, userdetail, { new: true })
        await updateData.save()
        res.redirect('/profile')

    } catch (error) {
        console.log(error);
        res.render('error500')

    }
}





const address = async(req,res) => {
    try {
        const user = await userdb.findOne({email:req.session.email})
        const addresses = await addressdb.find({user:user._id})
        let wallet = await walletdb.findOne({user:user});
        if(!wallet){
            wallet = new walletdb({
                user : user._id,
                transactions : []
            })
            await wallet.save();
        }


        res.render('user/address',{user,addresses,walletHistory:wallet})
    }catch(err){
        console.log(err);
        res.redirect('/error500')
    }
}


















const get_address = async(req,res) => {
    const user = await userdb.findOne({email:req.session.email})
    let wallet = await walletdb.findOne({user:user});
    if(!wallet){
        wallet = new walletdb({
            user : user._id,
            transactions : []
        })
        await wallet.save();
    }
    res.render('user/add_address',{user,walletHistory:wallet})
}

const add_address = async(req,res) => {
    try {
        const email = req.session.email;
        const user = await userdb.findOne({email:email})



        const address = new addressdb({
            user : user._id,
            name : req.body.name,
            email : req.body.email,
            mobileNumber : req.body.number,
            pincode : req.body.pincode,
            locality : req.body.locality,
            address : req.body.address,
            district : req.body.district,
            state : req.body.state,
            alternateMobile : req.body.phone,
            landmark : req.body.landmark,
            addressType : req.body.addressType

        })

        await address.save()
        res.redirect('/useraddress')
    }catch(err){
        res.redirect('/error500')
    }
}


const edit_address = async(req,res) => {
    console.log("reched   ");
    const addressId = req.params.addressId

    try {
        const user = await userdb.findOne({email:req.session.email})
        console.log(user,'vishal');
        
        const address = await addressdb.findById(addressId)
        console.log(address,'jishnu');
        
        let wallet = await walletdb.findOne({user:user});
        console.log(wallet,'karthik');
        

        console.log('adress',address)
        if(!wallet){
            wallet = new walletdb({
                user : user._id,
                transactions : []
            })
            await wallet.save();
        }
        res.render('user/editAddress',{user,address,walletHistory:wallet})
    }catch(error){
        res.status(500).send('Error retrieving address')
    }
}

const post_edit_address = async (req, res) => {
    const { addressId } = req.params;
    try {
        
        const address = await addressdb.findById(addressId);
        if (!address) {
            return res.status(404).send('Address not found');
        }

        address.name = req.body.name;
        address.email = req.body.email;
        address.mobileNumber = req.body.mob;
        address.pincode = req.body.pin;
        address.locality = req.body.locality;
        address.address = req.body.address;
        address.district = req.body.district;
        address.state = req.body.state;
        address.alternateMobile = req.body.phone;
        address.landmark = req.body.landmark;
        address.addressType = req.body.addressType;

        

        await address.save();

        res.redirect('/useraddress');
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).send('Internal server error');
    }
};



const delete_address = async(req,res) => {
    try {
        const id = req.params.id

        addressdb.findByIdAndDelete(id)
        .then(data => {
            if(!data){
                res.status(404).send({message : `Cannot delete address with ID :${id}`})
            }else{
                res.send({message : 'Address was deleted successfully'})
            }
        })
    }catch (error) {
        console.log('Error:,error.message');
        res.status(500).json({error:error.message})

    }
}


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

const update_address = async (req, res) => {
    try {
        const id = req.params.id;
        const updatedData = req.body;

        const updatedAddress = await addressdb.findByIdAndUpdate(id, updatedData, { new: true });

        if (!updatedAddress) {
            return res.status(404).send({ message: `Cannot update address with ID: ${id}` });
        }

        res.send({ message: 'Address was updated successfully', data: updatedAddress });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};









const userorders = async(req,res) => {
    try {
       
        const user = await userdb.findOne({email:req.session.email})
        const orders = await orderdb.find({userId:user._id});
        orders.reverse()
        let wallet = await walletdb.findOne({user:user});
        if(!wallet){
            wallet = new walletdb({
                user : user._id,
                transactions : []
            })
            await wallet.save();
        }
        res.render('user/orders',{user,orders,walletHistory:wallet})
    }catch (err){
        console.log(err);
        res.redirect('/error500')

    }
}




const cancelOrder=async(req,res)=>{
    try {
        
    
        const orderId = req.params.orderId;
        const reason = req.query.reason || "No reason provided";

        const user = await userdb.findOne({ email: req.session.email })
        const userId = user._id;
        const order=await orderdb.findOne({_id:orderId})
        const total=order.totalAmount
    
        const wallet = await walletdb.findOne({ user: userId })
        const updateOrder = await orderdb.findByIdAndUpdate(orderId, {
          $set: { status: "Cancelled", cancellationReason: reason }
        }, { new: true }).populate("items.productId");
    
        if (!updateOrder) {
          return res.status(404).json({ success: false, message: "Order not found" });
        }
    
        let totalRefund = 0;
        let updatedWallet;
    
        for (const item of updateOrder.items) {
          await productdb.findByIdAndUpdate(item.productId, {
            $inc: { stock: item.quantity },
          });}
          
            if(order.paymentStatus!='Pending'){
          
          if (!wallet) {
            const wallett = new walletdb({
              user: user,
              balance: total,
              transactions: { type: 'refund', amount: total, description: `Order Returned for item ` }
    
            })
            wallett.save()
          } else {
    
            updatedWallet = await walletdb.findOneAndUpdate(
              { user: userId },
              {
                $inc: { balance: total },
                $push: { transactions: { type: 'refund', amount: total, description: `Order cancelled for item ` } }
              },
              { upsert: true, new: true }
            );
          }
            }
    
        res.json({
          success: true,
          message: "Order cancelled successfully",
          refundAmount: totalRefund,
          newBalance: updatedWallet ? updatedWallet.balance : 0
        });
      } catch (error) {
        console.error("Error in getCancelOrder:", error);
        res.status(500).json({ success: false, message: "Error occurred during cancel order", error: error.message });
      }

}





const wishlisted = async (req, res) => {
    try {
        const userEmail = await userdb.findOne({ email: req.session.email });
        if (!userEmail) {
            return res.redirect('/login');
        }
        const userId = userEmail._id;
        let wishlist = await wishlistdb.findOne({ user: userId }).populate('items.productId');
        
        let wallet = await walletdb.findOne({ user: userId });
        if (!wallet) {
            wallet = new walletdb({
                user: userId,
                transactions: []
            });
            await wallet.save();
        }

        // Fetch only listed products
        const products = await productdb.find({ list: { $ne: 'unlisted' } }).populate('Category');
        
        for (const product of products) {
            await applyoffer(product);
        }

        if (wishlist) {
            // Filter out unlisted products from the wishlist
            const originalLength = wishlist.items.length;
            wishlist.items = wishlist.items.filter(item => item.productId && item.productId.list !== 'unlisted');
            
            // Save the updated wishlist if items were removed
            if (wishlist.items.length !== originalLength) {
                await wishlist.save();
                console.log(`Removed ${originalLength - wishlist.items.length} unlisted products from wishlist`);
            }
        }

        console.log(wishlist, 'updated wishlist');
        
        if (!wishlist || wishlist.items.length === 0) {
            return res.render('user/wishlist', { 
                wishlist: { items: [] }, 
                user: userEmail, 
                productInCart: "", 
                walletHistory: wallet,
                products 
            });
        } else {
            res.render('user/wishlist', { 
                wishlist, 
                user: userEmail, 
                walletHistory: wallet, 
                products 
            });
        }
    } catch (err) {
        console.log(err);
        res.redirect('/error500');
    }
};

const add_wishlist = async (req,res) => {
    try {
        const productId = req.params.id;
        const user = await userdb.findOne({email:req.session.email});
        let userWish = await wishlistdb.findOne({user:user._id})

        if(!userWish){
            userWish = new wishlistdb({
                user : user._id,
                items:[{productId:productId}]
            })
            await userWish.save();

        }else{
            if(userWish.items.some(items => items.productId.toString() ===productId.toString())){
                return res.redirect('/wishlisted')
            }userWish.items.push({productId:productId})
            await userWish.save()
        }
    
}catch(error){
    console.log(error);
    res.redirect('/err500')
}

}



const remove_wishlist = async (req, res) => {
    try {
        const productId = req.params.id;

        // Check if session email exists
        if (!req.session.email) {
            return res.status(400).send('User not logged in');
        }

        // Fetch the user by email
        const userEmail = await userdb.findOne({ email: req.session.email });
        
        // Handle case where user is not found
        if (!userEmail) {
            return res.status(404).render('error404', { message: 'User not found' });
        }

        const userId = userEmail._id;

        // Fetch the user's wishlist
        const userWish = await wishlistdb.findOne({ user: userId });

        // Handle case where wishlist is not found
        if (!userWish) {
            return res.status(404).render('error404', { message: 'Wishlist not found' });
        }

        // Find the index of the product to be removed
        const itemIndex = userWish.items.findIndex(item => item.productId.toString() === productId);

        // Handle case where the product is not in the wishlist
        if (itemIndex === -1) {
            return res.status(404).render('error404', { message: 'Product not found in wishlist' });
        }

        // Remove the product from the wishlist
        userWish.items.splice(itemIndex, 1);

        // Save the updated wishlist
        await userWish.save();

        // Send a success response
        res.send('Success');
    } catch (error) {
        console.error(error);
        res.status(500).render('error500', { message: 'An error occurred while removing the product from the wishlist' });
    }
};


const getwallet = async (req, res) => {
    try {
        const user = await userdb.findOne({ email: req.session.email });

        let wallet = await walletdb.findOne({ user: user });
        if (!wallet) {
            wallet = new walletdb({
                user: user._id,
                transactions: [],
                amount: 0 
            });
            await wallet.save();
        }

        wallet = await walletdb.findOne({ user: user });
        wallet.transactions.reverse();

        if (wallet.amount <= 0) {
            return res.render('user/wallethistory', {
                walletHistory: wallet,
                user,
                errorMessage: 'Your wallet is empty. You cannot place an order.'
            });
        }

        res.render('user/wallethistory', { walletHistory: wallet, user });

    } catch (err) {
        console.log(err);
        res.redirect('/error500');
    }
};




const orderDetail = async (req,res) => {
    try {
        const orderid = req.params.id;
        const user = await userdb.findOne({email:req.session.email})
        const wallet = await walletdb.findOne({user:user})
        const order = await orderdb.findById(orderid).populate('items.productId')
        console.log(order);
        res.render('user/orderdetail',{walletHistory:wallet,user,order})

    }catch(error){
        console.log(error);
        res.redirect('/error500')
    }
}



const retur = async (req, res) => {
    try {
        const orderId = req.params.id;
        const reason = req.query.reason || "No reason provided";

        const user = await userdb.findOne({ email: req.session.email });
        const userId = user._id;
        const order = await orderdb.findOne({ _id: orderId });
        const total = order.totalAmount;

        const wallet = await walletdb.findOne({ user: userId });
        const updateOrder = await orderdb.findByIdAndUpdate(orderId, {
            $set: { status: "Return Requested", returnReason: reason }
        }, { new: true }).populate("items.productId");

        if (!updateOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        let updatedWallet;

        for (const item of updateOrder.items) {
            await productdb.findByIdAndUpdate(item.productId, {
                $inc: { stock: item.quantity },
            });
        }

        if (order.paymentStatus !== 'Pending') {
            if (!wallet) {
                const newWallet = new walletdb({
                    user: userId,
                    balance: total,
                    transactions: [{ type: 'refund', amount: total, description: `Order Returned for item` }]
                });
                await newWallet.save();
                updatedWallet = newWallet;
            } else {
                updatedWallet = await walletdb.findOneAndUpdate(
                    { user: userId },
                    {
                        $inc: { balance: total },
                        $push: { transactions: { type: 'refund', amount: total, description: `Order Returned for item` } }
                    },
                    { upsert: true, new: true }
                );
            }
        }

        res.status(200).json({
            success: true,
            message: "Order return requested successfully",
            refundAmount: total,
            newBalance: updatedWallet ? updatedWallet.balance : 0
        });

    } catch (error) {
        console.error("Error in retur:", error);
        res.status(500).json({ success: false, message: "Error occurred during order return", error: error.message });
    }
};




module.exports = {retur,orderDetail,getwallet,remove_wishlist,add_wishlist,profile,wishlisted,cancelOrder,editProfile,edit_address,update_address,delete_address,add_address,get_address,address,userorders,post_edit_address,applyoffer}