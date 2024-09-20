const Categorydb = require('../../model/category');
const productdb = require('../../model/product');
const wishlistdb=require('../../model/wishlistmodel')
const userdb=require('../../model/usermodel')
const cartdb = require('../../model/cartmodel')
const offerdb = require('../../model/offermodel')
const orderdb = require('../../model/ordermodel');
const {applyoffer} = require('./user_controller')




// const applyoffer = async (product) => {
//     if (!product) {
//         return null;
//     }

//     try {
//         const productOffer = await offerdb.findOne({
//             product_name: product._id,
//             status: 'active'
//         });
       

//         const categoryOffer = await offerdb.findOne({
//             category_name: product.Category._id, // Ensure this matches the field used in product's schema
//             status: 'active'
//         });

//         if (productOffer && typeof productOffer.discount_Percentage === 'number') {
//             product.offerPrice = Math.round(product.price - (product.price * (productOffer.discount_Percentage / 100)));
//             console.log("Applied product offer");
//         } else if (categoryOffer && typeof categoryOffer.discount_Percentage === 'number') {
//             product.offerPrice = Math.round(product.price - (product.price * (categoryOffer.discount_Percentage / 100)));
//             console.log("Applied category offer");
//         } else {
//             product.offerPrice = product.price;
//             console.log("No offers applied");
//         }
//     } catch (error) {
//         console.error('Error applying offer:', error);
//     }

//     return product;
    
// };




const categoryProducts = async (req, res) => {
    try {
        let cartCount = 0;
        let wishCount = 0;
        // Fetch the category using the category ID from the route parameter
        const category = await Categorydb.findById(req.params.id);
        let wishlist = null;

        
        if (!category) {
            console.error('Category not found');
            return res.redirect('/err500');
        }
        if (req.cookies.userToken && req.session.email) {
            const user = await userdb.findOne({ email: req.session.email });
            if (user) {
                const cart = await cartdb.findOne({ user: user._id });
                cartCount = cart ? cart.items.length : 0;
                wishlist = await wishlistdb.findOne({ user: user._id });
                wishCount = wishlist ? wishlist.items.length : 0;
            }
        }
        // Fetch products under the specific category
        const products = await productdb.find({ Category: category._id,list:'listed' }).populate('Category');
        for (const product of products) {
            await applyoffer(product);
           
        }
        console.log(`Number of products in category ${category.CategoryName}: ${products.length}`);

        // Render the products page with the fetched products
        res.render('user/category', {
            products,
            wishCount,
            cartCount,
            category,
            wishlist: wishlist || {}
        });

    } catch (err) {
        console.error(err);
        res.redirect('/err500');
    }
}




const gaming = async(req,res) => {
    try {
        const businesscategory = await Categorydb.findOne({CategoryName:'GAMING'})
       
        const businessproduct = await productdb.find({Category:businesscategory._id}).populate('Category')
         //console.log(businessproduct);

        res.render('user/products',{products:businessproduct,businesscategory,pages:0,wishCount:0,cartCount:0,wishlist:0})
    }catch (err){
        console.error(err)
        res.redirect('/err500')
    }
}




const convertible= async(req,res)=>{
    try{
    const businesscategory =await Categorydb.findOne({CategoryName:'CONVERTIBLE'});
  
    const businessproduct =await productdb.find({Category:businesscategory._id}).populate('Category')
       console.log(businessproduct);
    res.render('user/products',{products:businessproduct,businesscategory,pages:0,wishCount:0,cartCount:0,wishlist:0})
    
    }catch(err){
        console.error(err);
       res.redirect('/err500')
    }
}


