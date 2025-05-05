"use client"
import styled from "styled-components"
import { BsFillTelephoneFill, BsFillTelephoneXFill, BsFillCameraVideoFill } from "react-icons/bs"
import { useTheme } from "../context/ThemeContext"

export default function IncomingCallModal({ caller, callType, onAccept, onReject }) {
  const { theme } = useTheme()

  return (
    <ModalOverlay theme={theme}>
      <ModalContainer>
        <div className="call-info">
          <div className="call-type-icon">
            {callType === "video" ? <BsFillCameraVideoFill /> : <BsFillTelephoneFill />}
          </div>
          <h2>Incoming {callType === "video" ? "Video" : "Voice"} Call</h2>
          <p className="caller-name">{caller}</p>
        </div>

        <div className="call-actions">
          <button className="reject-btn" onClick={onReject}>
            <BsFillTelephoneXFill />
            <span>Decline</span>
          </button>
          <button className="accept-btn" onClick={onAccept}>
            <BsFillTelephoneFill />
            <span>Accept</span>
          </button>
        </div>
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
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const ModalContainer = styled.div`
  background-color: var(--container-bg);
  border-radius: 1rem;
  width: 90%;
  max-width: 400px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  
  .call-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 2rem;
    
    .call-type-icon {
      font-size: 3rem;
      color: var(--accent-light);
      margin-bottom: 1rem;
      animation: pulse 1.5s infinite;
      
      @keyframes pulse {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.8;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
    }
    
    h2 {
      color: var(--text-color);
      margin-bottom: 0.5rem;
      text-align: center;
    }
    
    .caller-name {
      color: var(--text-secondary);
      font-size: 1.2rem;
      font-weight: bold;
    }
  }
  
  .call-actions {
    display: flex;
    gap: 2rem;
    
    button {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      padding: 1rem;
      border-radius: 0.5rem;
      transition: all 0.3s ease;
      
      svg {
        font-size: 2rem;
      }
      
      span {
        font-size: 1rem;
      }
      
      &.reject-btn {
        color: var(--error-color);
        
        &:hover {
          background-color: rgba(244, 67, 54, 0.1);
        }
      }
      
      &.accept-btn {
        color: var(--success-color);
        
        &:hover {
          background-color: rgba(76, 175, 80, 0.1);
        }
      }
    }
  }
`
