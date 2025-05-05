"use client"

import { useState, useEffect, useRef } from "react"
import styled from "styled-components"
import ChatInput from "./ChatInput"
import Logout from "./Logout"
import { v4 as uuidv4 } from "uuid"
import axios from "axios"
import { getGroupMessagesRoute, sendGroupMessageRoute, addReactionRoute } from "../utils/APIRoutes"
import MessageItem from "./MessageItem"
import { FiMoreVertical } from "react-icons/fi"
import { useTheme } from "../context/ThemeContext"
import GroupInfoModal from "./GroupInfoModal"

export default function GroupChatContainer({ currentGroup, socket, currentUser, onGroupUpdate }) {
    const [messages, setMessages] = useState([])
    const scrollRef = useRef()
    const [arrivalMessage, setArrivalMessage] = useState(null)
    const [typingUsers, setTypingUsers] = useState({})
    const [replyingTo, setReplyingTo] = useState(null)
    const [showGroupInfo, setShowGroupInfo] = useState(false)
    const { theme } = useTheme()

    // Fetch existing messages when group changes
    useEffect(() => {
        const fetchMessages = async () => {
            if (currentGroup && currentUser) {
                try {
                    const response = await axios.post(
                        `${getGroupMessagesRoute}/${currentUser._id}`,
                        {
                            groupId: currentGroup._id,
                        },
                        {
                            headers: {
                                "Content-Type": "application/json",
                            },
                        }
                    )

                    // Process the received messages to add the 'fromSelf' property
                    const processedMessages = response.data.map(msg => {
                        // Properly determine if the message is from the current user
                        const fromSelf = msg.sender && currentUser ? msg.sender._id === currentUser._id : false
                        
                        return {
                            ...msg,
                            fromSelf,
                            text: msg.message?.text,
                            fileType: msg.message?.fileType || "text",
                            fileUrl: msg.message?.fileUrl,
                            fileName: msg.message?.fileName
                        }
                    })

                    setMessages(processedMessages)
                } catch (error) {
                    console.error("Error fetching group messages:", error)
                }
            }
        }

        if (currentGroup && currentUser) {
            fetchMessages()
            setTypingUsers({})
            setReplyingTo(null)
        }
    }, [currentGroup, currentUser])

    // Set up socket listener for incoming group messages
    useEffect(() => {
        const currentSocket = socket.current

        if (currentSocket && currentGroup && currentUser) {
            // Remove any existing listeners to prevent duplicates
            currentSocket.off("group-msg-receive")
            currentSocket.off("group-typing")

            // Add the message receiver listener
            currentSocket.on("group-msg-receive", (data) => {
                // Only process if it's from the current group
                if (currentGroup && data.groupId === currentGroup._id) {
                    setArrivalMessage({
                        _id: data.id,
                        fromSelf: data.from === currentUser._id,
                        message: data.msg,
                        text: data.msg,
                        fileType: data.fileType || "text",
                        fileUrl: data.fileUrl,
                        fileName: data.fileName,
                        sender: data.sender,
                        replyTo: data.replyTo,
                    })
                }
            })

            // Add typing indicator listener for groups
            currentSocket.on("group-typing", (data) => {
                if (currentGroup && data.groupId === currentGroup._id && data.from !== currentUser._id) {
                    // Update typing users
                    setTypingUsers((prev) => {
                        if (data.isTyping) {
                            return { ...prev, [data.from]: { username: data.username, timestamp: Date.now() } }
                        } else {
                            const newState = { ...prev }
                            delete newState[data.from]
                            return newState
                        }
                    })
                }
            })
        }

        // Cleanup function to remove listeners when component unmounts
        return () => {
            if (currentSocket) {
                currentSocket.off("group-msg-receive")
                currentSocket.off("group-typing")
            }
        }
    }, [socket, currentGroup, currentUser])

    // Update messages when a new arrival message comes in
    useEffect(() => {
        if (arrivalMessage) {
            setMessages((prev) => [...prev, arrivalMessage])
        }
    }, [arrivalMessage])

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, typingUsers])

    // Clean up typing indicators after 3 seconds of inactivity
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now()
            setTypingUsers((prev) => {
                const newState = { ...prev }
                let changed = false

                Object.entries(newState).forEach(([userId, data]) => {
                    if (now - data.timestamp > 3000) {
                        delete newState[userId]
                        changed = true
                    }
                })

                return changed ? newState : prev
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const handleSendMsg = async (msg, file) => {
        try {
            if (!currentUser || !currentGroup) return

            // Create FormData for handling files
            const formData = new FormData()
            formData.append("groupId", currentGroup._id)

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
                // This is just a placeholder - the actual URL will be determined by the server
                
            }

            // Send message to API
            const response = await axios.post(`${sendGroupMessageRoute}/${currentGroup._id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                params: {
                    id: currentUser._id,
                },
            })

            if (response.data.status) {
                const messageData = response.data.data

                // Emit socket event to notify other group members
                socket.current.emit("group-message", {
                    groupId: currentGroup._id,
                    from: currentUser._id,
                    id: messageData._id,
                    msg,
                    fileType,
                    fileUrl: messageData.message?.fileUrl,
                    fileName,
                    sender: {
                        _id: currentUser._id,
                        username: currentUser.username,
                        avatarImage: currentUser.avatarImage,
                    },
                    replyTo: replyingTo ? replyingTo._id : null,
                    members: currentGroup.members.map((member) => member?._id || member),
                })

                // Update local messages
                const newMessage = {
                    _id: messageData._id,
                    fromSelf: true,
                    message: msg,
                    text: msg,
                    fileType,
                    fileUrl: messageData.message?.fileUrl,
                    fileName,
                    sender: {
                        _id: currentUser._id,
                        username: currentUser.username,
                        avatarImage: currentUser.avatarImage,
                    },
                    replyTo: replyingTo ? replyingTo : null,
                }

                setMessages((prev) => [...prev, newMessage])

                // Clear reply state
                setReplyingTo(null)
            }
        } catch (error) {
            console.error("Error sending group message:", error)
        }
    }

    const handleTyping = (isTyping) => {
        if (!currentUser || !currentGroup) return
        
        // Send typing status to the group
        socket.current.emit("group-typing", {
            from: currentUser._id,
            username: currentUser.username,
            groupId: currentGroup._id,
            isTyping,
        })
    }

    const handleReply = (message) => {
        setReplyingTo(message)
    }

    const cancelReply = () => {
        setReplyingTo(null)
    }

    const handleReaction = async (messageId, reaction) => {
        try {
            if (!currentUser) return
            
            const response = await axios.post(`${addReactionRoute}/${currentUser._id}`, {
                messageId,
                reaction,
                isGroupMessage: true,
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

    // Get typing indicator text
    const getTypingText = () => {
        const typingUsernames = Object.values(typingUsers).map((data) => data.username)

        if (typingUsernames.length === 0) return null
        if (typingUsernames.length === 1) return `${typingUsernames[0]} is typing...`
        if (typingUsernames.length === 2) return `${typingUsernames[0]} and ${typingUsernames[1]} are typing...`
        return `${typingUsernames.length} people are typing...`
    }

    // If currentGroup or currentUser isn't loaded yet, show a loading state
    if (!currentGroup || !currentUser) {
        return (
            <Container theme={theme}>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading chat...</p>
                </div>
            </Container>
        )
    }

    return (
        <Container theme={theme}>
            <div className="chat-header">
                <div className="group-details">
                    <div className="avatar">
                        <img src={`data:image/svg+xml;base64,${currentGroup?.avatar}`} alt="" />
                    </div>
                    <div className="info">
                        <h3>{currentGroup?.name}</h3>
                        <span className="member-count">{currentGroup?.members?.length} members</span>
                        {getTypingText() && <div className="typing-indicator">{getTypingText()}</div>}
                    </div>
                </div>
                <div className="actions">
                    <button className="info-btn" onClick={() => setShowGroupInfo(true)}>
                        <FiMoreVertical />
                    </button>
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
                            isGroupMessage={true}
                            currentUser={currentUser}
                        />
                    </div>
                ))}
                {Object.keys(typingUsers).length > 0 && (
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

            {showGroupInfo && (
                <GroupInfoModal
                    group={currentGroup}
                    currentUser={currentUser}
                    onClose={() => setShowGroupInfo(false)}
                    onGroupUpdate={onGroupUpdate}
                />
            )}
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
  
  .loading-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: var(--text-muted);
    
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top-color: var(--accent-color);
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 1rem;
    }
    
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  }
  
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    background-color: var(--tertiary-bg);
    
    .group-details {
      display: flex;
      align-items: center;
      gap: 1rem;
      
      .avatar {
        img {
          height: 3rem;
        }
      }
      
      .info {
        h3 {
          color: var(--text-color);
          margin-bottom: 0.2rem;
        }
        
        .member-count {
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
      
      .info-btn {
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