import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Member pages
import Home from './pages/Home';
import Services from './pages/Services';
import Reserve from './pages/Reserve';
import Reservations from './pages/Reservations';
import ReservationDetail from './pages/ReservationDetail';
import Messages from './pages/Messages';
import Profile from './pages/Profile';

// Admin pages
import AdminLogin from './admin/pages/AdminLogin';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminReservations from './admin/pages/AdminReservations';
import AdminReservationDetail from './admin/pages/AdminReservationDetail';
import AdminServices from './admin/pages/AdminServices';
import AdminStaff from './admin/pages/AdminStaff';
import AdminStaffDetail from './admin/pages/AdminStaffDetail';
import AdminMembers from './admin/pages/AdminMembers';
import AdminMemberDetail from './admin/pages/AdminMemberDetail';
import AdminSettings from './admin/pages/AdminSettings';

// Admin components
import { AdminAuthProvider } from './admin/contexts/AdminAuthContext';
import AdminGuard from './admin/components/AdminGuard';
import AdminLayout from './admin/layouts/AdminLayout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Member routes */}
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/reserve" element={<Reserve />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/reservations/:id" element={<ReservationDetail />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile" element={<Profile />} />

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <AdminAuthProvider>
              <Routes>
                <Route path="/login" element={<AdminLogin />} />
                <Route
                  path="/*"
                  element={
                    <AdminGuard>
                      <AdminLayout>
                        <Routes>
                          <Route path="/" element={<AdminDashboard />} />
                          <Route path="/reservations" element={<AdminReservations />} />
                          <Route path="/reservations/:id" element={<AdminReservationDetail />} />
                          <Route path="/services" element={<AdminServices />} />
                          <Route path="/staff" element={<AdminStaff />} />
                          <Route path="/staff/:id" element={<AdminStaffDetail />} />
                          <Route path="/members" element={<AdminMembers />} />
                          <Route path="/members/:id" element={<AdminMemberDetail />} />
                          <Route path="/settings" element={<AdminSettings />} />
                        </Routes>
                      </AdminLayout>
                    </AdminGuard>
                  }
                />
              </Routes>
            </AdminAuthProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
