"use client"

import { useState } from "react"
import styled from "styled-components"
import axios from "axios"
import { addGroupMemberRoute, removeGroupMemberRoute, leaveGroupRoute } from "../utils/APIRoutes"
import { useNavigate } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"

export default function GroupInfoModal({ group, currentUser, onClose, onGroupUpdate }) {
  const [activeTab, setActiveTab] = useState("members")
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { theme } = useTheme()

  const isAdmin = group.admins.some((admin) => admin._id === currentUser._id)
  const isCreator = group.creator._id === currentUser._id

  const handleSearch = async (e) => {
    e.preventDefault()

    if (!searchTerm.trim()) return

    try {
      const response = await axios.get(`/api/friends/search/${currentUser._id}?username=${searchTerm}`)

      // Filter out users who are already members
      const filteredResults = response.data.filter((user) => !group.members.some((member) => member._id === user._id))

      setSearchResults(filteredResults)
    } catch (error) {
      setError("Error searching for users")
      console.error(error)
    }
  }

  const handleAddMember = async (userId) => {
    try {
      const response = await axios.post(`${addGroupMemberRoute}/${currentUser._id}`, {
        groupId: group._id,
        userId,
      })

      if (response.data.status) {
        // Update the group data
        onGroupUpdate()
        setSearchResults([])
        setSearchTerm("")
        setIsAddingMember(false)
      } else {
        setError(response.data.message)
      }
    } catch (error) {
      setError("Error adding member")
      console.error(error)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!isAdmin) return

    try {
      const response = await axios.post(`${removeGroupMemberRoute}/${currentUser._id}`, {
        groupId: group._id,
        userId,
      })

      if (response.data.status) {
        // Update the group data
        onGroupUpdate()
      } else {
        setError(response.data.message)
      }
    } catch (error) {
      setError("Error removing member")
      console.error(error)
    }
  }

  const handleLeaveGroup = async () => {
    try {
      const response = await axios.post(`${leaveGroupRoute}/${currentUser._id}`, {
        groupId: group._id,
      })

      if (response.data.status) {
        onClose()
        onGroupUpdate()
      } else {
        setError(response.data.message)
      }
    } catch (error) {
      setError("Error leaving group")
      console.error(error)
    }
  }

  return (
    <ModalOverlay theme={theme}>
      <ModalContainer>
        <div className="modal-header">
          <h2>{group.name}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="group-info">
          <div className="avatar">
            <img src={`data:image/svg+xml;base64,${group.avatar}`} alt={group.name} />
          </div>
          <p className="description">{group.description || "No description"}</p>
          <p className="created-by">Created by {group.creator.username}</p>
        </div>

        <div className="tabs">
          <button className={`tab ${activeTab === "members" ? "active" : ""}`} onClick={() => setActiveTab("members")}>
            Members ({group.members.length})
          </button>
          {isAdmin && (
            <button
              className={`tab ${activeTab === "add" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("add")
                setIsAddingMember(true)
              }}
            >
              Add Members
            </button>
          )}
        </div>

        <div className="tab-content">
          {activeTab === "members" && (
            <div className="members-list">
              {group.members.map((member) => (
                <div key={member._id} className="member-item">
                  <div className="member-info">
                    <div className="avatar">
                      <img src={`data:image/svg+xml;base64,${member.avatarImage}`} alt={member.username} />
                    </div>
                    <div className="username">
                      <span>{member.username}</span>
                      {group.creator._id === member._id && <span className="badge creator">Creator</span>}
                      {group.admins.some((admin) => admin._id === member._id) && member._id !== group.creator._id && (
                        <span className="badge admin">Admin</span>
                      )}
                    </div>
                  </div>

                  {isAdmin && member._id !== currentUser._id && member._id !== group.creator._id && (
                    <button className="remove-btn" onClick={() => handleRemoveMember(member._id)}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "add" && (
            <div className="add-members">
              <form onSubmit={handleSearch} className="search-form">
                <input
                  type="text"
                  placeholder="Search friends by username"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit">Search</button>
              </form>

              {error && <p className="error">{error}</p>}

              <div className="search-results">
                {searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <div key={user._id} className="user-item">
                      <div className="user-info">
                        <div className="avatar">
                          <img src={`data:image/svg+xml;base64,${user.avatarImage}`} alt={user.username} />
                        </div>
                        <span className="username">{user.username}</span>
                      </div>
                      <button className="add-btn" onClick={() => handleAddMember(user._id)}>
                        Add
                      </button>
                    </div>
                  ))
                ) : searchTerm ? (
                  <p className="no-results">No users found</p>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {!isCreator && (
          <div className="actions">
            <button className="leave-btn" onClick={handleLeaveGroup}>
              Leave Group
            </button>
          </div>
        )}
      </ModalContainer>
    </ModalOverlay>
  )
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const ModalContainer = styled.div`
  background-color: var(--container-bg);
  border-radius: 1rem;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
    
    h2 {
      color: var(--text-color);
      margin: 0;
    }
    
    .close-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.5rem;
      cursor: pointer;
      
      &:hover {
        color: var(--error-color);
      }
    }
  }
  
  .group-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    
    .avatar {
      width: 80px;
      height: 80px;
      margin-bottom: 1rem;
      
      img {
        width: 100%;
        height: 100%;
      }
    }
    
    .description {
      color: var(--text-secondary);
      text-align: center;
      margin-bottom: 0.5rem;
    }
    
    .created-by {
      color: var(--text-muted);
      font-size: 0.9rem;
    }
  }
  
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    
    .tab {
      flex: 1;
      background: none;
      border: none;
      padding: 0.75rem;
      color: var(--text-muted);
      cursor: pointer;
      
      &.active {
        color: var(--text-color);
        border-bottom: 2px solid var(--accent-light);
      }
      
      &:hover:not(.active) {
        color: var(--text-secondary);
      }
    }
  }
  
  .tab-content {
    padding: 1rem;
    flex: 1;
    overflow-y: auto;
    
    .members-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      
      .member-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        border-radius: 0.5rem;
        
        &:hover {
          background-color: var(--input-bg);
        }
        
        .member-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          
          .avatar {
            width: 40px;
            height: 40px;
            
            img {
              width: 100%;
              height: 100%;
            }
          }
          
          .username {
            color: var(--text-color);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            
            .badge {
              font-size: 0.7rem;
              padding: 0.2rem 0.4rem;
              border-radius: 0.3rem;
              
              &.creator {
                background-color: var(--accent-light);
                color: white;
              }
              
              &.admin {
                background-color: var(--info-color);
                color: white;
              }
            }
          }
        }
        
        .remove-btn {
          background-color: var(--error-color);
          color: white;
          border: none;
          padding: 0.3rem 0.6rem;
          border-radius: 0.3rem;
          cursor: pointer;
          
          &:hover {
            opacity: 0.9;
          }
        }
      }
    }
    
    .add-members {
      .search-form {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        
        input {
          flex: 1;
          padding: 0.5rem;
          border-radius: 0.3rem;
          border: 1px solid var(--border-color);
          background-color: var(--input-bg);
          color: var(--text-color);
          
          &:focus {
            outline: none;
            border-color: var(--accent-light);
          }
        }
        
        button {
          background-color: var(--accent-light);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.3rem;
          cursor: pointer;
          
          &:hover {
            background-color: var(--accent-hover);
          }
        }
      }
      
      .error {
        color: var(--error-color);
        margin-bottom: 1rem;
      }
      
      .search-results {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        
        .user-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          border-radius: 0.5rem;
          
          &:hover {
            background-color: var(--input-bg);
          }
          
          .user-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            
            .avatar {
              width: 40px;
              height: 40px;
              
              img {
                width: 100%;
                height: 100%;
              }
            }
            
            .username {
              color: var(--text-color);
            }
          }
          
          .add-btn {
            background-color: var(--success-color);
            color: white;
            border: none;
            padding: 0.3rem 0.6rem;
            border-radius: 0.3rem;
            cursor: pointer;
            
            &:hover {
              opacity: 0.9;
            }
          }
        }
        
        .no-results {
          color: var(--text-muted);
          text-align: center;
        }
      }
    }
  }
  
  .actions {
    padding: 1rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: center;
    
    .leave-btn {
      background-color: var(--error-color);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.3rem;
      cursor: pointer;
      
      &:hover {
        opacity: 0.9;
      }
    }
  }
`
