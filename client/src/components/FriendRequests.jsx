"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import styled from "styled-components"
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest } from "../utils/APIRoutes"

export default function FriendRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const currentUser = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY))

        if (!currentUser) {
          setError("User not found")
          setLoading(false)
          return
        }

        const response = await axios.get(`${getFriendRequests}/${currentUser._id}`)

        if (response.data.status) {
          setRequests(response.data.requests)
        } else {
          setError(response.data.msg || "Failed to fetch requests")
        }
      } catch (err) {
        setError("Error fetching friend requests")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [])

  const handleAccept = async (userId) => {
    try {
      const currentUser = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY))

      const response = await axios.post(`${acceptFriendRequest}/${currentUser._id}`, {
        userId,
      })

      if (response.data.status) {
        // Remove the accepted request from the list
        setRequests(requests.filter((request) => request._id !== userId))
      } else {
        setError(response.data.msg || "Failed to accept request")
      }
    } catch (err) {
      setError("Error accepting friend request")
      console.error(err)
    }
  }

  const handleReject = async (userId) => {
    try {
      const currentUser = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY))

      const response = await axios.post(`${rejectFriendRequest}/${currentUser._id}`, {
        userId,
      })

      if (response.data.status) {
        // Remove the rejected request from the list
        setRequests(requests.filter((request) => request._id !== userId))
      } else {
        setError(response.data.msg || "Failed to reject request")
      }
    } catch (err) {
      setError("Error rejecting friend request")
      console.error(err)
    }
  }

  if (loading) {
    return (
      <Container>
        <div className="loading">Loading requests...</div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="title">
        <h2>Friend Requests</h2>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="requests-container">
        {requests.length === 0 ? (
          <div className="no-requests">No pending friend requests</div>
        ) : (
          requests.map((request) => (
            <div className="request" key={request._id}>
              <div className="user-info">
                <div className="avatar">
                  <img src={`data:image/svg+xml;base64,${request.avatarImage}`} alt="avatar" />
                </div>
                <div className="username">
                  <h3>{request.username}</h3>
                </div>
              </div>
              <div className="actions">
                <button className="accept-btn" onClick={() => handleAccept(request._id)}>
                  Accept
                </button>
                <button className="reject-btn" onClick={() => handleReject(request._id)}>
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: #080420;
  color: white;
  
  .title {
    padding: 1rem;
    text-align: center;
    border-bottom: 1px solid #ffffff34;
    
    h2 {
      color: white;
      font-size: 1.5rem;
    }
  }
  
  .loading, .error, .no-requests {
    padding: 1rem;
    text-align: center;
  }
  
  .error {
    color: #ff5555;
  }
  
  .requests-container {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding: 1rem;
    overflow-y: auto;
    
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    
    .request {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #ffffff34;
      padding: 1rem;
      border-radius: 0.5rem;
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        
        .avatar {
          img {
            height: 3rem;
          }
        }
        
        .username {
          h3 {
            color: white;
          }
        }
      }
      
      .actions {
        display: flex;
        gap: 0.5rem;
        
        button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s ease;
          
          &.accept-btn {
            background-color: #4CAF50;
            color: white;
            
            &:hover {
              background-color: #45a049;
            }
          }
          
          &.reject-btn {
            background-color: #f44336;
            color: white;
            
            &:hover {
              background-color: #d32f2f;
            }
          }
        }
      }
    }
  }
`
