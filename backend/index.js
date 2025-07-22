const database = require("./database")
const userlogin = require("./User/login")
const dotenv = require("dotenv")
const express = require("express")
const cors = require("cors")

dotenv.config()
const app = express()
app.use(express.json())
app.use(cors())
app.use(userlogin)
app.listen(3000,()=>{
    console.log("Server running at port 3000")
})