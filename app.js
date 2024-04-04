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

mongoose.connect('mongodb+srv://yashashwisinghania:VzLsAmcRAe7Mj3Xn@cluster0.kqwltvl.mongodb.net/');

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(express.static(path.join(__dirname, 'views')));

app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'Views'));
app.use('/form', express.static(__dirname + '/index.html'));

app.get("/", function(req, res) {
    res.render("home");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("Public"));
app.set('trust proxy', 1);

app.use(session({
    secret: 'foo',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: 'mongodb+srv://yashashwisinghania:VzLsAmcRAe7Mj3Xn@cluster0.kqwltvl.mongodb.net/' })
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



app.post("")

app.listen(3000,function()
{
    console.log("Server Started on port on 3000");
});