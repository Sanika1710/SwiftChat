"use client"

import { createContext, useState, useEffect, useContext } from "react"

// Create the theme context
const ThemeContext = createContext()

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Check if user has a theme preference stored
  const storedTheme = localStorage.getItem("chat-app-theme")
  const [theme, setTheme] = useState(storedTheme || "dark")

  // Update theme in localStorage when it changes
  useEffect(() => {
    localStorage.setItem("chat-app-theme", theme)
    // Apply theme class to body
    document.body.className = theme === "dark" ? "dark-theme" : "light-theme"
  }, [theme])

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
