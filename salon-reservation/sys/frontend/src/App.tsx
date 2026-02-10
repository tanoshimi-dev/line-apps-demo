import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn } from './services/liff';

// Member pages
import Guest from './pages/Guest';
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

function AuthGuard({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) {
    return <Navigate to="/guest" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Guest page */}
        <Route path="/guest" element={isLoggedIn() ? <Navigate to="/" replace /> : <Guest />} />

        {/* Member routes (auth required) */}
        <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />
        <Route path="/services" element={<Services />} />
        <Route path="/reserve" element={<AuthGuard><Reserve /></AuthGuard>} />
        <Route path="/reservations" element={<AuthGuard><Reservations /></AuthGuard>} />
        <Route path="/reservations/:id" element={<AuthGuard><ReservationDetail /></AuthGuard>} />
        <Route path="/messages" element={<AuthGuard><Messages /></AuthGuard>} />
        <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />

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
