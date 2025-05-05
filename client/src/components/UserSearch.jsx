"use client"
import styled from "styled-components"
import { useTheme } from "../context/ThemeContext"
import { BsSun, BsMoon } from "react-icons/bs"

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return <ToggleButton onClick={toggleTheme}>{theme === "dark" ? <BsSun /> : <BsMoon />}</ToggleButton>
}

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: var(--text-color);
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: var(--input-bg);
  }
  
  svg {
    font-size: 1.3rem;
  }
`
