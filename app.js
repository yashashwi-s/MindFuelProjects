const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const bcrypt = require("bcrypt");
const _ = require("lodash");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");

const Project = require("./models/Project");
const Student = require("./models/Student");
const Client = require("./models/Client");
const Application = require("./models/Application");

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("Public"));

mongoose.connect("mongodb+srv://yashashwisinghania:VzLsAmcRAe7Mj3Xn@cluster0.kqwltvl.mongodb.net/profileDB");

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.engine("ejs", require("ejs").renderFile);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "Views"));

app.set("trust proxy", 1);
app.use(
  session({
    secret: "foo",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: "mongodb+srv://yashashwisinghania:VzLsAmcRAe7Mj3Xn@cluster0.kqwltvl.mongodb.net/profileDB",
    }),
  })
);

app.use((req, res, next) => {
  res.locals.t = req.session.t || 0;
  res.locals.client = req.session.client || null;
  next();
});

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { loginUsername, loginPassword } = req.body;
  try {
    const user = await Student.findOne({ username: loginUsername });
    if (!user || !(await bcrypt.compare(loginPassword, user.password))) {
      return res.render("login", { error: "Invalid username or password" });
    }
    req.session.userId = user._id;
    req.session.t = 1;
    res.redirect("/");
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/profile", async (req, res) => {
  try {
    if (req.session.t === 1 && req.session.userId) {
      const user = await Student.findById(req.session.userId);
      res.render("profile", { t: req.session.t, user });
    } else {
      res.redirect("/signup");
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/client", (req, res) => {
  if (req.session.t === 0 || (req.session.t === 2 && !req.session.client)) {
    res.render("client", { error: null });
  } else if (req.session.t === 1 || (req.session.t === 2 && !req.session.client)) {
    res.redirect("/");
  } else {
    res.redirect("/profile1");
  }
});

app.post("/client", async (req, res) => {
  if (req.session.t === 0) {
    const {
      organization,
      contact,
      email,
      website,
      password,
      confirmPassword
    } = req.body;
    if (password !== confirmPassword) {
      return res.render("client", { error: "Passwords do not match" });
    }
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newClient = new Client({
        organization,
        contact,
        email,
        website,
        password: hashedPassword
      });
      await newClient.save();
      req.session.client = newClient;
      req.session.t = 2;
      res.redirect("/profile1");
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create client" });
    }
  } else {
    res.redirect("/profile");
  }
});

app.get("/profile1", async (req, res) => {
  try {
    if (req.session.t === 2 && req.session.client) {
      const client = req.session.client;
      const projects = await Project.find({ company: client._id });
      res.render("profile1", { client, projects });
    } else {
      res.redirect("/client");
    }
  } catch (error) {
    console.error("Error fetching client projects:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.listen(3000, () => {
  console.log("Server Started on port on 3000");
});
