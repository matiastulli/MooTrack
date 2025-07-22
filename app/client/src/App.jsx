"use client"

import { useEffect, useState } from "react"
import { Route, BrowserRouter as Router, Routes } from "react-router-dom"
import MainApp from "./components/MainApp"

export default function App() {
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication status on app load
  useEffect(() => {
    setIsLoading(false)
  }, [])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4 safe-area-inset-bottom">
        <div className="text-center w-full max-w-sm mx-auto">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-full mb-4">
            <svg className="animate-spin h-7 w-7 sm:h-8 sm:w-8 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">Loading MooTrack...</p>
        </div>
      </div>
    )
  }

  // Route between different app sections
  return (
    <Router>
      <div className="flex min-h-screen flex-col antialiased">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<MainApp />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}