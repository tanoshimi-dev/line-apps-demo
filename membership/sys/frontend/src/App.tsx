import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import MembersCard from './pages/MembersCard'
import PointHistory from './pages/PointHistory'
import Profile from './pages/Profile'
import QRScanner from './pages/QRScanner'
import { AdminAuthProvider } from './admin/contexts/AdminAuthContext'
import AdminGuard from './admin/components/AdminGuard'
import AdminLayout from './admin/layouts/AdminLayout'
import AdminLogin from './admin/pages/AdminLogin'
import AdminDashboard from './admin/pages/AdminDashboard'
import AdminMembers from './admin/pages/AdminMembers'
import AdminMemberDetail from './admin/pages/AdminMemberDetail'
import AdminTransactions from './admin/pages/AdminTransactions'
import AdminQrSpend from './admin/pages/AdminQrSpend'
import AdminQrEarn from './admin/pages/AdminQrEarn'
import AdminSettings from './admin/pages/AdminSettings'
import './admin/styles/admin.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Member-facing routes */}
        <Route path="/" element={<Home />} />
        <Route path="/card" element={<MembersCard />} />
        <Route path="/points" element={<PointHistory />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/scan" element={<QRScanner />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={
          <AdminAuthProvider>
            <AdminLogin />
          </AdminAuthProvider>
        } />
        <Route path="/admin" element={
          <AdminAuthProvider>
            <AdminGuard />
          </AdminAuthProvider>
        }>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="members" element={<AdminMembers />} />
            <Route path="members/:id" element={<AdminMemberDetail />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="qr/spend" element={<AdminQrSpend />} />
            <Route path="qr/earn" element={<AdminQrEarn />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
