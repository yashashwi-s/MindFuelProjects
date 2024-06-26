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

let user;
let t;
let client;
let stid;
let pid;
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

app.use(function (req, res, next) {
  if (req.session.userId) {
    stid = req.session.userId;
    req.session.t = 1;
    client = null;
  } else if (req.session.client) {
    req.session.t = 2;
    client = req.session.client;
  } else {
    req.session.t = 0;
    client = null;
  }
  t = req.session.t;
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

app.get("/apply/:projectID", async function (req, res) {
  try {
    const projectID = req.params.projectID;
    const project = await Project.findById(projectID);
    if (!project) {
      return res.status(404).send("Project not found");
    }
    res.render("apply", { project, t: req.session.t });
  } catch (error) {
    console.error("Error fetching project details:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/apply/:projectID", async (req, res) => {
  try {
    const { projectID } = req.params;
    const { coverLetter } = req.body;
    pid=projectID;
    
    const project = await Project.findById(projectID);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    const application = new Application({
      project: projectID,
      student: stid,
      coverLetter: coverLetter,
      status: "pending",
    });

    await application.save();
    res.redirect("/profile");
  } catch (error) {
    console.error("Error submitting application:", error);
    res.status(500).json({ error: "Failed to submit application" });
  }
});

app.get("/addProject", function (req, res) {
  if (t === 2 && client) {
    res.render("addProject", { t: req.session.t, client: req.session.client });
  } else {
    res.redirect("/client");
  }
});

app.post("/addProject", async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    const {
      industry,
      projectdetails,
      projectduration,
      skills,
      outcome,
      budget,
      timeline,
      comments,
    } = req.body;
    console.log("Received data:", {
      industry,
      projectdetails,
      projectduration,
      skills,
      outcome,
      budget,
      timeline,
      comments,
    });
    const client = await Client.findById(req.session.client);
    const organization = client.organization;
    const project = new Project({
      organization,
      industry,
      projectdetails,
      projectduration,
      skills,
      outcome,
      budget,
      timeline,
      comments,
      company: req.session.client,
      status: "Open"
    });
    console.log("New Project:", project);
    await project.save();
    console.log("Project saved successfully");
    res.redirect("/client");
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

app.get("/applications/:projectID", async (req, res) => {
  try {
    const { projectID } = req.params;
    const applications = await Application.find({
      project: projectID,
    }).populate("student");
    res.render("applications", { applications, t:req.session.t });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch project applications" });
  }
});

app.put('/updateStatus/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedApplication = await Application.findByIdAndUpdate(id, { status }, { new: true });
    if (!updatedApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }
    if (status === "wip" || status === "completed") {
      const projectId = updatedApplication.project;
      const updatedProject = await Project.findByIdAndUpdate(projectId, { status: 'closed' }, { new: true });
      if (!updatedProject) {
        console.error('Project not found');
      }
    }
    res.status(200).json(updatedApplication);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get("/applicants/:projectId/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).send("Student not found");
    }

    const applications = await Application.find({ student: studentId });
    
    res.render("applicants", { student, applications, t: req.session.t });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch applicant details" });
  }
});

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

app.get("/profile", async function (req, res) {
  try {
    if (req.session.t === 1 && req.session.user) {
      const user = req.session.user;
      const applications = await Application.find({ student: user._id }).populate('project');
      
      let appliedProjects = [];
      let statuses = [];
      if (applications && applications.length > 0) {
        appliedProjects = applications.map(application => application.project.toObject());
        statuses = applications.map(application => application.status);
      }

      res.render("profile", { t: req.session.t, user: user, appliedProjects: appliedProjects, statuses: statuses });
    } else {
      res.redirect("/signup");
    }
  } catch (error) {
    console.error('Error querying collection:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get("/client", function (req, res) {
  if (req.session.t === 0 || (req.session.t === 2 && !req.session.client)) {
    res.render("client", { t: req.session.t, error: null });
  } else if (
    req.session.t === 1 ||
    (req.session.t === 2 && !req.session.client)
  ) {
    res.redirect("/");
  } else {
    res.redirect("/profile1");
  }
});

app.post("/client", async function (req, res) {
  if (req.session.t === 0) {
    const { organization, contact, email, website, password, confirmPassword } =
      req.body;

    try {
      const newClient = new Client({
        organization,
        contact,
        email,
        website,
        password,
      });

      await newClient.save();
      req.session.client = newClient;
      req.session.t = 2;
      console.log(req.session.t);
      res.redirect("/profile1");
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create client" });
    }
  } else {
    res.redirect("/profile");
  }
});

app.get("/profile1", async function (req, res) {
  try {
    if (req.session.t === 2 && req.session.client) {
      const client = req.session.client;
      const projects = await Project.find({ company: req.session.client._id });
      res.render("profile1", {
        t: req.session.t,
        client: client,
        projects: projects,
      });
    } else {
      res.redirect("/client");
    }
  } catch (error) {
    console.error("Error fetching client projects:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/projects", async function (req, res) {
  try {
    const projects = await Project.find({}).populate("company");
    res.render("projects", { t: req.session.t, projects: projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/sendEmail", function (req, res) {
  res.render("sendEmail", { t: req.session.t });
});

app.get("/student", async function (req, res) {
  try {
    const users = await Student.find({});
    if(req.session.t===2){
    res.render("student", { t: req.session.t, users: users });}
    else{
      res.redirect("profile");
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/chat/:userId", function (req, res) {
  const userId = req.params.userId;
  res.render("chatRoom", { t: req.session.t, userId: userId });
});

app.listen(3000, function () {
  console.log("Server Started on port on 3000");
});
