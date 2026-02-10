import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header-content" onClick={() => navigate('/')}>
        <span className="header-logo">Sweets Shop</span>
      </div>
    </header>
  );
}
