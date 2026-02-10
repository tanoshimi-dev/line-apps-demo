import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  user?: { displayName: string; pictureUrl?: string } | null;
}

export default function Header({ title = 'Salon Reservation', user }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="header">
      <div className="header-content">
        {!isHome && (
          <button className="header-back" onClick={() => navigate(-1)}>
            ←
          </button>
        )}
        <h1 className="header-title">{title}</h1>
        {user?.pictureUrl && (
          <img
            className="header-avatar"
            src={user.pictureUrl}
            alt={user.displayName}
          />
        )}
      </div>
    </header>
  );
}
