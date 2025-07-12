const express = require("express")
const nodemailer = require("nodemailer")
const router = express.Router()
const jwt = require("jsonwebtoken")
const userlogin = require("../Model/user")
const { check, validationResult } = require('express-validator');
const bcrypt=require("bcrypt")
const crypto = require("crypto");
const { buffer } = require("stream/consumers");
const { error } = require("console");
const {env}=require('dotenv').config();

var multer = require('multer');
var path = require('path')

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
  }
})

var upload = multer({ storage: storage });
router.get("/userlogin", async (req, res) => {
    let user = await userlogin.find().exec()
    res.json(user)
})

router.post("/userlogin/register", [
     upload.single("profile"),
    check('email').isEmail().isLength({ min: 10, max: 30 }),
    check('password', 'Password length should be 8 to 10 characters')
        .isLength({ min: 8, max: 10 }),
    
   
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ errors: errors.array() });
    }

    try {
        const userdata = await userlogin.findOne({ userEmail: req.body.email });
        if (userdata) {
            return res.send({ message: "User already found" });
        }

        const hash = await bcrypt.hash(req.body.password, 10);
        const login = new userlogin({
            password: hash,
            email:req.body.email,
            profile:req.file ? req.file.filename : 'default.jpg' 
        });

        await login.save();
        return res.send({ message: "Registration successful" });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: "Server error" });
    }
});

router.post("/userlogin/verify", async (req, res) => {
    try {
        const user = await userlogin.findOne({ email: req.body.useremail });
        if (!user) {
            return res.status(400).send({ message: "User not found" });
        }
        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isMatch) {
            return res.status(400).send({ message: "Invalid credentials" });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_KEY, { expiresIn: '1h' });
        res.status(200).send({ message: "Login successful", token: token });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});

router.post