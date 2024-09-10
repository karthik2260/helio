const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const userdb = require('../../model/usermodel')
const productdb = require('../../model/product')
const dotenv = require('dotenv')
dotenv.config({path:'.env'})
const offerdb=require('../../model/offermodel')
const wishlistdb=require('../../model/wishlistmodel')
const cartdb = require('../../model/cartmodel')
const Categorydb = require('../../model/category')



googleapppassword = 'qwiq vbcl nrea ajne'
googlemailname = 'karthik.dhanalekshmi@gmail.com'







const createTransporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'karthik.dhanalekshmi@gmail.com',
    pass: 'qwiq vbcl nrea ajne',
  },
});










const get_login = async (req, res) => {
    try{
      console.log("Recieved request for sigin");
      if(req.cookies && req.cookies.userToken) {
        console.log('User token found , redirecting to home');
        res.redirect('/')
      }else{
        console.log("No user token found , rendering login page");
        res.render('user/user_login',{message:""})
      }
    }catch(err){
      console.log(err);
      res.redirect('/err500')

    }
  
  }







  const get_sigin = async (req, res) => {
    try {
      if (req.cookies && req.cookies.userToken) {
        res.redirect('/');
      } else {
        res.render('user/user_signup', { message: '' });
      }
    } catch (err) {
      console.log(err);
      res.redirect('/err500');
    }
  };






const post_login = async (req,res) => {
  try {
    const {email,password} = req.body;
    const user = await userdb.findOne({email:email})

    if(!user) {
      return res.render('user/user_login' , {message : 'incorrect email'})
    }
    if(user.password != password){
      return res.render('user/user_login',{message : 'incorrect password'})
    }
    if(user.status == 'blocked') {
      return res.render('user/user_login',{message:'User is blocked'})
    }
    if(user){

      const userToken = jwt.sign(
        {email : req.body.email} , 'your key' , {expiresIn : '1hr'}
      );
      req.session.email = req.body.email;
      res.cookie('userToken',userToken);
      res.redirect('/')
    }else{
      res.render('user/user_login' , {message : "Email doesn't exists"})
    }
  } catch (error) {
    console.log(error);
    res.redirect('/error500')
  }

}











const signup = async (req, res) => {
  if (req.cookies.userToken) {
    return res.redirect('/');
  } else if (req.session.otp) {
    delete req.session.otp;
    return res.render('user/user_signup', { message: "" });
  }

  const { name, email, pass, referral_code } = req.body;

  const existuser = await userdb.findOne({ email });
  if (existuser) {
    return res.render('user/user_signup', { message: 'Email already exists' });
  }

  // Check referral code if provided
  let referrer = null;
  if (referral_code) {
    const upperCaseReferralCode = referral_code.toUpperCase();
    referrer = await userdb.findOne({ referralCode: upperCaseReferralCode });
    if (!referrer) {
      return res.render('user/user_signup', { message: 'Invalid referral code' });
    }
  }

  // Generate new referral code for the signing up user
  const newReferralCode = await generateReferralCode(8);

  req.session.Nname = name;
  req.session.Eemail = email;
  req.session.Ppass = pass;
  req.session.referralCode = newReferralCode;
  req.session.referredBy = referrer ? referrer._id : null;

  const otp = generateOTP();
  console.log(otp);
  req.session.otp = otp;

  createTransporter.sendMail({
    from: 'karthik.dhanalekshmi@gmail.com',
    to: email,
    subject: 'Your OTP verification',
    text: `Your OTP is ${otp}`
  }, (err, info) => {
    if (err) {
      console.log('Error sending email', err);
      res.render('user/user_signup', { message: 'Error sending OTP via email' });
    } else {
      console.log("OTP sent successfully", info.response);
      res.render('user/otp', { email: email, message: "", error: '' });
    }
  });
};

// Function to generate unique referral code
const generateReferralCode = async (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  // Ensure the generated code is unique
  const existingUser = await userdb.findOne({ referralCode: result });
  if (existingUser) {
    return generateReferralCode(length); // Recursively try again
  }
  
  return result;
};






  const resend = async (req,res) => {
    const recipientEmail = req.body.email || req.session.Eemail;
    const otp = generateOTP();
    req.session.otp = otp
    createTransporter.sendMail({
      from: 'karthik.dhanalekshmi@gmail.com',
      to: recipientEmail,
      subject: 'your OTP verification',
      text: `your OTP is ${otp}`
    }, (err, info) => {
                                                                 
      if (err) {
        console.log('Error sending email', err);
        res.render('user/user_signup', { message: 'Error sending OTP via email' })
      } else {
       

        console.log(otp);
        console.log('OTP sent Succesfully', info.response);
         res.render('user/otp', { email: req.body.email, message: "", error: '' });
        //res.redirect('/otp')

      }
    })



  }
  

  function generateOTP() {
    const length = 5;
    const digits = '0123456789';
  
    let otp = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length);
      otp += digits.charAt(randomIndex)
    }
    return otp
  }







const verify = async(req,res) => {
  if(req.session.otp == req.body.otp) {
    req.session.email = req.session.Eemail;
    console.log(req.session.Ppass);
    const user = new userdb({
      name : req.session.Nname,
      email : req.session.Eemail,
      password : req.session.Ppass,
      referralCode : req.session.referralCode ,
      referredBy: req.session.referredBy ,

    })
    delete req.session.otp;
    await user.save();
    const userToken = jwt.sign(
      {email : req.session.Eemail} , 'your_key' , {expiresIn:'1h'}
    );
    res.cookie('userToken',userToken);
    res.redirect('/');
} else {
  res.status(400).render('user/otp',{message:'OTP is not matching',error:''})
}

}





