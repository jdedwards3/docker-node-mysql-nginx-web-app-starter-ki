// const aws = require("aws-sdk");
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

const db = require("./db");
const sessionStore = new MySQLStore({}, db);

const { loginRequired, csrfProtection } = require("./middleware");
const { UserModel } = require("./models");
const { HomeViewModel } = require("./viewModels");
const {
  loginController,
  registerController,
  myAccountController,
  updateMyAccountController,
} = require("./controllers");

const app = express();

app.set("strict routing", true);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", 1);

app.use(express.urlencoded({ extended: false }));

app.use(helmet());

app.use(
  session({
    secret: "secret",
    name: "appSessionIDCookieName",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 86400000,
      httpOnly: true,
      secure: true,
    },
    rolling: true,
  })
);

app.get("/", loginRequired, csrfProtection, function (req, res) {
  const user = new UserModel({ id: req.session.user.id });
  user.read(function (user) {
    const homeViewModel = new HomeViewModel({ email: user.email });
    res.render("home", { homeViewModel });
  });
});

app.use("/login/", loginController);

app.use("/register/", registerController);

app.use("/my-account", myAccountController);

app.use("/update-my-account/", updateMyAccountController);

app.get("/logout/", loginRequired, function (req, res) {
  req.session.destroy(function () {
    res.redirect("/login/");
  });
});

app.use(function (req, res) {
  res.status(404);
  res.render("404");
});

app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }
  res.status(500);
  res.render("500");
});

app.listen(3000);
