const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const bcrypt = require("bcrypt");
const _ = require("lodash");
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

const router = express.Router();

var t = 0;
app.use(express.json());

mongoose.connect('mongodb+srv://yashashwisinghania:VzLsAmcRAe7Mj3Xn@cluster0.kqwltvl.mongodb.net/profileDB');

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(express.static(path.join(__dirname, 'views')));

app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'Views'));
app.use('/form', express.static(__dirname + '/index.html'));




app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("Public"));
app.set('trust proxy', 1);


app.use(session({
    secret: 'foo',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: 'mongodb+srv://yashashwisinghania:VzLsAmcRAe7Mj3Xn@cluster0.kqwltvl.mongodb.net/profileDB' })
}));


app.use(function(req, res, next) {
    if (!req.session) {
        return next(new Error('Oh no'))
    }
    next();
});

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("Connected to MongoDB!");
});

module.exports = db;

app.get("/", function(req, res) {
    res.render("home", { t: t });
});


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        lowercase: true,
        required: [true, "can't be blank"]
     },
    mobno: {
        type: Number,
        match: /^\d{10}$/, // This regex matches exactly 10 digits
        required: [true, 'Mobile number is required'],
        unique: true,
    },
    username: {
        type: String,
        lowercase: true,
        required: [true, "can't be blank"],
        match: [/^[a-zA-Z0-9]+$/, 'is invalid'],
        index: true,
        unique: true
     },
     email: {
        type: String,
        lowercase: true,
        required: [true, "can't be blank"],
        match: [/\S+@\S+\.\S+/, 'is invalid'],
        index: true
     },
     password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
     },
     confirmPassword: String
});

const User = mongoose.model("User", userSchema);

app.post("/",function(req,res){
    res.render("home");
});

app.get("/signup",function(req,res)
{
    res.render("signup", { t: t });
});

app.get("/login",function(req,res)
{
    res.render("login", { t: t });
});

if (t===0)
{app.post("/signup", async function (req, res) {
    const { name, mobno, username, email, password, confirmPassword } = req.body;
  
    // Check if passwords match
    if (password !== confirmPassword) {
        // Pass input fields' values back to the view
        return res.render("signup", { 
            error: "Passwords do not match",
            name,
            mobno,
            username,
            email
        });
    }
    
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
    
        // Create a new user instance
        const newUser = new User({
            name,
            mobno,
            username,
            email,
            password: hashedPassword,
        });
    
        // Save the user to the database
        await newUser.save();
    
        res.redirect("/login"); // Redirect to login page after signup
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create user" });
    }
});
}

var user;

app.post("/login", async function (req, res) {
    const { loginUsername, loginPassword } = req.body;

    try {
        // Find the user by username
        user = await User.findOne({ username: loginUsername });

        console.log(user);
        console.log(loginUsername);
        // Check if user exists
        if (!user) {
            console.log("User not found");
            return res.render("login", { error: "Invalid username or password" });
        }

        // Compare the provided password with the hashed password stored in the database
        const isPasswordMatch = await bcrypt.compare(loginPassword, user.password);

        if (isPasswordMatch) {
            // Passwords match, user authenticated successfully
            // Redirect the user to a dashboard or another page upon successful login
            t=1;
            console.log("User authenticated successfully");
            res.redirect("/");
        } else {
            // Passwords do not match
            console.log("Invalid password");
            return res.render("login", { error: "Invalid username or password" });
        }
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

if(t===1){
    app.post("/profile", async function (req, res){

    })
}

app.get("/profile", function(req, res){
    res.render("profile", {t: t, user: user});
});

app.get("/client", function(req,res){
    res.render("client", { t: t });
});
app.post("")
app.listen(3000,function()
{
    console.log("Server Started on port on 3000");
});