const allproduct = async (req, res) => {
    try {
        let cartCount = 0;
        let wishCount = 0;

        const limit = 8;
        const page = parseInt(req.query.page) || 1;

        const products = await productdb.find({ list: 'listed' })
            .populate('Category')
            .skip((page - 1) * limit)
            .limit(limit);

        for (const product of products) {
            await applyoffer(product);
        }

        const category = await Categorydb.find();

        const totalListedProducts = await productdb.countDocuments({ list: 'listed' });
        const pages = Math.ceil(totalListedProducts / limit);
        let wishlist = null;

        if (req.cookies.userToken && req.session.email) {
            const user = await userdb.findOne({ email: req.session.email });
            if (user) {
                const cart = await cartdb.findOne({ user: user._id });
                cartCount = cart ? cart.items.length : 0;
                wishlist = await wishlistdb.findOne({ user: user._id });
                wishCount = wishlist ? wishlist.items.length : 0;
            }
        }

        res.render('user/products', {
            products,
            wishCount,
            cartCount,
            category,
            pages,
            currentPage: page,
            wishlist: wishlist || {}
        });

    } catch (err) {
        console.log('Error fetching products:', err);
        res.redirect('/error500');
    }
};


const shopeCata=async(req,res)=>{
    try{
     const categoryId=req.body.items
     const category = await categorydb.findById(categoryId)
     let pages = await productdb.countDocuments({ Category: category.id});
     pages = Math.ceil(pages/8)
     const products = await productdb.find({ Category: category,list:'listed' }).populate('Category').limit(8);
     for (const product of products) {
        await applyoffer(product);
    }
      res.status(200).json({products,pages})
        
         
    
    }catch(err){
     console.log(err);
     res.redirect('/error500')
    }
 }

 const sortproduct = async (req, res) => {
    try {
        const { brand, sort, word } = req.body; // Get brand and search keyword from request body
        let filter = { list: 'listed' };
        let sortOption = {};

        if (brand) {
            filter.brand = brand;
        }

        if (word) {
            const regex = new RegExp(word.trim(), 'i');
            filter.$or = [
                { product_name: { $regex: regex } },
                { brand: { $regex: regex } },
                { color: { $regex: regex } },
                { description: { $regex: regex } }
            ];
        }

        switch (sort) {
            case '2':
                sortOption = { price: 1, offerPrice: 1 }; // Low to High
                break;
            case '3':
                sortOption = { price: -1, offerPrice: -1 }; // High to Low
                break;
            case '4':
                sortOption = { product_name: 1 }; // A to Z
                break;
            case '5':
                sortOption = { product_name: -1 }; // Z to A
                break;
            case '6':
                sortOption = { createdAt: -1 }; // Newest
                break;
            default:
                sortOption = {};
        }

        const products = await productdb.find(filter).populate('Category').sort(sortOption).limit(8);
        res.json({ products });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'An error occurred' });
    }
};


