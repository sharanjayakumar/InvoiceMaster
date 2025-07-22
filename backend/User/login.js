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
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

var upload = multer({ storage: storage });
router.get("/userlogin", async (req, res) => {
    let user = await userlogin.find().exec()
    res.json(user)
})

router.post("/userlogin/register", [
    upload.single("profile"),
    check('fullname').isLength({ min: 4 }).withMessage("Full name must be at least 4 characters"),
    check('email').isEmail().isLength({ min: 10 }).withMessage("Enter a valid email"),
    check('password', 'Password must be at least 8 characters long').isLength({ min: 8 }),
    check('cpassword', 'Confirm password is required').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array() });
    }

    if (req.body.password !== req.body.cpassword) {
        return res.status(400).send({ message: "Passwords do not match" });
    }

    try {
        const existingUser = await userlogin.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(409).send({ message: "User already exists" });
        }

        const hash = await bcrypt.hash(req.body.password, 10);
        const newUser = new userlogin({
            fullname: req.body.fullname,
            email: req.body.email,
            password: hash,
            profile: req.file ? req.file.filename : 'default.jpg'
        });

        await newUser.save();
        return res.status(201).send({ message: "Registration successful" });
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

module.exports = router