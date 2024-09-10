const jwt = require('jsonwebtoken');
const userdb = require('../../model/usermodel')
const productdb=require('../../model/product')
const offerdb=require('../../model/offermodel')
const categorydb = require('../../model/category')
const wishlistdb=require('../../model/wishlistmodel')
const cartdb=require('../../model/cartmodel')
const orderdb = require('../../model/ordermodel');



const err=async(req,res)=>{
  res.render('admin/err500')
}




//ADMIN  LOGIN


const adminlogin = async(req,res) => {
  if(req.cookies.adminToken){
    res.redirect('/admin')
  }else{
    res.render('admin/admin_login')
  }
  
}

  
 
const adminsign = async (req,res) => {
  try {
    const credential = {
      email : "admin@gmail.com",
      password : "123"
    };

   
    if(req.body.email === credential.email && req.body.password === credential.password){
      const adminToken = jwt.sign(
        {email:credential.email},
        'your key',
        {expiresIn:'1hr'},

      );
      res.cookie('adminToken',adminToken)
      res.redirect('/admin')
    }else{
      res.redirect('/adminsignup?pass=wrong')
    }

  }catch(err){
    res.redirect('/?error=login_failed')
  }
}
  


const admindash = async (req, res) => {
  try {
      if(req.cookies.adminToken){
      const orders = await orderdb.find().populate('items.productId');
      

      const totalSales = orders.reduce((acc, order) => {
          order.items.forEach(item => {
              acc += item.quantity;
          });
          return acc;
      }, 0);

      const totalOrderAmount = orders.reduce((acc, order) => acc + order.totalAmount, 0);

      // Calculate total discount
      let totalDiscount = 0;
      orders.forEach(order => {
          order.items.forEach(item => {
              if (item.productId && item.productId.price != null) {
                  const productPrice = item.productId.price * item.quantity;
                
                  // const discountedPrice = productPrice * ( (item.productId.discount / 100));
                  const discountedPrice =  item.productId.discount;
                  // const discountAmount = productPrice - discountedPrice;
                 
                  totalDiscount += discountedPrice;
              }
          });
      });
      totalDiscount = Math.round(totalDiscount);
      
      const products = await productdb.find();
      const categories = await categorydb.find();

      const productCounts = products.map(product => ({
          productId: product._id,
          name: product.product_name,
          count: product.count,
          images: product.images,
          category: product.Category,
          brand: product.brand
      }));


      const sortedProductCounts = productCounts.sort((a, b) => b.count - a.count);


      const brandSales = {};
      orders.forEach(order => {
          order.items.forEach(item => {
              if (item.productId && item.productId.brand) {
                  const brand = item.productId.brand;
                  if (!brandSales[brand]) {
                      brandSales[brand] = 0;
                  }
                  brandSales[brand] += item.quantity;
              }
          });
      });

      //sorting
      const sortedBrandSales = Object.keys(brandSales)
          .map(brand => ({ brand, count: brandSales[brand] }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // Top 10 brands

      // Calculate total sales for each category
      const categorySales = {};
      orders.forEach(order => {
          order.items.forEach(item => {
              if (item.productId && item.productId.Category) {
                  const category = item.productId.Category.toString();
                  if (!categorySales[category]) {
                      categorySales[category] = 0;
                  }
                  categorySales[category] += item.quantity;
              }
          });
      });


      const sortedCategorySales = Object.keys(categorySales)
          .map(categoryId => {
              const category = categories.find(c => c._id.toString() === categoryId);
              return {
                  CategoryName: category ? category.CategoryName : "Unknown",
                  count: categorySales[categoryId]
              };
          })
          .sort((a, b) => b.count - a.count);

      

      res.render('admin/dashboard', {
          orders,
          totalSales,
          totalOrderAmount,
          productCounts,
          sortedProductCounts,
          sortedCategorySales,
          totalDiscount,
          sortedBrandSales
      });

  }else{
      res.render('admin/admin_login')
  }
  } catch (error) {
      res.redirect('/error500');
  }
};




const adminlogout=async(req,res)=>{
  res.clearCookie('adminToken')
  res.redirect('/adminsignup')
}





const block = async (req,res) => {
  try {
    const blockid = req.query.id;
    const user = await userdb.findById(blockid);
    if(!user) {
      return res.status(404).send("User not found")
    }
    user.status = user.status === 'active' ? 'blocked' : 'active'
    await user.save();
    res.redirect('/userdetail')
  } catch (error){
    console.error('An error occured',error);
    res.status(500).send("Internal server error")
  }
}










  module.exports = {
    err,adminlogin,adminsign,admindash,adminlogout,block,
  }