const mongoose = require ('mongoose')
const userSchema = mongoose.Schema({
    fullname: String,
    email:String,
    password:String, 
    otp:Number,
    profile:String
})
module.exports = mongoose.model("userlogin",userSchema)