const search = async (req, res) => {
    try {
        const { word, brand, sort } = req.body;
        const query = word.trim();
        let filter = { list: 'listed' };

        if (query.length === 1) {
            // If the query is a single letter, search for products starting with that letter
            filter.product_name = new RegExp(`^${query}`, 'i');
        } else {
            // For longer queries, use the existing search logic
            const regex = new RegExp(query, 'i');
            filter.$or = [
                { product_name: { $regex: regex } },
                { brand: { $regex: regex } },
                { color: { $regex: regex } },
                { description: { $regex: regex } }
            ];
        }

        if (brand) {
            filter.brand = brand;
        }

        let sortOption = {};
        switch (sort) {
            case '2': sortOption = { price: 1, offerPrice: 1 }; break;
            case '3': sortOption = { price: -1, offerPrice: -1 }; break;
            case '4': sortOption = { product_name: 1 }; break;
            case '5': sortOption = { product_name: -1 }; break;
            case '6': sortOption = { createdAt: -1 }; break;
        }

        const products = await productdb.find(filter).sort(sortOption).limit(8);
        res.status(200).json(products);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

const Catasort=async(req,res)=>{
    try {             
    
           
            const sortBySelect = req.body.selsect;
             let sortedProducts= await productdb.find()
            for (const sortedProduct of sortedProducts) {
                await applyoffer(sortedProduct);
            }
            let pages = await productdb.countDocuments();
            pages = Math.ceil(pages/8)
    
                switch(sortBySelect){
                    case '1':next = await productdb.find({list:'listed' }).limit(8).skip(jump).populate("Category");
                        break;
                    case '2': 
                            sortedProducts = await productdb.find({ list:'listed' }).sort({ price: 1,offerPrice:1,discount:1 }).limit(8)
                          
                        break;
                    case '3':
                            sortedProducts = await productdb.find({ list:'listed' }).sort({ price: -1,offerPrice:-1,discount:-1 }).limit(8)
                        break;
                    case '4':
                            sortedProducts = await productdb.find({ list:'listed' }).sort({ product_name: 1 }).limit(8)
                            break;
                    case '5':
                            sortedProducts = await productdb.find({ list:'listed' }).sort({ product_name: -1 }).limit(8)
                        break;    
                    case '6':
                        sortedProducts = await productdb.find({ list:'listed' }).sort({ _id: -1 }).limit(8)
                        break;
                    default:
                        sortedProducts = await productdb.find({ list:'listed' }).limit(8)
                }
                
                
                
                res.json({sortedProducts,pages})
                res.status(200)
    
              
    } catch (error) {
        console.log(error);
        res.redirect('/error500')
        
    }
    }

    const allpage=async(req,res)=>{
        const{page,cata,sort}=req.query
    
        let jump = (page-1) * 8;
        let next= await productdb.find()
        for (const sortedProduct of next) {
            await applyoffer(sortedProduct);
        }
    
        switch(sort){
            case '1':next = await productdb.find({ list:'listed' }).limit(8).skip(jump).populate("Category");
                 break;
            case '2': 
                      next  = await productdb.find({ list:'listed' }).sort({ price: 1,offerPrice:1,discount:1  }).limit(8).skip(jump).populate("Category");
                  
                break;
            case '3':
                    next = await productdb.find({ list:'listed' }).sort({ price: -1,offerPrice:-1,discount:-1 }).limit(8).skip(jump).populate("Category");
                break;
            case '4':
                    next = await productdb.find({ list:'listed' }).sort({ product_name: 1 }).limit(8).skip(jump).populate("Category");
                    break;
            case '5':
                    next = await productdb.find({list:'listed' }).sort({ product_name: -1 }).limit(8).skip(jump).populate("Category");
                break;    
            case '6':
                next = await productdb.find({list:'listed' }).sort({ _id: -1 }).limit(8).skip(jump).populate("Category");
                break;
            default:
                next = await productdb.find({ list:'listed'}).populate("Category");
        }
        
        return res.status(200).json({ next});
    }
    
    
    const pagination=async(req,res)=>{
        
     
     
     const{page,cata,sort}=req.query
     console.log(page, cata, sort + "  this is my console")
    
     let jump = (page-1) * 8;
     
     let next= await productdb.find()
    
     for (const sortedProduct of next) {
         await applyoffer(sortedProduct);
     }
    
     
        const category = await categorydb.findById(cata)
        switch(sort){
            case '1':next = await productdb.find({ Category: category.id,list:'listed' }).limit(8).skip(jump).populate("Category");
                 break;
            case '2': 
                      next  = await productdb.find({ Category: category.id,list:'listed' }).sort({price: 1,offerPrice:1,discount:1 }).limit(8).skip(jump).populate("Category");
                  
                break;
            case '3':
                    next = await productdb.find({ Category: category.id,list:'listed' }).sort({price: -1,offerPrice:-1,discount:1  }).limit(8).skip(jump).populate("Category");
                break;
            case '4':
                    next = await productdb.find({ Category: category.id,list:'listed' }).sort({ product_name: 1 }).limit(8).skip(jump).populate("Category");
                    break;
            case '5':
                    next = await productdb.find({ Category: category.id,list:'listed' }).sort({ product_name: -1 }).limit(8).skip(jump).populate("Category");
                break;    
            case '6':
                next = await productdb.find({ Category: category.id,list:'listed' }).sort({ _id: -1 }).limit(8).skip(jump).populate("Category");
                break;
            default:
                next = await productdb.find({ Category: category.id, list:'listed'}).populate("Category");
        }
        
        return res.status(200).json({ next});
    
    }




module.exports = {Catasort,pagination,allpage,shopeCata,categoryProducts,gaming,applyoffer,convertible,allproduct,sortproduct,search}