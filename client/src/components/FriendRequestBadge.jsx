"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import styled from "styled-components"
import { getFriendRequests } from "../utils/APIRoutes"

export default function FriendRequestBadge() {
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    const fetchRequestCount = async () => {
      try {
        const storedUser = localStorage.getItem("chat-app-current-user")
        if (!storedUser) return
        const currentUser = await JSON.parse(storedUser)

        if (!currentUser) return

        const response = await axios.get(`${getFriendRequests}/${currentUser._id}`)

        if (response.data.status) {
          setRequestCount(response.data.requests.length)
        }
      } catch (err) {
        console.error("Error fetching request count:", err)
      }
    }

    fetchRequestCount()

    // Set up interval to check for new requests every minute
    const interval = setInterval(fetchRequestCount, 60000)

    return () => clearInterval(interval)
  }, [])

  if (requestCount === 0) return null

  return <Badge>{requestCount}</Badge>
}

const Badge = styled.div`
  background-color: #ff3e3e;
  color: white;
  border-radius: 50%;
  min-width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  position: absolute;
  top: -5px;
  right: -5px;
`
