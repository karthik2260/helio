const productdb =require('../../model/product')
const Categorydb = require('../../model/category')
const offerdb=require('../../model/offermodel')
const mongoose = require('mongoose');
const moment = require('moment')


const get_offer=async(req,res)=> {
    try {


        const offers = await offerdb.find()
            .populate('product_name')
            .populate('category_name', 'CategoryName');

            offers.forEach(offer => {
                offer.formattedExpiryDate = moment(offer.expiryDate).format('DD/MM/YYYY');
            });
            
       

        res.render('admin/offer', { offers })

    } catch (error) {
        console.log(error);
        res.redirect('/error500')

    }
}


const add_offer=async(req,res)=>{
    try {
        const products = await productdb.find({}, 'product_name');
        const categories = await Categorydb.find({}, 'CategoryName');
        

        res.render('admin/add_offer', { products, categories, errorMessage: '' });

    } catch (error) {
        console.log(error);
        res.redirect('/error500')

    }
}

const adding = async (req, res) => {
    try {
        const { offerName, offerType, productId, categoryId, productDiscount, categoryDiscount, StartingDate, expiryDate } = req.body;
        
        if (offerType === 'category' && !categoryId) {
            return res.status(400).send('Category ID is required for category offer');
        }
        if (offerType === 'product' && !productId) {
            return res.status(400).send('Product ID is required for product offer');
        }

        let productExists = true;
        let categoryExists = true;

        if (productId) {
            productExists = await productdb.exists({ _id: productId });
        }
        if (categoryId) { 
            categoryExists = await Categorydb.exists({ _id: categoryId });
        }
        if (!productExists) {
            return res.status(400).send("The selected product does not exist");
        }
        if (!categoryExists) {
            return res.status(400).send("The selected category does not exist");
        }

        const existingOffer = offerType === 'product'
            ? await offerdb.findOne({ product_name: productId })
            : await offerdb.findOne({ category_name: categoryId });

        if (existingOffer) {
            const errorMessage = `An offer already exists for the selected ${offerType}`;
            const products = await productdb.find({}, 'product_name');
            const categories = await Categorydb.find({}, 'CategoryName');
            return res.render('admin/add_offer', { products, categories, errorMessage });
        }

        // Find the product or category and update the price accordingly
        let discountPercentage = productDiscount || categoryDiscount;
        if (offerType === 'product') {
            let product = await productdb.findById(productId);
            let offerPrice = product.price - (product.price * discountPercentage / 100);
            product.offerPrice = offerPrice; // Update offer price
            await product.save(); // Save the updated product
        }

        const newOffer = new offerdb({
            offerName: offerName,
            offerType: offerType,
            product_name: mongoose.Types.ObjectId.isValid(productId) ? productId : null,
            category_name: mongoose.Types.ObjectId.isValid(categoryId) ? categoryId : null,
            discount_Percentage: discountPercentage,
            startingDate: StartingDate,
            expiryDate: expiryDate,
            unlist: false
        });

        await newOffer.save();
        res.redirect('/offers');
    } catch (error) {
        console.log(error);
        res.redirect('/error500');
    }
}


const unlistOffer = async (req, res) => {
    try {
        const offerId = req.query.id;
        const offers = await offerdb.findById(offerId);
        offers.status = offers.status === 'active' ? 'blocked' : 'active';
        await offers.save()
        if (offers.offerType === 'product' && offers.status === 'blocked') {
            let product = await productdb.findById(offers.product_name);
             product.offerPrice = product.price 
            await product.save(); // Save the updated product
        }

        res.redirect('/offers');
    } catch (error) {
        console.log(error);
        res.redirect('/error500')

    }
}


const editOffer = async (req, res) => {
    try {
        const products = await productdb.find({}, 'product_name');
        const categories = await Categorydb.find({}, 'CategoryName');
        const id = req.params.id;
        const offer = await offerdb.findById(id);
        
        if (!offer) {
            return res.status(404).send("Offer not found");
        }

        const POPproducts = offer.product_name ? await productdb.findById(offer.product_name) : null;
        const POPcategories = offer.category_name ? await Categorydb.findById(offer.category_name) : null;

        // Prepare the data to be sent to the view
        const get = {
            _id: offer._id,
            offerName: offer.offerName,
            offerType: offer.offerType,
            categoryId: offer.category_name,
            productId: offer.product_name,
            discount: offer.discount_Percentage,
            startingDate: offer.startingDate,
            expiryDate: offer.expiryDate
        };

        console.log("Offer data being sent to view:", get);

        res.render('admin/edit_offer', { 
            get, 
            products, 
            categories, 
            errorMessage: '', 
            POPproducts, 
            POPcategories 
        });
    } catch (error) {
        console.error("Error in editOffer:", error);
        res.status(500).send("Internal Server Error");
    }
};


const postedit=async(req,res)=>{
    try {

        
        const offerid = req.params.id;
        
        const {offerName,
            offerType,
            categoryId,
            categoryDiscount,
            productId,
            productDiscount,
            startingDate,
            expiryDate
        } = req.body;
        const category_name = offerType === "category" ? categoryId : null;
        const product_name = offerType === "product" ? productId : null; 
        const discount = categoryDiscount != '' ? categoryDiscount : productDiscount
        const updateData = {
            offerName,
            offerType,
            category_name,
            product_name,
            discount_Percentage : Number(discount),
            startingDate,
            expiryDate
        }
        console.log(updateData);

        const updatedData = await offerdb.findByIdAndUpdate(offerid, updateData, { new: true })
        

        await updatedData.save()
        res.redirect('/offers')



    } catch (error) {
        console.log(error.message);
        res.redirect('/error500')

    }
}




module.exports={
    get_offer,add_offer,adding,unlistOffer,editOffer,postedit
}