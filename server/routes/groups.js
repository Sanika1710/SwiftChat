const router = require("express").Router()
const groupController = require("../controllers/groupController")
const { upload } = require("../utils/cloudinaryUtil")

// Create a new group
router.post("/create/:id", groupController.createGroup)

// Get all groups for a user
router.get("/all/:id", groupController.getAllGroups)

// Get messages for a group
router.post("/messages/:id", groupController.getMessages)

// Send a message
router.post("/message/:id", upload.single("file"), groupController.addMessage)

// Add a member to a group
router.post("/add-member/:id", groupController.addMember)

// Remove a member from a group
router.post("/remove-member/:id", groupController.removeMember)

// Leave a group
router.post("/leave/:id", groupController.leaveGroup)

module.exports = router
