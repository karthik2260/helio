const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const userdb = require('../../model/usermodel')
const productdb = require('../../model/product')
const dotenv = require('dotenv')
dotenv.config({path:'.env'})
const otpGenerator = require('otp-generator')







const createTransporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.googlemailname,
    pass: process.env.googleapppassword,
  },
});







const get_login = async (req, res) => {
    try{
      console.log("Recieved request for sigin");
      if(req.cookies && req.cookies.userToken) {
        console.log('User token found , redirecting to home');
        res.redirect('/home')
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
        res.redirect('/home');
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
      return res.render('/user/user_login' , {message : 'incorrect email'})
    }
    if(user.password != password){
      return res.render('user/user_login',{message : 'incorrect password'})
    }
    if(user.status == 'blocked') {
      return res.render('user/user_login',{message:'User iss blocked'})
    }
    if(user){

      const userToken = jwt.sign(
        {email : req.body.email} , 'your key' , {expiresIn : '1hr'}
      );
      req.session.email = req.body.email;
      res.cookie('userToken',userToken);
      res.redirect('/home')
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
      res.redirect('/home')
    } else if (req.session.otp) {
      delete req.session.otp;
      res.render('user/user_signup', { message: "", })
    }
  
    const existuser = await userdb.findOne({ email: req.body.email })
    req.session.Nname = req.body.name;
    req.session.Eemail = req.body.email;
    req.session.Ppass = req.body.pass;
    if (existuser) {
      res.render('user/user_signup', { message: 'email already exist', })
    } else {
  
      const recipientEmail = req.body.email
  
      const otp = generateOTP();
      console.log(otp);
  
      req.session.otp = otp
    
  
  
      createTransporter.sendMail({
        from: 'karthik.dhanalekshmi@gmail.com',
        to: recipientEmail,
        subject: 'your OTP verification',
        text: `your OTP is ${otp}`
      }, (err, info) => {
        console.log("hi");                                                            
        if (err) {
          console.log('Error sending email', err);
          res.render('user/user_signup', { message: 'Error sending OTP via email' })
        } else {
          console.log("keriyo");
  
  
          console.log('OTP sent Succesfully', info.response);
           res.render('user/otp', { email: req.body.email, message: "", error: '' });
          //res.redirect('/otp')
        }
      })
  
  
  
    }
  }



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
        // res.render('user/otp', { email: req.body.email, message: "", error: '' });
        res.redirect('/otp')

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
    })
    delete req.session.otp;
    await user.save();
    const userToken = jwt.sign(
      {email : req.session.Eemail} , 'your_key' , {expiresIn:'1h'}
    );
    res.cookie('userToken',userToken);
    res.redirect('/home');
} else {
  res.status(400).render('user/otp',{message:'OTP is not matching',error:''})
}

}





const logout = async (req,res) => {
  req.session.email = null;
  res.clearCookie('userToken');
  res.redirect('/login')

}




const index = async (req,res) => {
  try {
    if(req.cookies.userToken){
      const user = await userdb.findOne({email:req.session.email})

      const products = await productdb.find().populate("Category")
      if(user && user.status === "block"){
        res.redirect('/block')
      }else{
        res.render('user/index',{products,userToken:req.cookies.userToken})
      }


    }else{
      const products = await productdb.find().populate.find().populate('category')
      res.render('user/index',{products,userToken:undefined})
    }
  }catch(err){
    console.log(err);
    res.redirect('/err500')
  }
}










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
    req.session.forgotemail = req.body.email;
    const otp = generateOTP();


    req.session.forgot = otp

    createTransporter.sendMail({
      from : 'karthik.dhanaalekshmi@gmail.com',
      to : recipientEmail,
      subject : 'Your otp verification',
      text : 'Your OTP is $[otp}'
    }, (err,info) => {
      if(err) {
        console.log('Error sending email',err);
        res.render('user/user_login',{message : 'Error sending OTP via email '})
      }else{
        console.log(otp);
        console.log('OTP sent successfully' , info.response);
        res.render('user/forgototp',{email:req.body.email,message:"",error:''})
      }
    })
  }catch(err){
    console.log(err);
    redirect('/err500')
  }
 }
 









  module.exports = {get_login,post_login,get_sigin,signup,index,resend,forgotemail,post_forgot,verify,logout}
