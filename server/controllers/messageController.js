const Messages = require("../models/messageModel")
const path = require("path")
// No need to import fs anymore

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body

    const messages = await Messages.find({
      users: {
        $all: [from, to],
      },
    })
      .populate({
        path: "replyTo",
        populate: {
          path: "sender",
          select: "username avatarImage _id",
        },
      })
      .populate({
        path: "reactions.user",
        select: "username avatarImage _id",
      })
      .sort({ updatedAt: 1 })

    // Mark messages as read
    await Messages.updateMany(
      {
        users: { $all: [from, to] },
        sender: to,
        status: { $ne: "read" },
      },
      { status: "read" },
    )

    const projectedMessages = messages.map((msg) => {
      return {
        _id: msg._id,
        fromSelf: msg.sender.toString() === from,
        message: msg.message.text,
        fileUrl: msg.message.fileUrl || null,
        fileType: msg.message.fileType,
        fileName: msg.message.fileName || null,
        status: msg.status,
        createdAt: msg.createdAt,
        reactions: msg.reactions,
        replyTo: msg.replyTo,
      }
    })
    res.json(projectedMessages)
  } catch (ex) {
    next(ex)
  }
}

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message, replyTo } = req.body

    // Create a message document
    const messageData = {
      message: {
        text: message || "",
        fileType: "text",
      },
      users: [from, to],
      sender: from,
      status: "sent",
    }

    // Add reply reference if provided
    if (replyTo) {
      messageData.replyTo = replyTo
    }

    // If a file was uploaded (with Cloudinary)
    if (req.file) {
      const fileUrl = req.file.path // Cloudinary URL
      const fileType = req.file.mimetype.startsWith("image/")
        ? "image"
        : req.file.mimetype.startsWith("video/")
          ? "video"
          : "file"

      messageData.message.fileUrl = fileUrl
      messageData.message.fileType = fileType
      messageData.message.fileName = req.file.originalname
      // Store public_id for possible deletion later
      messageData.message.cloudinaryPublicId = req.file.filename
    }

    const data = await Messages.create(messageData)

    // Populate reply data if needed
    const populatedMessage = await Messages.findById(data._id).populate({
      path: "replyTo",
      populate: {
        path: "sender",
        select: "username avatarImage _id",
      },
    })

    if (data) return res.json({ msg: "Message added successfully.", data: populatedMessage })
    else return res.json({ msg: "Failed to add message to the database" })
  } catch (ex) {
    next(ex)
  }
}

// No need for getFile controller anymore since Cloudinary URLs are directly accessible

// Mark messages as delivered
module.exports.markAsDelivered = async (req, res, next) => {
  try {
    const { from, to } = req.body

    await Messages.updateMany(
      {
        users: { $all: [from, to] },
        sender: to,
        status: "sent",
      },
      { status: "delivered" },
    )

    res.json({ status: true, msg: "Messages marked as delivered" })
  } catch (ex) {
    next(ex)
  }
}

// Mark messages as read
module.exports.markAsRead = async (req, res, next) => {
  try {
    const { from, to } = req.body

    await Messages.updateMany(
      {
        users: { $all: [from, to] },
        sender: to,
        status: { $ne: "read" },
      },
      { status: "read" },
    )

    res.json({ status: true, msg: "Messages marked as read" })
  } catch (ex) {
    next(ex)
  }
}

// Add reaction to a message
module.exports.addReaction = async (req, res, next) => {
  try {
    const { messageId, reaction } = req.body
    const userId = req.params.id

    const message = await Messages.findById(messageId)
    if (!message) {
      return res.json({ status: false, msg: "Message not found" })
    }

    // Check if user already reacted
    const existingReaction = message.reactions.find((r) => r.user.toString() === userId)

    if (existingReaction) {
      // If same reaction, remove it (toggle off)
      if (existingReaction.reaction === reaction) {
        message.reactions = message.reactions.filter((r) => !(r.user.toString() === userId && r.reaction === reaction))
      } else {
        // If different reaction, update it
        existingReaction.reaction = reaction
      }
    } else {
      // Add new reaction
      message.reactions.push({
        user: userId,
        reaction,
      })
    }

    await message.save()

    // Populate user details for the reactions
    const updatedMessage = await Messages.findById(messageId).populate({
      path: "reactions.user",
      select: "username avatarImage _id",
    })

    res.json({
      status: true,
      msg: "Reaction updated",
      reactions: updatedMessage.reactions,
    })
  } catch (ex) {
    next(ex)
  }
}