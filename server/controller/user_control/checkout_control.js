const addressdb = require('../../model/addressmodel')
const userdb = require('../../model/usermodel');
const productdb = require('../../model/product');
const cartdb = require('../../model/cartmodel');
const orderdb = require('../../model/ordermodel');
const dotenv = require('dotenv');
dotenv.config({path:'config.env'})
const Razorpay = require('razorpay');
const { json } = require('body-parser');
const coupondb=require('../../model/copunmodel')
const offerdb=require('../../model/offermodel')
const Categorydb = require('../../model/category');
const walletdb=require('../../model/walletmodel')


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


const  razorpay = new Razorpay({
    key_id : 'rzp_test_iAqbez4gZElsL0',
    key_secret: '3mQl5Ld8hBpcoy3hvYKJ3u3Y',
   		

})




const get_checkout = async(req,res) => {
    const user = await userdb.findOne({email:req.session.email});
    const products = await cartdb.findOne({user:user._id}).populate('items.productId')
    const applicableCoupons= await coupondb.find()

    const address = await addressdb.find({user:user._id})

    res.render('user/checkout',{address,products,applicableCoupons})

}     




const cod = async (req, res) => {
    try {
        const { data, paymentMethod, totalamount, coupondiscount } = req.body;
        const { items, addressId } = data;
        
        const address = await addressdb.findById(addressId);
        
        if (!address) {
            return res.status(401).json({ message: 'Address not found', status: 401 });
        }

        const User = await userdb.findOne({ email: req.session.email });
        if (!User) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userId = User._id;

        const updatedProducts = [];
        for (const item of items) {
            const productId = item.productId;
            const product = await productdb.findById(productId);
            
            if (!product) {
                console.log(`Product with ID ${productId} not found`);
                continue;
            }
             
            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Product with ID ${productId} is out of stock` });
            }

            product.stock -= item.quantity;
            product.count += 1;
            await product.save();

            updatedProducts.push({
                productId: item.productId,
                price: item.offerPrice,
                quantity: item.quantity,
            });
        }
       
        const order = new orderdb({
            userId: userId,
            items: updatedProducts,
            totalAmount: totalamount,
            
            address: address,
            paymentMethod: paymentMethod,
            paymentStatus: "Pending",
            status: 'Pending',
            couponDiscount:coupondiscount

        });

        await order.save();
           
        await cartdb.findOneAndDelete({ user: userId });
        res.json({ message: "order completed" });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const check_stock=async(req,res)=>{
    try {
       
        const allItems = req.body.allItems;
        
       

        const outOfStockItems = [];


        for (const item of allItems) {

            const productId = item.productId;



            const product = await productdb.findById(productId);


            if (!product) {

                console.log(`Product with ID ${productId} not found`);
                continue;
            }
              
            if (product.stock < item.quantity) {

                outOfStockItems.push(productId);
            }
        }
        


        res.status(200).json({ outOfStockItems });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const placed = async(req,res) => {
    try {
        const user = await userdb.findOne({email:req.session.email})
        
        // Fetch the most recent order for this user
        const order = await orderdb.findOne({ userId: user._id }).sort({ createdAt: -1 })
        
        if (!order) {
            return res.status(404).render('error404', { message: 'Order not found' })
        }
        
        res.render('user/orderPlaced', { user, order })
    } catch (error) {
        console.log(error);
        res.status(400).render('error500')
    }
}



const onlinepayment = async (req,res) => {
    try {
        console.log("heyyy");
        const totalAmount = req.body.totalamount;

        const order = await razorpay.orders.create({
            amount : totalAmount * 100,
            currency : 'INR',
            payment_capture:1
        })

        res.json({order});
    }catch(error){
        console.error(error)
        res.status(500).json({message:'Error creating Razorpay order'})
    }
}


const onlinepayed = async (req,res) => {
    try {
        const {data,paymentMethod,total,discount} = req.query;

        const parseData = JSON.parse(data);
        const {items,addressId} = parseData;

        const address = await addressdb.findById(addressId);

        if(!address){
            return res.status(401).json({message:'Address Not Found',status : 401})
        }

        const User = await userdb.findOne({email:req.session.email})
        if(!User){
            return res.status(404).json({message:'User not found '})
        }

        const userId = User._id;
        

        const updatedProducts = [];
        for(const item of items){
            const productId = item.productId
            const product = await productdb.findById(productId);
            if (!product) {
                console.log(`Product with ID ${productId} not found`);
                continue;
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Product with ID ${productId} is out of stock` });
            }

            product.stock -= item.quantity;
            product.count += 1;

            await product.save();

            updatedProducts.push({
                productId: productId,
                price: product.price,
                quantity: item.quantity,
            });
        }
      
       
      
       
        const order = new orderdb({
            userId: userId,
            items: updatedProducts,
            totalAmount: total,
            address: address,
            paymentMethod: paymentMethod,
            paymentStatus:"Completed",
            status:'Pending',
            couponDiscount:discount
        });

        await order.save();

        await cartdb.findOneAndDelete({ user: userId });


        res.redirect('/thankyou')
 


    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}






