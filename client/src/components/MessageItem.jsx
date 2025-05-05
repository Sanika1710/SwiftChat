"use client"

import { useState } from "react"
import styled from "styled-components"
import { BsReply, BsEmojiSmile } from "react-icons/bs"
import { useTheme } from "../context/ThemeContext"

export default function MessageItem({ message, onReply, onReaction, isGroupMessage, currentUser }) {
  const [showReactions, setShowReactions] = useState(false)
  const { theme } = useTheme()

  // Available reactions
  const reactions = ["❤️", "👍", "👎", "😂", "😮", "😢", "🎉"]

  // Ensure message has the correct structure
  const safeMessage = typeof message === 'object' ? message : { message: message, text: message, fromSelf: false }
  
  // Helper function to render file content based on type
  const renderFileContent = () => {
    // Make sure we have the complete URL by checking if it starts with http
    // If not, prepend the API base URL
    const getFullUrl = (url) => {
      if (!url) return ""
      if (url.startsWith("http")) return url

      const baseUrl = process.env.REACT_APP_API_URL || ""
      return `${baseUrl}${url}`
    }

    const fullUrl = getFullUrl(safeMessage.fileUrl)

    // Get file icon based on type
    const getFileIcon = (fileType, fileName) => {
      if (!fileName) return "📄"

      const extension = fileName.split(".").pop().toLowerCase()

      if (fileType === "pdf" || extension === "pdf") return "📕"
      if (fileType === "doc" || ["doc", "docx"].includes(extension)) return "📝"
      if (["xls", "xlsx", "csv"].includes(extension)) return "📊"
      if (["ppt", "pptx"].includes(extension)) return "📺"
      if (["zip", "rar", "7z"].includes(extension)) return "🗄️"
      if (["txt", "md"].includes(extension)) return "📄"

      return "📎"
    }

    switch (safeMessage.fileType) {
      case "image":
        return (
          <div className="file-content image-content">
            <img
              src={fullUrl || "/placeholder.svg"}
              alt={safeMessage.fileName || "Image"}
              onError={(e) => {
                console.error("Error loading image:", e)
                e.target.src =
                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iI2VlZSI+SW1hZ2UgRXJyb3I8L3RleHQ+PC9zdmc+"
              }}
            />
            <div className="file-name">{safeMessage.fileName || "Image"}</div>
          </div>
        )
      case "video":
        return (
          <div className="file-content video-content">
            <video
              src={fullUrl}
              controls
              onError={(e) => {
                console.error("Error loading video:", e)
              }}
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
            <div className="file-name">{safeMessage.fileName || "Video"}</div>
          </div>
        )
      case "pdf":
        return (
          <div className="file-content document-content pdf-content">
            <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="file-download">
              <span className="file-icon">📕</span>
              <span className="file-label">{safeMessage.fileName || "PDF Document"}</span>
            </a>
            {/* PDF preview if browser supports it */}
            <div className="pdf-preview">
              <object data={fullUrl} type="application/pdf" width="100%" height="200px">
                <p>Your browser doesn't support PDF preview</p>
              </object>
            </div>
          </div>
        )
      case "doc":
        return (
          <div className="file-content document-content">
            <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="file-download">
              <span className="file-icon">📝</span>
              <span className="file-label">{safeMessage.fileName || "Document"}</span>
            </a>
          </div>
        )
      case "file":
      default:
        if (safeMessage.fileUrl) {
          const fileIcon = getFileIcon(safeMessage.fileType, safeMessage.fileName)
          return (
            <div className="file-content document-content">
              <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="file-download">
                <span className="file-icon">{fileIcon}</span>
                <span className="file-label">{safeMessage.fileName || "File"}</span>
              </a>
            </div>
          )
        }
        return null
    }
  }

  // Render reply preview if message is a reply
  const renderReplyPreview = () => {
    if (!safeMessage.replyTo) return null

    return (
      <div className="reply-preview">
        <div className="reply-line"></div>
        <div className="reply-content">
          <div className="reply-sender">{safeMessage.replyTo.sender?.username || "User"}</div>
          <div className="reply-text">
            {safeMessage.replyTo.message?.text || safeMessage.replyTo.text || 
             (safeMessage.replyTo.fileType !== "text" ? "Media message" : "")}
          </div>
        </div>
      </div>
    )
  }

  // Render message status indicator
  const renderStatusIndicator = () => {
    if (!safeMessage.fromSelf) return null

    let statusIcon = "✓"
    let statusClass = "sent"

    if (safeMessage.status === "delivered") {
      statusIcon = "✓✓"
      statusClass = "delivered"
    } else if (safeMessage.status === "read") {
      statusIcon = "✓✓"
      statusClass = "read"
    }

    return <span className={`status-indicator ${statusClass}`}>{statusIcon}</span>
  }

  // Render reactions
  const renderReactions = () => {
    if (!safeMessage.reactions || safeMessage.reactions.length === 0) return null

    // Group reactions by type
    const reactionCounts = {}
    safeMessage.reactions.forEach((reaction) => {
      if (!reactionCounts[reaction.reaction]) {
        reactionCounts[reaction.reaction] = 0
      }
      reactionCounts[reaction.reaction]++
    })

    return (
      <div className="reactions-display">
        {Object.entries(reactionCounts).map(([reaction, count]) => (
          <div key={reaction} className="reaction-item">
            <span className="reaction-emoji">{reaction}</span>
            {count > 1 && <span className="reaction-count">{count}</span>}
          </div>
        ))}
      </div>
    )
  }

  // For displaying the message text content
  const messageContent = safeMessage.text || safeMessage.message

  // Check if this message is from the current user
  // This is important because we can't rely solely on the fromSelf property
  // when loading historical messages
  const isFromCurrentUser = safeMessage.fromSelf || 
    (safeMessage.sender && currentUser && safeMessage.sender._id === currentUser._id)

  return (
    <MessageContainer className={`message ${isFromCurrentUser ? "sended" : "recieved"}`} theme={theme}>
      {/* Display sender name for group messages */}
      {isGroupMessage && !isFromCurrentUser && safeMessage.sender && (
        <div className="sender-name">{safeMessage.sender.username || "Unknown User"}</div>
      )}

      {renderReplyPreview()}

      {/* Render file content if present */}
      {safeMessage.fileType && safeMessage.fileType !== "text" && safeMessage.fileUrl && renderFileContent()}

      {/* Render text message if present */}
      {messageContent && (
        <div className="content">
          <p>{messageContent}</p>
          {renderStatusIndicator()}
        </div>
      )}

      {/* Render reactions */}
      {renderReactions()}

      {/* Message actions */}
      <div className="message-actions">
        <button className="action-btn reply" onClick={() => onReply && onReply()}>
          <BsReply />
        </button>
        <button className="action-btn reaction" onClick={() => setShowReactions(!showReactions)}>
          <BsEmojiSmile />
        </button>
      </div>

      {/* Reaction picker */}
      {showReactions && (
        <div className="reaction-picker">
          {reactions.map((reaction) => (
            <button
              key={reaction}
              className="reaction-btn"
              onClick={() => {
                onReaction && onReaction(reaction)
                setShowReactions(false)
              }}
            >
              {reaction}
            </button>
          ))}
        </div>
      )}
    </MessageContainer>
  )
}

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  max-width: 100%;
  
  &.sended {
    align-self: flex-end;
    align-items: flex-end;
    
    .content {
      background-color: var(--message-sent);
      border-radius: 1rem 0 1rem 1rem;
    }
    
    .file-content {
      background-color: var(--message-sent);
    }
    
    .message-actions {
      right: 0;
    }
    
    .reaction-picker {
      right: 0;
    }
    
    .reply-preview {
      align-items: flex-end;
      
      .reply-line {
        right: 1rem;
      }
    }
  }
  
  &.recieved {
    align-self: flex-start;
    align-items: flex-start;
    
    .content {
      background-color: var(--message-received);
      border-radius: 0 1rem 1rem 1rem;
    }
    
    .file-content {
      background-color: var(--message-received);
    }
    
    .message-actions {
      left: 0;
    }
    
    .reaction-picker {
      left: 0;
    }
    
    .reply-preview {
      align-items: flex-start;
      
      .reply-line {
        left: 1rem;
      }
    }
  }
  
  .sender-name {
    font-size: 0.85rem;
    font-weight: bold;
    color: var(--accent-color);
    margin-bottom: 0.3rem;
    padding-left: 0.5rem;
  }
  
  .content {
    position: relative;
    max-width: 100%;
    overflow-wrap: break-word;
    padding: 1rem;
    font-size: 1.1rem;
    color: var(--text-secondary);
    
    .status-indicator {
      position: absolute;
      bottom: 0.3rem;
      right: 0.5rem;
      font-size: 0.7rem;
      
      &.sent {
        color: var(--text-muted);
      }
      
      &.delivered {
        color: var(--text-muted);
      }
      
      &.read {
        color: var(--accent-light);
      }
    }
  }
  
  .file-content {
    max-width: 100%;
    border-radius: 1rem;
    overflow: hidden;
    margin-bottom: 0.5rem;
    
    .file-name {
      padding: 0.5rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    &.image-content {
      display: flex;
      flex-direction: column;
      background-color: rgba(255, 255, 255, 0.05);
      
      img {
        width: 100%;
        max-height: 300px;
        object-fit: contain;
        border-radius: 0.5rem 0.5rem 0 0;
        background-color: var(--tertiary-bg);
        min-height: 150px;
        display: block;
      }
    }
    
    &.video-content {
      display: flex;
      flex-direction: column;
      background-color: rgba(255, 255, 255, 0.05);
      
      video {
        width: 100%;
        max-height: 300px;
        min-height: 180px;
        border-radius: 0.5rem 0.5rem 0 0;
        background-color: #000000;
        object-fit: contain;
      }
    }
    
    &.pdf-content {
      .pdf-preview {
        margin-top: 0.5rem;
        border-radius: 0.5rem;
        overflow: hidden;
        background-color: var(--tertiary-bg);
        
        object {
          background-color: white;
        }
      }
    }
    
    &.document-content {
      padding: 0.75rem 1rem;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      
      .file-download {
        display: flex;
        align-items: center;
        color: var(--text-secondary);
        text-decoration: none;
        font-size: 1rem;
        gap: 0.5rem;
        
        .file-icon {
          font-size: 1.5rem;
        }
        
        .file-label {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
  
  .message-actions {
    position: absolute;
    top: 0;
    transform: translateY(-100%);
    display: flex;
    gap: 0.5rem;
    background-color: var(--tertiary-bg);
    border-radius: 0.5rem;
    padding: 0.3rem;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 10;
    
    .action-btn {
      background: none;
      border: none;
      color: var(--text-color);
      cursor: pointer;
      padding: 0.3rem;
      border-radius: 0.3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        background-color: var(--input-bg);
      }
    }
  }
  
  .reaction-picker {
    position: absolute;
    top: 0;
    transform: translateY(-150%);
    display: flex;
    gap: 0.3rem;
    background-color: var(--tertiary-bg);
    border-radius: 2rem;
    padding: 0.5rem;
    z-index: 20;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    
    .reaction-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.2rem;
      padding: 0.3rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
      
      &:hover {
        transform: scale(1.2);
        background-color: var(--input-bg);
      }
    }
  }
  
  .reactions-display {
    display: flex;
    gap: 0.3rem;
    margin-top: 0.3rem;
    
    .reaction-item {
      display: flex;
      align-items: center;
      background-color: var(--tertiary-bg);
      border-radius: 1rem;
      padding: 0.2rem 0.5rem;
      font-size: 0.9rem;
      
      .reaction-emoji {
        margin-right: 0.2rem;
      }
      
      .reaction-count {
        font-size: 0.8rem;
        color: var(--text-muted);
      }
    }
  }
  
  .reply-preview {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-bottom: 0.3rem;
    position: relative;
    
    .reply-line {
      position: absolute;
      top: 0;
      width: 2px;
      height: 100%;
      background-color: var(--accent-light);
    }
    
    .reply-content {
      background-color: var(--tertiary-bg);
      border-radius: 0.5rem;
      padding: 0.5rem;
      margin: 0 0.5rem;
      max-width: 80%;
      
      .reply-sender {
        font-size: 0.8rem;
        font-weight: bold;
        color: var(--accent-light);
        margin-bottom: 0.2rem;
      }
      
      .reply-text {
        font-size: 0.8rem;
        color: var(--text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
  
  &:hover {
    .message-actions {
      opacity: 1;
    }
  }
  
  @media screen and (max-width: 768px) {
    max-width: 85%;
  }
`
