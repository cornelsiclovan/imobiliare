const { jwt } = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  registryToken: {
    type: String,
    required: false,
  },
  registryTokenExpiration: {
    type: String,
    required: false,
  },
  resetToken: {
    type: String,
    required: false,
  },
  resetTokenExpiration: {
    type: String,
    required: false,
  },
  isAdmin: {
    type: Boolean,
    required: false,
  },
  isOwner: {
    type: Boolean,
    required: false,
  },
  image: {
    type: String,
    required: false
  }, 
  enabled: {
    type: String,
    required: false
  }
});

const User = mongoose.model("User", userSchema);

exports.User = User;