const failpayment=async(req,res)=>{
    try {
        const { data,totalamount } = req.body;
        const parsedData = data; // Directly use data if already an object
        const { items, addressId, paymentMethod ,} = parsedData;

        const userEmail = req.session.email;
        const user = await userdb.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userId = user.id;



        const address = await addressdb.findById(addressId);
        if (!address) {
            return res.status(401).json({ message: 'Address not found' });
        }

        const updatedProducts = [];
        for (const item of items) {
            const productId = item.productId;
            

            const product = await productdb.findById(productId);
            if (!product) {
                console.log(`Product with ID ${productId} not found`);
                continue;
            }
          const prod=  await applyoffer(product)
           
            


            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Product with ID ${productId} is out of stock` });
            }
            
            
            await product.save();

            updatedProducts.push({
                productId: productId,
                price:Math.min(prod.offerPrice || Infinity, prod.price - prod.discount),
                quantity: item.quantity,
            });
        }

         const totalAmount = updatedProducts.reduce((total, item) => total + item.price * item.quantity, 0);

        const order = new orderdb({
            userId: userId,
            items: updatedProducts,
            totalAmount: totalAmount,
            address: address,
            paymentMethod: "Not Paid",
            paymentStatus: "Pending",
            status: 'Pending'
        });

        await order.save();
        console.log('ordersucesss')

        await cartdb.findOneAndDelete({ user: userId });

        res.status(200).json({ message: 'Order saved successfully', order });
    } catch (error) {
        console.log(error);
        res.redirect('/error500');
    }
}



const retrypayment = async (req, res) => {
    const { orderId } = req.body;
       
    try {
        const order = await orderdb.findById(orderId);
      
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        // Create a new Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: order.totalAmount * 100, // Amount in paise
            currency: 'INR',
            payment_capture: 1
        });

        res.json({ success: true, order: razorpayOrder });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ success: false, message: 'Error creating Razorpay order' });
    }
}



const paymentSucces = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        
        const order = await orderdb.findById(orderId);
        
        const items=order.items
        for (const item of items) {
          const product = await productdb.findById(item.productId);
        product.stock -= item.quantity;
            product.count += 1;
            product.save()
        }
        order.status = 'Pending';
        order.paymentStatus = 'Completed';
        order.paymentMethod='online'
        await order.save();
        return res.redirect('/userorders')


    } catch (error) {
        console.log(error);
        res.redirect('/error500');

    }
}
const walletpay = async (req, res) => {
    try {
        const { totalamount, data, paymentMethod,coupondiscount } = req.body;
        const { items, addressId } = data;

        // Check if address exists
        const address = await addressdb.findById(addressId);
        if (!address) {
            return res.status(401).json({ message: 'Address not found', status: 401 });
        }

        // Find user by session email
        const User = await userdb.findOne({ email: req.session.email });
        if (!User) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userId = User._id;

        // Check wallet balance
        const wallet = await walletdb.findOne({ user: userId });
        if (!wallet || wallet.balance < totalamount) {
            return res.status(400).json({ message: 'Insufficient wallet balance' });
        }

        // Process items
        const updatedProducts = [];
        for (const item of items) {
            const productId = item.productId;
            const product = await productdb.findById(productId);

            if (!product) {
                console.log(`Product with ID ${productId} not found`);
                continue;
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Product with ID ${productId} is out of stock` });
            }

            // Apply offer and calculate price
            const prod = await applyoffer(product);
            updatedProducts.push({
                productId: item.productId,
                price: item.offerPrice,
                quantity: item.quantity,
            });
        }

        // Create order
        const order = new orderdb({
            userId: userId,
            items: updatedProducts,
            totalAmount: totalamount,
            address: address,
            paymentMethod: paymentMethod,
            paymentStatus: 'Completed',
            status: 'Pending',
            couponDiscount:coupondiscount


        });
        await order.save();

        // Update wallet
        await walletdb.findOneAndUpdate(
            { user: userId },
            {
                $inc: { balance: -totalamount },
                $push: { transactions: { type: 'withdrawal', amount: totalamount, description: 'Order payment' } }
            }
        );

        // Update product stock and count
        for (const item of updatedProducts) {
            await productdb.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity, count: 1 }
            });
        }

        // Clear cart
        await cartdb.findOneAndDelete({ user: userId });

        res.json({ message: "Order completed successfully" });

    } catch (error) {
        console.error("Error processing wallet payment:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




const apply_coupon = async (req, res) => {
    const { couponCode, totalAmount } = req.body;

    const coupon = await coupondb.findOne({ couponcode: couponCode });
    if (!coupon || coupon.expireDate < new Date()) {
        return res.status(400).json({ message: 'Expired coupon' });
    }

    if (coupon.minPurchaseAmount > totalAmount) {
        return res.status(400).json({ message: `Purchase must be above ₹${coupon.minPurchaseAmount}` });
    }

    let discount = parseInt(totalAmount * coupon.discountPercentage) / 100;

    // Use maxDiscountAmount from the coupon
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
    }

    const newTotalAmount = Math.round(totalAmount - discount);
    res.json({ newTotalAmount, discount });
};






const removeCoupon = async (req, res) => {
    const { couponCode } = req.body;

    try {
        // You can add logic to update/remove the coupon usage in the database here if needed
        res.json({ success: true, message: 'Coupon removed successfully' });
    } catch (error) {
        console.error('Error removing coupon:', error);
        res.status(500).json({ success: false, message: 'Failed to remove coupon' });
    }
};





module.exports = {applyoffer,failpayment,removeCoupon,apply_coupon,get_checkout,retrypayment,cod,check_stock,placed, onlinepayment,onlinepayed,paymentSucces,walletpay}