const logout = async (req,res) => {
  req.session.email = null;
  res.clearCookie('userToken');
  res.redirect('/')

}



const block = async (req,res) => {
  res.render('user/block')
}

const index = async (req, res) => {
  try {
    let wishlist = null;
    let cart = null; // Initialize cart to null
    let cartCount = 0;
    let wishCount = 0;

    if (req.cookies.userToken) {
      const user = await userdb.findOne({ email: req.session.email });

      if (user && user.status === "block") {
        return res.redirect('/block');
      }

      if (user) {
        wishlist = await wishlistdb.findOne({ user: user._id });
        wishCount = wishlist ? wishlist.items.length : 0;
        cart = await cartdb.findOne({ user: user._id }); // Assign cart here
        cartCount = cart ? cart.items.length : 0;
      }
    }

    const products = await productdb.find().populate('Category');
    for (const product of products) {
      await applyoffer(product);
    }
    const Categories = await Categorydb.find();

    res.render('user/index', { products, userToken: req.cookies.userToken, wishlist, cart, wishCount, cartCount, Categories });

  } catch (err) {
    console.log(err);
    res.redirect('/err500');
  }
};
 


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



const forgotemail = async(req,res) => {
  res.render('user/forgot')
}


 const post_forgot = async(req,res) => {
  try{
    const email = req.body.email;
    const user = await userdb.findOne({email:email})

    if(!user){
      res.render('user/user_login',{message : 'email not exist'})
    }

    const recipientEmail = req.body.email
    console.log(recipientEmail,'akhil');
    req.session.forgotemail = req.body.email;
    const otp = generateOTP();


    req.session.forgot = otp
    console.log(otp,'ysdjygj');

    createTransporter.sendMail({
      from : 'karthik.dhanaalekshmi@gmail.com',
      to : recipientEmail,
      subject : 'Your otp verification',
      text : 'Your OTP is ${otp}'
    }, (err,info) => {
      if(err) {
        console.log('Error sending email',err);
        res.render('user/user_login',{message : 'Error sending OTP via email '})
      }else{
        console.log(otp);
        console.log('OTP sent successfully' , info.response);
        res.render('user/forgot_otp',{email:req.body.email,message:"",error:''})
      }
    })
  }catch(err){
    console.log(err);
    redirect('/err500')
  }
 }
 


const forgot_verify = async(req,res) => {
  if(req.session.forgot == req.body.otp){
    res.render('user/reset_password')
  }else{
    res.render('user/forgototp',{message : "OTP is not matching",error : ""})
  }
}

const reset_password = async(req,res) => {
  try {
    const password = req.body.password
    const user = await userdb.findOne({email:req.session.forgotemail})
    user.password = password
    await user.save();
    res.redirect('/login')
  }catch(err){
    console.log(err);
    res.redirect('/err500')
  }
}





const forgot_resent=async(req,res)=>{
  try{
   
  

  

  const recipientEmail = req.session.forgotemail 
   
      const otp = generateOTP();
   

    req.session.forgot = otp
  


    createTransporter.sendMail({
      from: 'karthik.dhanalekshmi @gmail.com',
      to: recipientEmail,
      subject: 'your OTP verification',
      text: `your OTP is ${otp}`
    }, (err, info) => {
                                                                 
      if (err) {
        console.log('Error sending email', err);
        res.render('user/user_login', { message: 'Error sending OTP via email' })
      } else {
       

        console.log(otp);
        console.log('OTP sent Succesfully', info.response);
        res.render('user/forgot_otp', { email: req.body.email, message: "", error: '' });

      }
    })

  }catch(err){
    console.log(err);
    redirect('/err500')
  }


}





















// const productDetails = async(req,res) => {
//   try {
//     const product = await productdb.findById(req.params.id);
//     if(!product){
//       return res.status(404).render('error'),{message:'Product Not Found'}
//     }
//     res.render('productDetails',{product})
//   }catch (error) {
//     console.log(error);
//     res.status(500).render('error',{message:'Server error'})
//   }
// }


// app.get('/product/:id', async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) {
//       return res.status(404).send('Product not found');
//     }
//     res.render('product', { product });
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// });



const productDetails = async (req,res) => {
  try {
    let wishlist = null;
    let cartCount = 0;
    let wishCount = 0;
    if (req.cookies.userToken) {
      const user = await userdb.findOne({ email: req.session.email });

      if (user && user.status === "block") {
        return res.redirect('/block');
      }
    const product = await productdb.findById(req.params.id);
    await applyoffer(product);
    const products = await productdb.find().populate('Category');
    for (const product of products) {
      await applyoffer(product);
     
  }    if (user) {
      wishlist = await wishlistdb.findOne({ user: user._id });
      wishCount = wishlist ? wishlist.items.length : 0;
        const cart = await cartdb.findOne({ user: user._id });
        cartCount = cart ? cart.items.length : 0;
    }
    // console.log(product.images[0]);
    res.render('user/productDetail',{products,product,wishlist, wishCount, cartCount})
  }
  }catch (error){
    console.log(error);
  }
}









  module.exports = {forgot_resent,block,get_login,productDetails,post_login,get_sigin,signup,index,applyoffer,resend,forgotemail,post_forgot,verify,forgot_verify,logout,reset_password}
