



const adminlogin = async (req, res) => {
    res.render( 'admin/admin_login')
  }


  const admindash = async(req,res) => {
    res.render('admin/dashboard')
  }

  // const adminproduct = async(req,res) => {
  //   res.render('admin/products')
  // }

  const err=async(req,res)=>{
    res.render('admin/err500')
  }
  
  

  module.exports = {
    adminlogin,admindash,err
  }