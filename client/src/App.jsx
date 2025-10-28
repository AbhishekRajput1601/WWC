import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Layout/Navbar'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import MeetingRoom from './pages/MeetingRoom'
import Login from './components/Auth/Login'
import Signup from './components/Auth/Signup'
import UserProfile from './components/UserProfile'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/meeting/:meetingId" element={<MeetingRoom />} />
              <Route path="/profile" element={<UserProfile />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App