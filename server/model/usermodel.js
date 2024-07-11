const mongoose=require("mongoose")


const userSchema= new mongoose.Schema({
    name:{
        type:String,
        trim:true,
        required:true,
        min:3,
        max:20,
    },
    email:{
          type:String,
          trim:true,
          required:true,
          unique:true,
          lowerCase:true,
    },
    googleId:{
        type:String
    },
    gender:String,
    status:{
        type:String,
        default:'active'
    },
    createdAt:{
        type:Date,
        default:()=> new Date().toISOString().split('T')[0]
    },
    password:{
        type:String
    },
    profilePicture:{
        type:String
    }
},
   {
    timestamps:true
   })


   const userdb=mongoose.model('userdb',userSchema)
   module.exports=userdb 