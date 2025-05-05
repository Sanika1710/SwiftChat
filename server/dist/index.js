// ==========================
// Imports
// ==========================
const express = require("express")
const mongoose = require("mongoose")
const socket = require("socket.io")
const path = require("path")
const cors = require("cors")
require("dotenv").config()

// ==========================
// Route Imports
// ==========================
const authRoutes = require("../routes/auth")
const messageRoutes = require("../routes/messages")
const friendRoutes = require("../routes/friends")
const groupRoutes = require("../routes/groups")

// ==========================
// App Setup
// ==========================
const app = express()
app.use(cors())
app.use(express.json())

// ==========================
// Static Files
// ==========================
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// ==========================
// Routes
// ==========================
app.use("/api/auth", authRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/friends", friendRoutes)
app.use("/api/groups", groupRoutes)

app.get("/ping", (_req, res) => {
  return res.json({ msg: "Ping Successful" })
})

// ==========================
// Database Connection
// ==========================
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB Connection Successful"))
  .catch((err) => console.error("DB Connection Error:", err.message))

// ==========================
// Server
// ==========================
const PORT = process.env.PORT || 5000
const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`))

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use.`)
    process.exit(1)
  } else {
    throw err
  }
})

// ==========================
// Socket.IO
// ==========================
const io = socket(server, {
  cors: {
    origin: process.env.REACT_APP_API,
    credentials: true,
  },
})

global.onlineUsers = new Map()
global.typingUsers = new Map() // Track users who are typing

io.on("connection", (socket) => {
  global.chatSocket = socket

  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id)

    // Broadcast user online status to all connected clients
    io.emit("user-status", { userId, status: "online" })
  })

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to)
    if (sendUserSocket) {
      io.to(sendUserSocket).emit("msg-receive", {
        msg: data.msg,
        fileType: data.fileType || "text",
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        from: data.from,
        id: data.id,
        replyTo: data.replyTo,
        status: "delivered", // Mark as delivered when sent
      })
    }
  })

  socket.on("typing", (data) => {
    const sendUserSocket = onlineUsers.get(data.to)
    if (sendUserSocket) {
      io.to(sendUserSocket).emit("typing-indicator", {
        from: data.from,
        isTyping: data.isTyping,
      })
    }
  })

  socket.on("mark-read", (data) => {
    const sendUserSocket = onlineUsers.get(data.to)
    if (sendUserSocket) {
      io.to(sendUserSocket).emit("message-status", {
        from: data.from,
        status: "read",
      })
    }
  })

  socket.on("group-message", (data) => {
    // For each group member, send the message if they're online
    data.members.forEach((memberId) => {
      if (memberId !== data.from) {
        // Don't send to sender
        const memberSocket = onlineUsers.get(memberId)
        if (memberSocket) {
          io.to(memberSocket).emit("group-msg-receive", data)
        }
      }
    })
  })

  socket.on("call-user", (data) => {
    const userSocket = onlineUsers.get(data.to)
    if (userSocket) {
      io.to(userSocket).emit("call-incoming", {
        from: data.from,
        name: data.name,
        callType: data.callType,
        roomId: data.roomId,
      })
    }
  })

  socket.on("call-response", (data) => {
    const userSocket = onlineUsers.get(data.to)
    if (userSocket) {
      io.to(userSocket).emit("call-response", {
        accepted: data.accepted,
        from: data.from,
      })
    }
  })

  socket.on("end-call", (data) => {
    const userSocket = onlineUsers.get(data.to)
    if (userSocket) {
      io.to(userSocket).emit("call-ended", {
        from: data.from,
      })
    }
  })

  // Handle disconnection
  socket.on("disconnect", () => {
    // Find the user who disconnected
    let disconnectedUser = null
    onlineUsers.forEach((value, key) => {
      if (value === socket.id) {
        disconnectedUser = key
      }
    })

    if (disconnectedUser) {
      // Remove from online users
      onlineUsers.delete(disconnectedUser)

      // Broadcast user offline status
      io.emit("user-status", { userId: disconnectedUser, status: "offline" })
    }
  })
})
