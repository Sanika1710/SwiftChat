"use client"

import { useEffect, useState, useRef } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { io } from "socket.io-client"
import styled from "styled-components"
import { getFriends, getGroupsRoute, host } from "../utils/APIRoutes"
import ChatContainer from "../components/ChatContainer"
import Contacts from "../components/Contacts"
import Welcome from "../components/Welcome"
import GroupChatContainer from "../components/GroupChatContainer"
import { useTheme } from "../context/ThemeContext"
import IncomingCallModal from "../components/IncomingCallModal"

export default function Chat() {
  const navigate = useNavigate()
  const socket = useRef()
  const [contacts, setContacts] = useState([])
  const [groups, setGroups] = useState([])
  const [currentChat, setCurrentChat] = useState(undefined)
  const [currentGroup, setCurrentGroup] = useState(undefined)
  const [currentUser, setCurrentUser] = useState(undefined)
  const [isLoaded, setIsLoaded] = useState(false)
  const [incomingCall, setIncomingCall] = useState(null)
  const { theme } = useTheme()

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
        navigate("/login")
      } else {
        setCurrentUser(await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)))
        setIsLoaded(true)
      }
    }

    fetchCurrentUser()
  }, [navigate])

  useEffect(() => {
    if (currentUser) {
      socket.current = io(host)
      socket.current.emit("add-user", currentUser._id)

      // Set up socket listeners for calls
      socket.current.on("call-incoming", (data) => {
        setIncomingCall({
          from: data.from,
          name: data.name,
          callType: data.callType,
          roomId: data.roomId,
        })
      })

      // Clean up on unmount
      return () => {
        if (socket.current) {
          socket.current.off("call-incoming")
        }
      }
    }
  }, [currentUser])

  useEffect(() => {
    const fetchContacts = async () => {
      if (currentUser && isLoaded) {
        if (currentUser.isAvatarImageSet) {
          try {
            // Fetch friends
            const friendsResponse = await axios.get(`${getFriends}/${currentUser._id}`)

            // Update online status for each contact
            socket.current.on("user-status", ({ userId, status }) => {
              setContacts((prev) => prev.map((contact) => (contact._id === userId ? { ...contact, status } : contact)))
            })

            // Set initial contacts with offline status
            setContacts(
              friendsResponse.data.map((friend) => ({
                ...friend,
                status: "offline",
              })),
            )

            // Fetch groups
            const groupsResponse = await axios.get(`${getGroupsRoute}/${currentUser._id}`)
            setGroups(groupsResponse.data)
          } catch (error) {
            console.error("Error fetching data:", error)
          }
        } else {
          navigate("/setAvatar")
        }
      }
    }

    fetchContacts()

    // Clean up
    return () => {
      if (socket.current) {
        socket.current.off("user-status")
      }
    }
  }, [currentUser, isLoaded, navigate])

  // Function to refresh contacts and groups
  const refreshData = async () => {
    if (currentUser) {
      try {
        // Refresh friends
        const friendsResponse = await axios.get(`${getFriends}/${currentUser._id}`)
        setContacts(
          friendsResponse.data.map((friend) => {
            // Preserve online status if the contact already exists
            const existingContact = contacts.find((c) => c._id === friend._id)
            return {
              ...friend,
              status: existingContact ? existingContact.status : "offline",
            }
          }),
        )

        // Refresh groups
        const groupsResponse = await axios.get(`${getGroupsRoute}/${currentUser._id}`)
        setGroups(groupsResponse.data)
      } catch (error) {
        console.error("Error refreshing data:", error)
      }
    }
  }

  const handleChatChange = (chat) => {
    setCurrentChat(chat)
    setCurrentGroup(undefined)
  }

  const handleGroupChange = (group) => {
    setCurrentGroup(group)
    setCurrentChat(undefined)
  }

  const handleAcceptCall = () => {
    if (incomingCall) {
      // Navigate to call page
      navigate(
        `/call/${incomingCall.roomId}?type=${incomingCall.callType}&user=${incomingCall.from}&name=${incomingCall.name}`,
      )

      // Send acceptance via socket
      socket.current.emit("call-response", {
        to: incomingCall.from,
        from: currentUser._id,
        accepted: true,
      })

      // Clear incoming call
      setIncomingCall(null)
    }
  }

  const handleRejectCall = () => {
    if (incomingCall) {
      // Send rejection via socket
      socket.current.emit("call-response", {
        to: incomingCall.from,
        from: currentUser._id,
        accepted: false,
      })

      // Clear incoming call
      setIncomingCall(null)
    }
  }

  return (
    <>
      <Container theme={theme}>
        <div className="container">
          <Contacts
            contacts={contacts}
            groups={groups}
            changeChat={handleChatChange}
            changeGroup={handleGroupChange}
            refreshContacts={refreshData}
            currentChat={currentChat}
            currentGroup={currentGroup}
          />
          {!currentChat && !currentGroup ? (
            <Welcome />
          ) : currentChat ? (
            <ChatContainer currentChat={currentChat} socket={socket} />
          ) : (
            <GroupChatContainer
              currentGroup={currentGroup}
              socket={socket}
              currentUser={currentUser}
              onGroupUpdate={refreshData}
            />
          )}
        </div>

        {incomingCall && (
          <IncomingCallModal
            caller={incomingCall.name}
            callType={incomingCall.callType}
            onAccept={handleAcceptCall}
            onReject={handleRejectCall}
          />
        )}
      </Container>
    </>
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
  
  .container {
    height: 85vh;
    width: 85vw;
    background-color: var(--container-bg);
    display: grid;
    grid-template-columns: 25% 75%;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    border-radius: 1rem;
    overflow: hidden;
    
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }
    
    @media screen and (max-width: 720px) {
      grid-template-columns: 100%;
      width: 100vw;
      height: 100vh;
      border-radius: 0;
    }
  }
`
