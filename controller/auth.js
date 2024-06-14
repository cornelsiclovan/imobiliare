const _ = require("lodash");
const { User } = require("../model/user");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);

  try {
    let user = await User.findOne({ email: req.body.email });

    if (!errors.isEmpty()) {
      const error = new Error("Registration failed!");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    if (user) {
      return res.status(401).send({ message: "User registered already" });
    }

    const buffer = await crypto.randomBytes(32);
    const registryToken = buffer.toString("hex");
    const registryTokenExpiration = Date.now() + 3600000;

    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    const hashedPassword = await bcrypt.hash(password, 12);

    user = new User({
      name: name,
      email: email,
      password: hashedPassword,
      registryToken: registryToken,
      registryTokenExpiration: registryTokenExpiration,
      isAdmin: false,
      isOwner: false,
    });

    await user.save();

    var transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false, // upgrade later with STARTTLS
      auth: {
        user: "cornel.siclovan@gmail.com",
        pass: process.env.BREVO_API_KEY,
      },
    });
    
    var mailOptions = {
      from: 'cornel.siclovan@gmail.com',
      to: email,
      subject: 'Sending Email using Node.js[nodemailer]',
      text: 'http://localhost:8000/confirm-account-registry/' + registryToken
    };

    try{
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });  
    } catch(err) {
      console.log(err);
    }
    
   

    res.status(200).send(user._id);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  console.log("tesst", process.env.SENDGRID_API_KEY);
  let loadedUser;
  const errors = validationResult(req);

  try {
    const email = req.body.email;
    const password = req.body.password;

    const user = await User.findOne({ email: email, registryToken: null });

    if (!errors.isEmpty()) {
      const error = new Error("Login failed!");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    if (!user) {
      const error = new Error("Email or password is incorrect");
      error.statusCode = 401;
      throw error;
    }

    loadedUser = user;
    const isEqual = await bcrypt.compare(password, user.password);

    if (!isEqual) {
      const error = new Error("Email or password is incorrect");
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        email: loadedUser.email,
        userId: loadedUser.id,
      },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      token: token,
      userId: loadedUser.id,
      isAdmin: loadedUser.isAdmin,
      isOwner: loadedUser.isOwner,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.confirmAccount = async (req, res, next) => {
  const registryToken = req.body.registryToken;
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      const error = new Error("Reset failed!");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    if (!registryToken) {
      const error = new Error("No token available!");
      error.statusCode = 422;
      throw error;
    }

    const user = await User.findOne({ registryToken: registryToken });

    if (!user) {
      const error = new Error("This user does not exist!");
      error.statusCode = 422;
      throw error;
    }

    if (Date.parse(user.registryTokenExpiration) / 1000 > Date.now()) {
      const error = new Error("Token expired");
      error.statusCode = 401;
      throw error;
    }

    user.registryToken = null;
    user.registryTokenExpiration = null;
    user.enabled = '1';

    await user.save();
    res.status(200).json({
      message: "Account activated",
    });
  } catch (error) {
    next(error);
  }
};

exports.confirmAccountFromEmail = async (req, res, next) => {
  const registryToken = req.params.registryToken;
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      const error = new Error("Reset failed!");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    if (!registryToken) {
      const error = new Error("No token available!");
      error.statusCode = 422;
      throw error;
    }

    const user = await User.findOne({ registryToken: registryToken });

    if (!user) {
      const error = new Error("This user does not exist!");
      error.statusCode = 422;
      throw error;
    }

    if (Date.parse(user.registryTokenExpiration) / 1000 > Date.now()) {
      const error = new Error("Token expired");
      error.statusCode = 401;
      throw error;
    }

    user.registryToken = null;
    user.registryTokenExpiration = null;

    await user.save();

    res.writeHead(302, {
      Location: 'http://localhost:3000/auth?mode=login'
    });
  res.end();
    res.status(200).json({
      message: "Account activated",
    });
  } catch (error) {
    next(error);
  }
};


exports.postReset = async (req, res, next) => {
  const errors = validationResult(req);

  try {
    const buffer = await crypto.randomBytes(32);
    const token = buffer.toString("hex");

    console.log(req.body.email);

    const user = await User.findOne({ email: req.body.email });

    if (!errors.isEmpty()) {
      const error = new Error("Reset failed!");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    if (!user) {
      const error = new Error("User not found!");
      error.statusCode = 401;
      throw error;
    }

    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000;

    user.save();

    res.status(200).json({
      message: "Access your email account to reset your password.",
    });
  } catch (error) {
    next(error);
  }
};

exports.postNewPassword = async (req, res, next) => {
  const errors = validationResult(req);
  try {
    if (!errors.isEmpty()) {
      const error = new Error("Reset failed!");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    if (!req.body) {
      const error = new Error("To token sent");
      error.stausCode = 401;
      throw error;
    }

    const newPassword = req.body.password;
    const newPasswordRepeat = req.body.repeatPassword;
    const passwordToken = req.body.resetToken;

    if (newPassword !== newPasswordRepeat) {
      const error = new Error("Password and repeat password do not match!");
      error.statusCode = 401;
      throw error;
    }

    const resetUser = await User.findOne({ resetToken: passwordToken });

    if (!resetUser) {
      const error = new Error("This user does not exist!");
      error.statusCode = 401;
      throw error;
    }

    if (Date.parse(resetUser.resetTokenExpiration) / 1000 > Date.now()) {
      const error = new Error("Token expired");
      error.statusCode = 401;
      throw error;
    }

    resetUser.password = await bcrypt.hash(newPassword, 12);
    resetUser.resetToken = null;
    resetUser.resetTokenExpiration = null;

    await resetUser.save();
    res.status(200).json({ message: "Password changed!" });
  } catch (error) {
    next(error);
  }
};
