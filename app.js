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

const router = express.Router();
const Project = require("./models/Project");
const Student = require("./models/Student");
const Client = require("./models/Client");
const Application = require("./models/Application");

var t=0;
let user;
app.use(express.json());

mongoose.connect(
  "mongodb+srv://yashashwisinghania:VzLsAmcRAe7Mj3Xn@cluster0.kqwltvl.mongodb.net/profileDB"
);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.use(express.static(path.join(__dirname, "views")));

app.engine("ejs", require("ejs").renderFile);
app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "Views"));
app.use("/form", express.static(__dirname + "/index.html"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("Public"));
app.set("trust proxy", 1);

app.use(
  session({
    secret: "foo",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl:
        "mongodb+srv://yashashwisinghania:VzLsAmcRAe7Mj3Xn@cluster0.kqwltvl.mongodb.net/profileDB",
    }),
  })
);

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB!");
});

module.exports = db;

app.use(function(req, res, next) {
  req.session.t = req.session.userId ? 1 : 0;
  next();
});


app.get("/", function (req, res) {
  res.render("home", { t: req.session.t });
});

app.get("/home", function (req, res) {
  res.render("home", { t: req.session.t });
});

app.post("/", function (req, res) {
  res.render("home", { t: req.session.t });
});

app.post("/#", function (req, res) {
  res.render("home", { t: req.session.t });
});

app.get("/signup", function (req, res) {
  res.render("signup", { t: req.session.t });
});

app.get("/login", function (req, res) {
  res.render("login", { t: req.session.t });
});

app.post("/applyToProject", async (req, res) => {
  try {
    const { projectID, studentID, description } = req.body;
    const application = new Application({
      project: projectID,
      student: studentID,
      description,
      status: "pending",
    });
    await application.save();
    res.status(201).json({ message: "Application submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to submit application" });
  }
});

app.post("/addProject", async (req, res) => {
  try {
    const { companyID, projectDetails } = req.body;
    const project = new Project({ company: companyID, ...projectDetails });
    await project.save();
    res.status(201).json({ message: "Project created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

app.get("/projectApplications/:projectID", async (req, res) => {
  try {
    const { projectID } = req.params;
    const applications = await Application.find({ project: projectID }).populate("student");
    res.render("projectApplications", { applications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch project applications" });
  }
});

if (t === 0) {
  
  app.post("/signup", async function (req, res) {
    const {
      name,
      mobno,
      username,
      email,
      gender,
      school,
      course,
      degree,
      passout,
      currentYear,
      linkedProfile,
      github,
      skills,
      pastProjects,
      password,
      confirmPassword,
    } = req.body;
    if (password !== confirmPassword) {
      return res.render("signup", {
        error: "Passwords do not match",
        name,
        mobno,
        username,
        email,
        gender,
        school,
        course,
        degree,
        passout,
        currentYear,
        linkedProfile,
        github,
        skills,
        pastProjects,
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newStudent = new Student({
        name,
        mobno,
        username,
        email,
        gender,
        school,
        course,
        degree,
        passout,
        currentYear,
        linkedProfile,
        github,
        skills,
        pastProjects,
        password: hashedPassword,
      });
      await newStudent.save();

      res.redirect("/login"); 
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });
}

app.post("/login", async function (req, res) {
  const { loginUsername, loginPassword } = req.body;

  try {
    user = await Student.findOne({ username: loginUsername });

    if (!user) {
      console.log("User not found");
      return res.render("login", { error: "Invalid username or password" });
    }

    const isPasswordMatch = await bcrypt.compare(loginPassword, user.password);

    if (isPasswordMatch) {
      req.session.userId = user._id;
      req.session.user = user;
      req.session.t = 1;
      console.log("Session after login:", req.session);
      res.redirect("/");
    } else {
      console.log("Invalid password");
      return res.render("login", { error: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/profile", function (req, res) {
  if (req.session.t === 1 && req.session.user) {
    res.render("profile", { t: req.session.t, user: user });
  } else {
    res.redirect("/signup");
  }
});

app.get("/client", function (req, res) {
  if (req.session.t === 0) {
    res.render("client", { t: req.session.t, error: null });
  } else {
    res.redirect("/profile");
  }
});

app.post("/client", async function (req, res) {
  if (req.session.t === 0) {
    const {
      organization,
      contact,
      email,
      website,
      password,
      confirmPassword
    } = req.body;

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
      res.redirect("/");
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create client" });
    }
  } else {
    res.redirect("/profile");
  }
});


app.get("/projects", async function(req,res){
    const clients = await Client.find({});
    res.render("projects", {t:req.session.t, clients: clients})
})
app.get("/sendEmail", function (req, res) {
  res.render("sendEmail", { t: req.session.t });
});

app.get("/student", async function (req, res) {
  try {
    const users = await Student.find({});
    res.render("student", { t: req.session.t, users: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/chat/:userId", function(req, res) {
    const userId = req.params.userId;
    res.render("chatRoom", { t:req.session.t, userId: userId });
});

app.listen(3000, function () {
  console.log("Server Started on port on 3000");
});
