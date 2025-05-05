"use client"

import { useState, useRef, useEffect } from "react"
import { BsEmojiSmileFill } from "react-icons/bs"
import { IoMdSend } from "react-icons/io"
import { IoClose } from "react-icons/io5"
import { MdAttachFile } from "react-icons/md"
import styled from "styled-components"
import Picker from "emoji-picker-react"
import { useTheme } from "../context/ThemeContext"

export default function ChatInput({ handleSendMsg, onTyping, replyingTo, onCancelReply }) {
  const [msg, setMsg] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState("")
  const fileInputRef = useRef(null)
  const inputRef = useRef(null)
  const { theme } = useTheme()

  // Maximum file size in bytes (5MB)
  const MAX_FILE_SIZE = 5 * 1024 * 1024

  // Supported file types
  const SUPPORTED_FILE_TYPES = [
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    // Videos
    "video/mp4",
    "video/webm",
    "video/quicktime",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Text
    "text/plain",
    "text/csv",
    "text/html",
    // Archives
    "application/zip",
    "application/x-rar-compressed",
  ]

  // Focus input when replying to a message
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus()
    }
  }, [replyingTo])

  const handleEmojiPickerhideShow = () => {
    setShowEmojiPicker(!showEmojiPicker)
  }

  const handleEmojiClick = (event, emojiObject) => {
    let message = msg
    message += emojiObject.emoji
    setMsg(message)
    // Focus back on the input field after selecting an emoji
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleFileChange = (e) => {
    setFileError("")
    const selectedFile = e.target.files[0]

    if (!selectedFile) return

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setFileError("File too large (max 5MB)")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    // Validate file type
    if (!SUPPORTED_FILE_TYPES.includes(selectedFile.type)) {
      console.log("Unsupported file type:", selectedFile.type)
      setFileError("Unsupported file type")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    // Set the file if all validations pass
    setFile(selectedFile)
  }

  const triggerFileInput = () => {
    // Programmatically click the hidden file input
    fileInputRef.current.click()
  }

  const sendChat = (event) => {
    event.preventDefault()

    // Clear any previous errors
    setFileError("")

    // Don't send if there's nothing to send
    if (msg.trim().length === 0 && !file) {
      return
    }

    // Call the parent handler with message and/or file
    handleSendMsg(msg, file)

    // Reset form
    setMsg("")
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    // Close emoji picker if open
    if (showEmojiPicker) {
      setShowEmojiPicker(false)
    }

    // Focus back on input
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const removeFile = () => {
    setFile(null)
    setFileError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handle typing indicator
  const handleInputChange = (e) => {
    setMsg(e.target.value)

    // Notify parent component about typing
    if (e.target.value.length > 0) {
      onTyping(true)
    } else {
      onTyping(false)
    }
  }

  // Helper function to get a shortened filename
  const getShortenedFileName = (fileName, maxLength = 20) => {
    if (!fileName) return ""
    if (fileName.length <= maxLength) return fileName

    const extension = fileName.split(".").pop()
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf("."))
    const shortenedName = nameWithoutExt.substring(0, maxLength - extension.length - 3) + "..."

    return `${shortenedName}.${extension}`
  }

  // Helper to get file icon based on type
  const getFileTypeIcon = (file) => {
    if (!file) return ""

    const type = file.type

    if (type.startsWith("image/")) return "🖼️"
    if (type.startsWith("video/")) return "🎬"
    if (type === "application/pdf") return "📕"
    if (type.includes("word") || type === "application/msword") return "📝"
    if (type.includes("excel") || type === "text/csv") return "📊"
    if (type.includes("powerpoint")) return "📺"
    if (type.includes("zip") || type.includes("rar")) return "🗄️"
    if (type.startsWith("text/")) return "📄"

    return "📎"
  }

  return (
    <Container theme={theme}>
      <form className="input-container" onSubmit={(event) => sendChat(event)}>
        {replyingTo && (
          <div className="reply-container">
            <div className="reply-info">
              <span className="reply-label">Replying to</span>
              <span className="reply-name">{replyingTo.fromSelf ? "yourself" : "them"}</span>
              <span className="reply-text">{replyingTo.message || "Media message"}</span>
            </div>
            <button type="button" className="cancel-reply" onClick={onCancelReply}>
              <IoClose />
            </button>
          </div>
        )}

        {(file || fileError) && (
          <div className={`file-preview ${fileError ? "has-error" : ""}`}>
            {file && !fileError && (
              <>
                <span className="file-icon">{getFileTypeIcon(file)}</span>
                <p className="file-name">{getShortenedFileName(file.name)}</p>
              </>
            )}
            {fileError && (
              <>
                <span className="error-icon">⚠️</span>
                <p className="error-message">{fileError}</p>
              </>
            )}
            <button type="button" onClick={removeFile} className="remove-file">
              <IoClose />
            </button>
          </div>
        )}

        <div className="button-container">
          <div className="emoji">
            <BsEmojiSmileFill onClick={handleEmojiPickerhideShow} />
            {showEmojiPicker && <Picker onEmojiClick={handleEmojiClick} />}
          </div>
        </div>

        <input
          type="text"
          placeholder="Type your message here"
          onChange={handleInputChange}
          value={msg}
          ref={inputRef}
        />

        <div className="action-buttons">
          <div className="file-upload">
            <button type="button" onClick={triggerFileInput} className="file-button">
              <MdAttachFile />
            </button>
            <input
              type="file"
              id="file-upload"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.*,text/plain,text/csv,application/zip,application/x-rar-compressed"
              style={{ display: "none" }}
            />
          </div>

          <button
            type="submit"
            className={`send-button ${!msg.trim() && !file ? "disabled" : ""}`}
            disabled={!msg.trim() && !file}
          >
            <IoMdSend />
          </button>
        </div>
      </form>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  align-items: center;
  background-color: var(--tertiary-bg);
  padding: 0 2rem;
  width: 100%;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    padding: 0 1rem;
  }

  .input-container {
    width: 100%;
    border-radius: 2rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: var(--input-bg);
    padding: 0.5rem 0.5rem;
    position: relative;
    
    input {
      flex: 1;
      height: 60%;
      background-color: transparent;
      color: var(--text-color);
      border: none;
      font-size: 1.2rem;
      
      &::selection {
        background-color: var(--accent-light);
      }
      &:focus {
        outline: none;
      }
    }
    
    .reply-container {
      position: absolute;
      top: -48px;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: var(--tertiary-bg);
      padding: 8px 12px;
      border-radius: 1rem 1rem 0 0;
      
      .reply-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        overflow: hidden;
        
        .reply-label {
          color: var(--text-muted);
          font-size: 0.8rem;
        }
        
        .reply-name {
          color: var(--accent-light);
          font-weight: bold;
          font-size: 0.9rem;
        }
        
        .reply-text {
          color: var(--text-secondary);
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
      
      .cancel-reply {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &:hover {
          color: var(--error-color);
        }
      }
    }
    
    .file-preview {
      position: absolute;
      top: -48px;
      left: 0;
      display: flex;
      align-items: center;
      background-color: rgba(255, 255, 255, 0.15);
      padding: 8px 12px;
      border-radius: 1rem;
      color: var(--text-color);
      max-width: 80%;
      min-width: 150px;
      
      &.has-error {
        background-color: rgba(255, 100, 100, 0.3);
      }
      
      .file-icon, .error-icon {
        margin-right: 8px;
        font-size: 1.2rem;
      }
      
      .file-name, .error-message {
        margin: 0;
        font-size: 0.9rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
      }
      
      .remove-file {
        background: none;
        border: none;
        margin-left: 8px;
        cursor: pointer;
        color: var(--text-muted);
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        
        &:hover {
          color: var(--error-color);
        }
      }
    }
  }
  
  .button-container {
    display: flex;
    align-items: center;
    color: var(--text-color);
    
    .emoji {
      position: relative;
      margin-right: 8px;
      
      svg {
        font-size: 1.5rem;
        color: var(--accent-light);
        cursor: pointer;
      }
      
      .emoji-picker-react {
        position: absolute;
        bottom: 40px;
        left: 0;
        background-color: var(--secondary-bg);
        box-shadow: 0 5px 10px var(--accent-light);
        border-color: var(--accent-light);
        z-index: 5;
        
        .emoji-scroll-wrapper::-webkit-scrollbar {
          background-color: var(--secondary-bg);
          width: 5px;
          &-thumb {
            background-color: var(--accent-light);
          }
        }
        
        .emoji-categories {
          button {
            filter: contrast(0);
          }
        }
        
        .emoji-search {
          background-color: transparent;
          border-color: var(--accent-light);
        }
        
        .emoji-group:before {
          background-color: var(--secondary-bg);
        }
      }
    }
  }
  
  .action-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
  
    .file-upload {
      .file-button {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 1.5rem;
        color: var(--accent-light);
        display: flex;
        align-items: center;
        padding: 0;
      }
    }
    
    .send-button {
      padding: 0.3rem;
      border-radius: 50%;
      display: flex;
      justify: center;
      align-items: center;
      background-color: var(--accent-light);
      border: none;
      cursor: pointer;
      width: 2.5rem;
      height: 2.5rem;
      transition: all 0.2s ease-in-out;
      
      &.disabled {
        background-color: var(--text-muted);
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      @media screen and (min-width: 720px) and (max-width: 1080px) {
        padding: 0.2rem;
        width: 2.2rem;
        height: 2.2rem;
      }
      
      svg {
        font-size: 1.5rem;
        color: white;
      }
      
      &:hover:not(.disabled) {
        background-color: var(--accent-hover);
      }
    }
  }
`
