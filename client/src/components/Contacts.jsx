"use client"

import { useState, useEffect } from "react"
import styled from "styled-components"
import Logo from "../assets/swiftchat.svg"
import FriendManagement from "./FriendManagement"
import FriendRequestBadge from "./FriendRequestBadge"
import { IoPersonAdd } from "react-icons/io5"
import { MdGroup, MdGroupAdd } from "react-icons/md"
import { useNavigate } from "react-router-dom"
import ThemeToggle from "./ThemeToggle"
import { useTheme } from "../context/ThemeContext"

export default function Contacts({
  contacts,
  groups,
  changeChat,
  changeGroup,
  refreshContacts,
  currentChat,
  currentGroup,
}) {
  const [currentUserName, setCurrentUserName] = useState(undefined)
  const [currentUserImage, setCurrentUserImage] = useState(undefined)
  const [currentSelected, setCurrentSelected] = useState(undefined)
  const [currentGroupSelected, setCurrentGroupSelected] = useState(undefined)
  const [showFriendManagement, setShowFriendManagement] = useState(false)
  const [activeTab, setActiveTab] = useState("friends")
  const navigate = useNavigate()
  const { theme } = useTheme()

  useEffect(() => {
    const fetchUserData = async () => {
      const data = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY))
      setCurrentUserName(data.username)
      setCurrentUserImage(data.avatarImage)
    }

    fetchUserData()
  }, [])

  useEffect(() => {
    // Reset selections when changing tabs
    if (activeTab === "friends") {
      setCurrentGroupSelected(undefined)
      if (currentChat) {
        const index = contacts.findIndex((contact) => contact._id === currentChat._id)
        setCurrentSelected(index >= 0 ? index : undefined)
      }
    } else {
      setCurrentSelected(undefined)
      if (currentGroup) {
        const index = groups.findIndex((group) => group._id === currentGroup._id)
        setCurrentGroupSelected(index >= 0 ? index : undefined)
      }
    }
  }, [activeTab, contacts, groups, currentChat, currentGroup])

  const changeCurrentChat = (index, contact) => {
    setCurrentSelected(index)
    setCurrentGroupSelected(undefined)
    changeChat(contact)
  }

  const changeCurrentGroup = (index, group) => {
    setCurrentGroupSelected(index)
    setCurrentSelected(undefined)
    changeGroup(group)
  }

  const handleCloseFriendManagement = () => {
    setShowFriendManagement(false)
    // Refresh contacts list when closing the friend management panel
    refreshContacts()
  }

  const handleCreateGroup = () => {
    navigate("/create-group")
  }

  return (
    <>
      {currentUserImage && currentUserImage && (
        <Container theme={theme}>
          {showFriendManagement ? (
            <FriendManagement onClose={handleCloseFriendManagement} />
          ) : (
            <>
              <div className="brand">
                <img src={Logo || "/placeholder.svg"} alt="logo" />
                <h3>SwiftChat</h3>
                <ThemeToggle />
              </div>

              <div className="tabs">
                <button
                  className={`tab ${activeTab === "friends" ? "active" : ""}`}
                  onClick={() => setActiveTab("friends")}
                >
                  Friends
                </button>
                <button
                  className={`tab ${activeTab === "groups" ? "active" : ""}`}
                  onClick={() => setActiveTab("groups")}
                >
                  Groups
                </button>
              </div>

              {activeTab === "friends" ? (
                <>
                  <div className="contacts-header">
                    <h3>Friends</h3>
                    <div className="friend-button-container">
                      <button className="manage-friends-btn" onClick={() => setShowFriendManagement(true)}>
                        <IoPersonAdd />
                        <FriendRequestBadge />
                      </button>
                    </div>
                  </div>
                  <div className="contacts">
                    {contacts.map((contact, index) => {
                      return (
                        <div
                          key={contact._id}
                          className={`contact ${index === currentSelected ? "selected" : ""}`}
                          onClick={() => changeCurrentChat(index, contact)}
                        >
                          <div className="avatar">
                            <img src={`data:image/svg+xml;base64,${contact.avatarImage}`} alt="" />
                            <div
                              className={`status-indicator ${contact.status === "online" ? "online" : "offline"}`}
                            ></div>
                          </div>
                          <div className="username">
                            <h3>{contact.username}</h3>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div className="contacts-header">
                    <h3>Groups</h3>
                    <div className="friend-button-container">
                      <button className="manage-friends-btn" onClick={handleCreateGroup}>
                        <MdGroupAdd />
                      </button>
                    </div>
                  </div>
                  <div className="contacts">
                    {groups.length === 0 ? (
                      <div className="no-groups">
                        <MdGroup />
                        <p>No groups yet</p>
                        <button onClick={handleCreateGroup}>Create Group</button>
                      </div>
                    ) : (
                      groups.map((group, index) => {
                        return (
                          <div
                            key={group._id}
                            className={`contact ${index === currentGroupSelected ? "selected" : ""}`}
                            onClick={() => changeCurrentGroup(index, group)}
                          >
                            <div className="avatar">
                              <img src={`data:image/svg+xml;base64,${group.avatar}`} alt="" />
                            </div>
                            <div className="username">
                              <h3>{group.name}</h3>
                              <span className="member-count">{group.members.length} members</span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </>
              )}

              <div className="current-user">
                <div className="avatar">
                  <img src={`data:image/svg+xml;base64,${currentUserImage}`} alt="avatar" />
                </div>
                <div className="username">
                  <h2>{currentUserName}</h2>
                </div>
              </div>
            </>
          )}
        </Container>
      )}
    </>
  )
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 5% 5% 65% 15%;
  overflow: hidden;
  background-color: var(--secondary-bg);
  position: relative;
  
  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    position: relative;
    
    img {
      height: 2rem;
    }
    
    h3 {
      color: var(--text-color);
      text-transform: uppercase;
    }
  }
  
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    
    .tab {
      flex: 1;
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1rem;
      padding: 0.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &.active {
        color: var(--text-color);
        border-bottom: 2px solid var(--accent-light);
      }
      
      &:hover:not(.active) {
        color: var(--text-secondary);
      }
    }
  }
  
  .contacts-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
    
    h3 {
      color: var(--text-color);
      font-size: 1rem;
    }
    
    .friend-button-container {
      position: relative;
    }
    
    .manage-friends-btn {
      background: none;
      border: none;
      color: var(--accent-light);
      font-size: 1.2rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        color: var(--text-color);
      }
    }
  }
  
  .contacts {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    gap: 0.8rem;
    padding-top: 0.5rem;
    
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: var(--scrollbar-thumb);
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    
    .contact {
      background-color: var(--input-bg);
      min-height: 5rem;
      cursor: pointer;
      width: 90%;
      border-radius: 0.5rem;
      padding: 0.4rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      transition: 0.3s ease-in-out;
      
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
          border: 2px solid var(--secondary-bg);
          
          &.online {
            background-color: var(--success-color);
          }
          
          &.offline {
            background-color: var(--text-muted);
          }
        }
      }
      
      .username {
        display: flex;
        flex-direction: column;
        
        h3 {
          color: var(--text-color);
          margin-bottom: 0.2rem;
        }
        
        .member-count {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
      }
      
      &:hover {
        background-color: var(--tertiary-bg);
      }
    }
    
    .selected {
      background-color: var(--accent-light);
      
      .username {
        h3, .member-count {
          color: white;
        }
      }
      
      &:hover {
        background-color: var(--accent-light);
      }
    }
    
    .no-groups {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      padding: 2rem 1rem;
      text-align: center;
      width: 90%;
      
      svg {
        font-size: 3rem;
        margin-bottom: 1rem;
      }
      
      p {
        margin-bottom: 1rem;
      }
      
      button {
        background-color: var(--accent-color);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
        
        &:hover {
          background-color: var(--accent-hover);
        }
      }
    }
  }

  .current-user {
    background-color: var(--tertiary-bg);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    
    .avatar {
      img {
        height: 4rem;
        max-inline-size: 100%;
      }
    }
    
    .username {
      h2 {
        color: var(--text-color);
      }
    }
    
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      gap: 0.5rem;
      .username {
        h2 {
          font-size: 1rem;
        }
      }
    }
  }
`
