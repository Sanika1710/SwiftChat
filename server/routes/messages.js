const {
    addMessage,
    getMessages,
    markAsDelivered,
    markAsRead,
    addReaction,
  } = require("../controllers/messageController")
  const { upload } = require("../utils/cloudinaryUtil")
  const router = require("express").Router()
  
  router.post("/addmsg/", upload.single("file"), addMessage)
  router.post("/getmsg/", getMessages)
  router.post("/delivered/", markAsDelivered)
  router.post("/markread/", markAsRead)
  router.post("/reaction/:id", addReaction)
  
  module.exports = router
  