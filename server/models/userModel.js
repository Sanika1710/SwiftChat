const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    min: 3,
    max: 20,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    max: 50,
  },
  password: {
    type: String,
    required: true,
    min: 8,
  },
  isAvatarImageSet: {
    type: Boolean,
    default: false,
  },
  avatarImage: {
    type: String,
    default: "",
  },
  // Added new fields for friend system
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users"
  }],
  friendRequests: {
    sent: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users"
    }],
    received: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users"
    }]
  }
});

module.exports = mongoose.model("Users", userSchema);