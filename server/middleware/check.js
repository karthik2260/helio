const jwt=require('jsonwebtoken')
const userdb= require('../model/usermodel')



const adminCheck=async(req,res,next)=>{
    if(req.cookies.adminToken){
        next()
    }else{
        res.redirect('/adminsignup')
    }
}



const checkUser=async(req,res,next)=>{
  
    if(req.session.email){
      
      const user= await userdb.findOne({email:req.session.email})
    
      if(user&&user.status=='active'){
        next()
      }else{
        res.redirect('/userlogin')
      }
    }else{
      res.redirect('/userlogin')
    }
  }
  const active = async (req, res, next) => {
    try {
        if (req.session.email) {
            const user = await userdb.findOne({ email: req.session.email });

            if (!user) {
               
                req.session.email = null;
                req.session = null;
                res.clearCookie('userToken');
                return res.redirect('/login'); 
            }

            if (user.status === 'blocked') {
               
                req.session.email = null;
                req.session = null;
                res.clearCookie('userToken');
                console.log("hiiiiiii");
                return res.redirect('/block'); 
            }

          
            next();
        } else {
         
            req.session.email = null;
            req.session = null;
            res.clearCookie('userToken');
            return res.redirect('/login'); 
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error'); 
    }
};






const checklog=async(req,res,next)=>{
  if (req.session.email){
    next()
  }else {
    res.redirect('/login')
  }
}


module.exports={
    adminCheck,checkUser,active,checklog
}