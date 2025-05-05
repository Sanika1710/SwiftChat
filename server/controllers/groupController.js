const Group = require("../models/groupModel")
const GroupMessage = require("../models/groupMessageModel")
const User = require("../models/userModel")
const multiavatar = require("@multiavatar/multiavatar")

// Create a new group
exports.createGroup = async (req, res, next) => {
  try {
    const { name, description, members } = req.body
    const creator = req.params.id

    // Generate a random avatar for the group
    const svgCode = multiavatar(name)
    const avatarImage = Buffer.from(svgCode).toString("base64")

    // Create the group
    const group = await Group.create({
      name,
      description,
      avatar: avatarImage,
      creator,
      members: [...new Set([creator, ...members])], // Ensure unique members with creator included
      admins: [creator], // Creator is the first admin
    })

    // Populate member details
    const populatedGroup = await Group.findById(group._id)
      .populate("members", "username avatarImage _id")
      .populate("admins", "username avatarImage _id")
      .populate("creator", "username avatarImage _id")

    return res.json({
      status: true,
      message: "Group created successfully",
      group: populatedGroup,
    })
  } catch (err) {
    next(err)
  }
}

// Get all groups for a user
exports.getAllGroups = async (req, res, next) => {
  try {
    const userId = req.params.id

    // Find all groups where the user is a member
    const groups = await Group.find({ members: userId })
      .populate("members", "username avatarImage _id")
      .populate("admins", "username avatarImage _id")
      .populate("creator", "username avatarImage _id")
      .sort({ updatedAt: -1 })

    return res.json(groups)
  } catch (err) {
    next(err)
  }
}

// Add a message to a group
exports.addMessage = async (req, res, next) => {
  try {
    const { groupId, message, replyTo } = req.body
    const sender = req.params.id

    // Check if user is a member of the group
    const group = await Group.findById(groupId)
    if (!group) {
      return res.json({ status: false, message: "Group not found" })
    }

    // Create message data
    const messageData = {
      message: {
        text: message || "",
        fileType: "text",
      },
      group: groupId,
      sender,
      readBy: [sender], // Sender has read the message
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

    // Create the message
    const data = await GroupMessage.create(messageData)

    // Update group's updatedAt timestamp
    await Group.findByIdAndUpdate(groupId, { updatedAt: Date.now() })

    // Populate sender info for socket emission
    const populatedMessage = await GroupMessage.findById(data._id)
      .populate("sender", "username avatarImage _id")
      .populate({
        path: "replyTo",
        populate: {
          path: "sender",
          select: "username avatarImage _id",
        },
      })

    return res.json({
      status: true,
      message: "Message sent successfully",
      data: populatedMessage,
    })
  } catch (err) {
    next(err)
  }
}

// Get messages for a group
exports.getMessages = async (req, res, next) => {
  try {
    const { groupId } = req.body
    const userId = req.params.id

    // Check if user is a member of the group
    const group = await Group.findById(groupId)
    if (!group) {
      return res.json({ status: false, message: "Group not found" })
    }

    // Get messages
    const messages = await GroupMessage.find({ group: groupId })
      .populate("sender", "username avatarImage _id")
      .populate({
        path: "replyTo",
        populate: {
          path: "sender",
          select: "username avatarImage _id",
        },
      })
      .sort({ createdAt: 1 })

    // Mark messages as read by this user
    await GroupMessage.updateMany(
      {
        group: groupId,
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
      },
    )

    return res.json(messages)
  } catch (err) {
    next(err)
  }
}

// Add a member to a group
exports.addMember = async (req, res, next) => {
  try {
    const { groupId, userId } = req.body
    const adminId = req.params.id

    // Check if the requester is an admin
    const group = await Group.findById(groupId)
    if (!group) {
      return res.json({ status: false, message: "Group not found" })
    }

    if (!group.admins.includes(adminId)) {
      return res.json({ status: false, message: "You don't have permission to add members" })
    }

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return res.json({ status: false, message: "User not found" })
    }

    // Check if user is already a member
    if (group.members.includes(userId)) {
      return res.json({ status: false, message: "User is already a member of this group" })
    }

    // Add user to members
    group.members.push(userId)
    await group.save()

    // Get updated group with populated members
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "username avatarImage _id")
      .populate("admins", "username avatarImage _id")
      .populate("creator", "username avatarImage _id")

    return res.json({
      status: true,
      message: "Member added successfully",
      group: updatedGroup,
    })
  } catch (err) {
    next(err)
  }
}

// Remove a member from a group
exports.removeMember = async (req, res, next) => {
  try {
    const { groupId, userId } = req.body
    const adminId = req.params.id

    // Check if the requester is an admin
    const group = await Group.findById(groupId)
    if (!group) {
      return res.json({ status: false, message: "Group not found" })
    }

    if (!group.admins.includes(adminId)) {
      return res.json({ status: false, message: "You don't have permission to remove members" })
    }

    // Cannot remove the creator
    if (group.creator.toString() === userId) {
      return res.json({ status: false, message: "Cannot remove the group creator" })
    }

    // Remove user from members and admins
    group.members = group.members.filter((member) => member.toString() !== userId)
    group.admins = group.admins.filter((admin) => admin.toString() !== userId)
    await group.save()

    // Get updated group with populated members
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "username avatarImage _id")
      .populate("admins", "username avatarImage _id")
      .populate("creator", "username avatarImage _id")

    return res.json({
      status: true,
      message: "Member removed successfully",
      group: updatedGroup,
    })
  } catch (err) {
    next(err)
  }
}

// Leave a group
exports.leaveGroup = async (req, res, next) => {
  try {
    const { groupId } = req.body
    const userId = req.params.id

    // Check if group exists
    const group = await Group.findById(groupId)
    if (!group) {
      return res.json({ status: false, message: "Group not found" })
    }

    // Cannot leave if you're the creator
    if (group.creator.toString() === userId) {
      return res.json({ status: false, message: "Group creator cannot leave. Transfer ownership or delete the group." })
    }

    // Remove user from members and admins
    group.members = group.members.filter((member) => member.toString() !== userId)
    group.admins = group.admins.filter((admin) => admin.toString() !== userId)
    await group.save()

    return res.json({
      status: true,
      message: "You have left the group",
    })
  } catch (err) {
    next(err)
  }
}