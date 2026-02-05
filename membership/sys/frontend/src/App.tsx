import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import MembersCard from './pages/MembersCard'
import PointHistory from './pages/PointHistory'
import Profile from './pages/Profile'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/card" element={<MembersCard />} />
        <Route path="/points" element={<PointHistory />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
