const mongoose=require('mongoose')

const connectDB=async()=>{
    try{
        const con = await mongoose.connect("mongodb+srv://admin:karthik2260@cluster0.hunsu.mongodb.net/helio?retryWrites=true&w=majority&appName=Cluster0",{})
      console.log(`MongoDB connected: ${con.connection.host}`);
    }
    catch(err){
        console.log(err);
        process.exit(1);
    }
}
module.exports=connectDB