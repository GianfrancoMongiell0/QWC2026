import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage     from './pages/LandingPage'
import DashboardPage   from './pages/DashboardPage'
import LeaguePage      from './pages/LeaguePage'
import AdminPage       from './pages/AdminPage'
import PWAInstallBanner from './components/ui/PWAInstallBanner'

function Loading() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0A0A0F' }}>
      <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid #1E1E2E', borderTopColor:'#00FF87', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  return user ? children : <Navigate to="/" replace />
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <Loading />
  if (!user)    return <Navigate to="/" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"              element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/dashboard"     element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/liga/:leagueId" element={<ProtectedRoute><LeaguePage /></ProtectedRoute>} />
          <Route path="/admin"         element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>

        {/* Banner de instalación PWA — disponible en toda la app */}
        <PWAInstallBanner />
      </BrowserRouter>
    </AuthProvider>
  )
}
