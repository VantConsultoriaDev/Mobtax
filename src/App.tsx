import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { DatabaseProvider } from './contexts/DatabaseContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Financeiro from './pages/Financeiro'
import Cargas from './pages/Cargas'
import Parceiros from './pages/Parceiros'
import Usuarios from './pages/Usuarios'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <ThemeProvider>
      <DatabaseProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/inicio" replace />} />
                <Route path="inicio" element={<Dashboard />} />
                <Route path="financeiro" element={<Financeiro />} />
                <Route path="cargas" element={<Cargas />} />
                <Route path="parceiros" element={<Parceiros />} />
                <Route path="usuarios" element={<Usuarios />} />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </DatabaseProvider>
    </ThemeProvider>
  )
}

export default App