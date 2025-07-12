const mongoose=require("mongoose")
mongoose.connect("mongodb://localhost:27017/invoicemaster")
const db=mongoose.connection
db.on("error",()=>{
    console.log("error")
})
db.once('open',()=>{
    console.log("connection successful")
})