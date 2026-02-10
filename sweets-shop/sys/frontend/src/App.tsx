import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn } from './services/liff';
import { AdminAuthProvider } from './admin/contexts/AdminAuthContext';
import AdminGuard from './admin/components/AdminGuard';
import AdminLayout from './admin/layouts/AdminLayout';

// Member pages
import Guest from './pages/Guest';
import Home from './pages/Home';
import Gallery from './pages/Gallery';
import ItemDetail from './pages/ItemDetail';
import ScanEarnPoints from './pages/ScanEarnPoints';
import ScanSpendPoints from './pages/ScanSpendPoints';
import ScanReviewTicket from './pages/ScanReviewTicket';
import PointHistory from './pages/PointHistory';
import WriteReview from './pages/WriteReview';
import Profile from './pages/Profile';

// Admin pages
import AdminLogin from './admin/pages/AdminLogin';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminCategories from './admin/pages/AdminCategories';
import AdminItems from './admin/pages/AdminItems';
import AdminStock from './admin/pages/AdminStock';
import AdminNews from './admin/pages/AdminNews';
import AdminMembers from './admin/pages/AdminMembers';
import AdminMemberDetail from './admin/pages/AdminMemberDetail';
import AdminPointTransactions from './admin/pages/AdminPointTransactions';
import AdminReviewTickets from './admin/pages/AdminReviewTickets';
import AdminReviews from './admin/pages/AdminReviews';
import AdminQrGenerate from './admin/pages/AdminQrGenerate';
import AdminSettings from './admin/pages/AdminSettings';

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
        {/* Member routes */}
        <Route path="/guest" element={<Guest />} />
        <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/items/:id" element={<ItemDetail />} />
        <Route path="/scan/earn" element={<AuthGuard><ScanEarnPoints /></AuthGuard>} />
        <Route path="/scan/spend" element={<AuthGuard><ScanSpendPoints /></AuthGuard>} />
        <Route path="/scan/review" element={<AuthGuard><ScanReviewTicket /></AuthGuard>} />
        <Route path="/points" element={<AuthGuard><PointHistory /></AuthGuard>} />
        <Route path="/review" element={<AuthGuard><WriteReview /></AuthGuard>} />
        <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />

        {/* Admin routes */}
        <Route path="/admin/*" element={
          <AdminAuthProvider>
            <Routes>
              <Route path="/login" element={<AdminLogin />} />
              <Route path="/" element={<AdminGuard><AdminLayout><AdminDashboard /></AdminLayout></AdminGuard>} />
              <Route path="/categories" element={<AdminGuard><AdminLayout><AdminCategories /></AdminLayout></AdminGuard>} />
              <Route path="/items" element={<AdminGuard><AdminLayout><AdminItems /></AdminLayout></AdminGuard>} />
              <Route path="/stock" element={<AdminGuard><AdminLayout><AdminStock /></AdminLayout></AdminGuard>} />
              <Route path="/news" element={<AdminGuard><AdminLayout><AdminNews /></AdminLayout></AdminGuard>} />
              <Route path="/members" element={<AdminGuard><AdminLayout><AdminMembers /></AdminLayout></AdminGuard>} />
              <Route path="/members/:id" element={<AdminGuard><AdminLayout><AdminMemberDetail /></AdminLayout></AdminGuard>} />
              <Route path="/point-transactions" element={<AdminGuard><AdminLayout><AdminPointTransactions /></AdminLayout></AdminGuard>} />
              <Route path="/review-tickets" element={<AdminGuard><AdminLayout><AdminReviewTickets /></AdminLayout></AdminGuard>} />
              <Route path="/reviews" element={<AdminGuard><AdminLayout><AdminReviews /></AdminLayout></AdminGuard>} />
              <Route path="/qr" element={<AdminGuard><AdminLayout><AdminQrGenerate /></AdminLayout></AdminGuard>} />
              <Route path="/settings" element={<AdminGuard><AdminLayout><AdminSettings /></AdminLayout></AdminGuard>} />
            </Routes>
          </AdminAuthProvider>
        } />
      </Routes>
    </BrowserRouter>
  );
}
