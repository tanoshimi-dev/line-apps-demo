import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import MembersCard from './pages/MembersCard'
import PointHistory from './pages/PointHistory'
import Profile from './pages/Profile'
import QRScanner from './pages/QRScanner'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/card" element={<MembersCard />} />
        <Route path="/points" element={<PointHistory />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/scan" element={<QRScanner />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
