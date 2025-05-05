"use client"

import { useState, useEffect, useRef } from "react"
import styled from "styled-components"
import ChatInput from "./ChatInput"
import Logout from "./Logout"
import { v4 as uuidv4 } from "uuid"
import axios from "axios"
import { getMessagesRoute, sendMessageRoute, markMessagesReadRoute, addReactionRoute } from "../utils/APIRoutes"
import MessageItem from "./MessageItem"
import { BsFillTelephoneFill, BsFillCameraVideoFill } from "react-icons/bs"
import { useNavigate } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"

export default function ChatContainer({ currentChat, socket }) {
  const [messages, setMessages] = useState([])
  const scrollRef = useRef()
  const [arrivalMessage, setArrivalMessage] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState(null)
  const [replyingTo, setReplyingTo] = useState(null)
  const navigate = useNavigate()
  const { theme } = useTheme()

  // Fetch existing messages when chat changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (currentChat) {
        const data = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY))
        const response = await axios.post(getMessagesRoute, {
          from: data._id,
          to: currentChat._id,
        })
        setMessages(response.data)

        // Mark messages as read
        await axios.post(markMessagesReadRoute, {
          from: data._id,
          to: currentChat._id,
        })

        // Emit socket event to notify the sender that messages are read
        socket.current.emit("mark-read", {
          from: data._id,
          to: currentChat._id,
        })
      }
    }

    fetchMessages()
    setIsTyping(false)
    setReplyingTo(null)
  }, [currentChat, socket])

  // Set up socket listener for incoming messages
  useEffect(() => {
    const currentSocket = socket.current

    if (currentSocket) {
      // Remove any existing listeners to prevent duplicates
      currentSocket.off("msg-receive")
      currentSocket.off("typing-indicator")
      currentSocket.off("message-status")

      // Add the message receiver listener
      currentSocket.on("msg-receive", (data) => {
        // Only process if it's from the current chat
        if (currentChat && data.from === currentChat._id) {
          setArrivalMessage({
            _id: data.id,
            fromSelf: false,
            message: data.msg,
            fileType: data.fileType || "text",
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            status: "read", // Mark as read immediately since we're viewing the chat
            replyTo: data.replyTo,
          })

          // Mark as read via API
          const markAsRead = async () => {
            const userData = JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY))
            await axios.post(markMessagesReadRoute, {
              from: userData._id,
              to: data.from,
            })

            // Emit socket event to notify the sender that messages are read
            socket.current.emit("mark-read", {
              from: userData._id,
              to: data.from,
            })
          }

          markAsRead()
        }
      })

      // Add typing indicator listener
      currentSocket.on("typing-indicator", (data) => {
        if (currentChat && data.from === currentChat._id) {
          setIsTyping(data.isTyping)
        }
      })

      // Add message status update listener
      currentSocket.on("message-status", (data) => {
        if (currentChat && data.from === currentChat._id) {
          // Update message statuses
          setMessages((prev) => prev.map((msg) => (msg.fromSelf ? { ...msg, status: data.status } : msg)))
        }
      })
    }

    // Cleanup function to remove listeners when component unmounts
    return () => {
      if (currentSocket) {
        currentSocket.off("msg-receive")
        currentSocket.off("typing-indicator")
        currentSocket.off("message-status")
      }
    }
  }, [socket, currentChat])

  // Update messages when a new arrival message comes in
  useEffect(() => {
    if (arrivalMessage) {
      setMessages((prev) => [...prev, arrivalMessage])
    }
  }, [arrivalMessage])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const handleSendMsg = async (msg, file) => {
    try {
      const data = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY))
    
      // Create FormData for handling files
      const formData = new FormData()
      formData.append("from", data._id)
      formData.append("to", currentChat._id)
    
      if (msg) {
        formData.append("message", msg)
      }
    
      if (file) {
        formData.append("file", file)
      }
    
      // Add reply reference if replying to a message
      if (replyingTo) {
        formData.append("replyTo", replyingTo._id)
      }
    
      // Determine file type for socket emission
      let fileType = "text"
      let fileUrl = null
      let fileName = null
    
      if (file) {
        // Properly detect file type based on MIME type
        if (file.type.startsWith("image/")) {
          fileType = "image"
        } else if (file.type.startsWith("video/")) {
          fileType = "video"
        } else if (file.type === "application/pdf") {
          fileType = "pdf"
        } else if (
          file.type.includes("word") ||
          file.type === "application/msword" ||
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          fileType = "doc"
        } else {
          fileType = "file"
        }
    
        fileName = file.name
        // No need for placeholder URL with Cloudinary - we'll get the actual URL from the response
      }
    
      // Send message to API first to get the cloudinary URL
      const response = await axios.post(sendMessageRoute, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    
      // Get data from the server response
      const messageData = response.data?.data || {}
      const messageId = messageData._id || uuidv4()
      
      // Get the Cloudinary URL from the response
      const cloudinaryFileUrl = messageData.message?.fileUrl || null
    
      // Emit socket event with the Cloudinary URL
      socket.current.emit("send-msg", {
        to: currentChat._id,
        from: data._id,
        id: messageId,
        msg,
        fileType,
        fileUrl: cloudinaryFileUrl,
        fileName,
        replyTo: replyingTo ? replyingTo._id : null,
      })
    
      // Update local messages
      const newMessage = {
        _id: messageId,
        fromSelf: true,
        message: msg,
        fileType,
        fileUrl: cloudinaryFileUrl,
        fileName,
        status: "sent",
        replyTo: replyingTo ? replyingTo : null,
      }
    
      setMessages((prev) => [...prev, newMessage])
    
      // Clear reply state
      setReplyingTo(null)
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleTyping = (isTyping) => {
    // Clear any existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }

    // Send typing status to the other user
    socket.current.emit("typing", {
      from: JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY))._id,
      to: currentChat._id,
      isTyping,
    })

    // If user is typing, set a timeout to automatically stop the typing indicator after 3 seconds
    if (isTyping) {
      const timeout = setTimeout(() => {
        socket.current.emit("typing", {
          from: JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY))._id,
          to: currentChat._id,
          isTyping: false,
        })
      }, 3000)
      setTypingTimeout(timeout)
    }
  }

  const handleReply = (message) => {
    setReplyingTo(message)
  }

  const cancelReply = () => {
    setReplyingTo(null)
  }

  const handleReaction = async (messageId, reaction) => {
    try {
      const userData = JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY))

      const response = await axios.post(`${addReactionRoute}/${userData._id}`, {
        messageId,
        reaction,
      })

      if (response.data.status) {
        // Update the message with new reactions
        setMessages((prev) =>
          prev.map((msg) => (msg._id === messageId ? { ...msg, reactions: response.data.reactions } : msg)),
        )
      }
    } catch (error) {
      console.error("Error adding reaction:", error)
    }
  }

  const initiateCall = (type) => {
    const roomId = uuidv4()
    const userData = JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY))

    // Emit socket event to notify the other user about the call
    socket.current.emit("call-user", {
      from: userData._id,
      to: currentChat._id,
      name: userData.username,
      callType: type,
      roomId,
    })

    // Navigate to the call page
    navigate(`/call/${roomId}?type=${type}&user=${currentChat._id}&name=${currentChat.username}`)
  }

  return (
    <Container theme={theme}>
      <div className="chat-header">
        <div className="user-details">
          <div className="avatar">
            <img src={`data:image/svg+xml;base64,${currentChat?.avatarImage}`} alt="" />
            <div className={`status-indicator ${currentChat?.status === "online" ? "online" : "offline"}`}></div>
          </div>
          <div className="username">
            <h3>{currentChat?.username}</h3>
            {currentChat?.status === "online" && <span className="status">Online</span>}
            {currentChat?.status === "offline" && <span className="status">Offline</span>}
            {isTyping && <div className="typing-indicator">typing...</div>}
          </div>
        </div>
        <div className="actions">
          <Logout />
        </div>
      </div>
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div ref={index === messages.length - 1 ? scrollRef : null} key={message._id || uuidv4()}>
            <MessageItem
              message={message}
              onReply={() => handleReply(message)}
              onReaction={(reaction) => handleReaction(message._id, reaction)}
            />
          </div>
        ))}
        {isTyping && (
          <div className="typing-container" ref={scrollRef}>
            <div className="typing-bubble">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        )}
      </div>
      <ChatInput
        handleSendMsg={handleSendMsg}
        onTyping={handleTyping}
        replyingTo={replyingTo}
        onCancelReply={cancelReply}
      />
    </Container>
  )
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 80% 10%;
  gap: 0.1rem;
  overflow: hidden;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    grid-template-rows: 15% 70% 15%;
  }
  
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    background-color: var(--tertiary-bg);
    
    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;
      
      .avatar {
        position: relative;
        
        img {
          height: 3rem;
        }
        
        .status-indicator {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 0.8rem;
          height: 0.8rem;
          border-radius: 50%;
          border: 2px solid var(--tertiary-bg);
          
          &.online {
            background-color: var(--success-color);
          }
          
          &.offline {
            background-color: var(--text-muted);
          }
        }
      }
      
      .username {
        position: relative;
        
        h3 {
          color: var(--text-color);
          margin-bottom: 0.2rem;
        }
        
        .status {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        
        .typing-indicator {
          font-size: 0.8rem;
          color: var(--accent-light);
          font-style: italic;
        }
      }
    }
    
    .actions {
      display: flex;
      gap: 0.5rem;
      
      .call-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0.5rem;
        border-radius: 0.5rem;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-color);
        transition: all 0.3s ease;
        
        &:hover {
          background-color: var(--input-bg);
        }
        
        &.voice {
          color: var(--success-color);
        }
        
        &.video {
          color: var(--info-color);
        }
      }
    }
  }
  
  .chat-messages {
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;
    background-color: var(--secondary-bg);
    
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: var(--scrollbar-thumb);
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    
    .typing-container {
      display: flex;
      justify-content: flex-start;
      
      .typing-bubble {
        background-color: var(--input-bg);
        padding: 0.5rem 1rem;
        border-radius: 1rem;
        display: flex;
        align-items: center;
        gap: 0.3rem;
        
        .dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 50%;
          background-color: var(--text-muted);
          animation: bounce 1.5s infinite;
          
          &:nth-child(2) {
            animation-delay: 0.2s;
          }
          
          &:nth-child(3) {
            animation-delay: 0.4s;
          }
        }
        
        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-4px);
          }
        }
      }
    }
  }
`
