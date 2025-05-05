"use client"

import { useState } from "react"
import styled from "styled-components"
import FriendRequests from "./FriendRequests"
import UserSearch from "./UserSearch"

export default function FriendManagement({ onClose }) {
  const [activeTab, setActiveTab] = useState("requests")

  return (
    <Container>
      <div className="tabs">
        <button className={`tab ${activeTab === "requests" ? "active" : ""}`} onClick={() => setActiveTab("requests")}>
          Friend Requests
        </button>
        <button className={`tab ${activeTab === "search" ? "active" : ""}`} onClick={() => setActiveTab("search")}>
          Find Friends
        </button>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="content">{activeTab === "requests" ? <FriendRequests /> : <UserSearch />}</div>
    </Container>
  )
}

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #080420;
  z-index: 10;
  display: flex;
  flex-direction: column;
  
  .tabs {
    display: flex;
    background-color: #0d0d30;
    padding: 0.5rem;
    position: relative;
    
    .tab {
      flex: 1;
      padding: 0.75rem;
      background: none;
      border: none;
      color: #ffffff99;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &.active {
        color: white;
        border-bottom: 2px solid #9a86f3;
      }
      
      &:hover:not(.active) {
        color: #ffffffdd;
      }
    }
    
    .close-btn {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: white;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        color: #ff5555;
      }
    }
  }
  
  .content {
    flex: 1;
    overflow: hidden;
  }
`
