// messageModel.js - Update the message schema

const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    message: {
      text: {
        type: String,
        required: false,
      },
      fileUrl: {
        type: String,
        required: false,
      },
      fileType: {
        type: String,
        required: false,
      },
      fileName: {
        type: String,
        required: false,
      },
      // Add this new field for Cloudinary
      cloudinaryPublicId: {
        type: String,
        required: false,
      },
    },
    users: Array,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reaction: String,
      },
    ],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Messages",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Messages", MessageSchema);

// groupMessageModel.js - Update the group message schema



