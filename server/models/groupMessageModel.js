const mongoose = require("mongoose");

const GroupMessageSchema = mongoose.Schema(
  {
    message: {
      text: { type: String, default: "" }, // Ensure text is always a string
      fileUrl: { type: String, default: "" }, // URL for file attachments
      fileType: { type: String, enum: ["text", "image", "video", "file"], default: "text" }, // Type of file
      fileName: { type: String, default: "" }, // Name of the file
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Groups",
      required: true, // Group ID is required
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true, // Sender ID is required
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupMessages",
      default: null, // Reference to the message being replied to
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Users", // User who reacted
        },
        reaction: {
          type: String,
          enum: ["❤️", "👍", "👎", "😂", "😮", "😢", "🎉"], // Allowed reactions
        },
      },
    ],
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users", // Users who have read the message
      },
    ],
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("GroupMessages", GroupMessageSchema);
