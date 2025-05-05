"use client"

import { useState, useEffect } from "react"
import styled from "styled-components"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { getFriends, createGroupRoute } from "../utils/APIRoutes"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useTheme } from "../context/ThemeContext"

export default function CreateGroup() {
  const [friends, setFriends] = useState([])
  const [selectedFriends, setSelectedFriends] = useState([])
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { theme } = useTheme()

  const toastOptions = {
    position: "bottom-right",
    autoClose: 8000,
    pauseOnHover: true,
    draggable: true,
    theme: theme === "light" ? "light" : "dark",
  }

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const currentUser = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY))

        if (!currentUser) {
          navigate("/login")
          return
        }

        const response = await axios.get(`${getFriends}/${currentUser._id}`)
        setFriends(response.data)
      } catch (error) {
        console.error("Error fetching friends:", error)
        toast.error("Failed to load friends", toastOptions)
      }
    }

    fetchFriends()
  }, [navigate, toastOptions])

  const toggleFriendSelection = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter((id) => id !== friendId))
    } else {
      setSelectedFriends([...selectedFriends, friendId])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (groupName.trim().length < 3) {
      toast.error("Group name must be at least 3 characters", toastOptions)
      return
    }

    if (selectedFriends.length === 0) {
      toast.error("Please select at least one friend", toastOptions)
      return
    }

    setIsLoading(true)

    try {
      const currentUser = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY))

      const response = await axios.post(`${createGroupRoute}/${currentUser._id}`, {
        name: groupName,
        description: groupDescription,
        members: selectedFriends,
      })

      if (response.data.status) {
        toast.success("Group created successfully", toastOptions)
        setTimeout(() => {
          navigate("/")
        }, 1000)
      } else {
        toast.error(response.data.message || "Failed to create group", toastOptions)
      }
    } catch (error) {
      console.error("Error creating group:", error)
      toast.error("Failed to create group", toastOptions)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container theme={theme}>
      <form onSubmit={handleSubmit}>
        <div className="title">
          <h1>Create New Group</h1>
        </div>

        <div className="group-details">
          <input
            type="text"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            minLength={3}
            required
          />

          <textarea
            placeholder="Group Description (optional)"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            maxLength={200}
          />
        </div>

        <div className="friends-section">
          <h2>Select Friends</h2>

          {friends.length === 0 ? (
            <div className="no-friends">
              <p>You don't have any friends yet</p>
              <button type="button" onClick={() => navigate("/")}>
                Add Friends
              </button>
            </div>
          ) : (
            <div className="friends-list">
              {friends.map((friend) => (
                <div
                  key={friend._id}
                  className={`friend-item ${selectedFriends.includes(friend._id) ? "selected" : ""}`}
                  onClick={() => toggleFriendSelection(friend._id)}
                >
                  <div className="avatar">
                    <img src={`data:image/svg+xml;base64,${friend.avatarImage}`} alt={friend.username} />
                  </div>
                  <div className="username">{friend.username}</div>
                  <div className="checkbox">{selectedFriends.includes(friend._id) && <span>✓</span>}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="actions">
          <button type="button" className="cancel-btn" onClick={() => navigate("/")}>
            Cancel
          </button>
          <button
            type="submit"
            className="create-btn"
            disabled={isLoading || groupName.trim().length < 3 || selectedFriends.length === 0}
          >
            {isLoading ? "Creating..." : "Create Group"}
          </button>
        </div>
      </form>
      <ToastContainer />
    </Container>
  )
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: var(--bg-color);
  
  form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    background-color: var(--container-bg);
    border-radius: 2rem;
    padding: 3rem;
    width: 90%;
    max-width: 700px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    
    .title {
      text-align: center;
      
      h1 {
        color: var(--text-color);
      }
    }
    
    .group-details {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      
      input, textarea {
        padding: 1rem;
        border: 1px solid var(--border-color);
        border-radius: 0.4rem;
        color: var(--text-color);
        width: 100%;
        font-size: 1rem;
        background-color: var(--input-bg);
        
        &:focus {
          border-color: var(--accent-light);
          outline: none;
        }
      }
      
      textarea {
        min-height: 100px;
        resize: vertical;
      }
    }
    
    .friends-section {
      h2 {
        color: var(--text-color);
        margin-bottom: 1rem;
      }
      
      .no-friends {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 2rem;
        
        p {
          color: var(--text-muted);
        }
        
        button {
          background-color: var(--accent-light);
          color: white;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.4rem;
          cursor: pointer;
          
          &:hover {
            background-color: var(--accent-hover);
          }
        }
      }
      
      .friends-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        max-height: 300px;
        overflow-y: auto;
        padding-right: 0.5rem;
        
        &::-webkit-scrollbar {
          width: 0.2rem;
          &-thumb {
            background-color: var(--scrollbar-thumb);
            width: 0.1rem;
            border-radius: 1rem;
          }
        }
        
        .friend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid var(--border-color);
          
          &:hover {
            background-color: var(--input-bg);
          }
          
          &.selected {
            background-color: var(--accent-light);
            border-color: var(--accent-light);
            
            .username {
              color: white;
            }
          }
          
          .avatar {
            width: 40px;
            height: 40px;
            
            img {
              width: 100%;
              height: 100%;
            }
          }
          
          .username {
            flex: 1;
            color: var(--text-color);
          }
          
          .checkbox {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            
            .selected & {
              background-color: white;
              color: var(--accent-light);
              border-color: white;
            }
          }
        }
      }
    }
    
    .actions {
      display: flex;
      justify-content: space-between;
      
      button {
        padding: 1rem 2rem;
        border: none;
        border-radius: 0.4rem;
        font-weight: bold;
        cursor: pointer;
        
        &.cancel-btn {
          background-color: var(--input-bg);
          color: var(--text-color);
          
          &:hover {
            background-color: var(--border-color);
          }
        }
        
        &.create-btn {
          background-color: var(--accent-color);
          color: white;
          
          &:hover:not(:disabled) {
            background-color: var(--accent-hover);
          }
          
          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        }
      }
    }
  }
`
