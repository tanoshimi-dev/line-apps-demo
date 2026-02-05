import type { UserProfile } from '../types'
import './Header.css'

interface HeaderProps {
  profile: UserProfile | null
}

function Header({ profile }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="header-title">Members Card</h1>
        {profile && (
          <div className="header-user">
            {profile.pictureUrl ? (
              <img
                src={profile.pictureUrl}
                alt={profile.displayName}
                className="header-avatar"
              />
            ) : (
              <div className="header-avatar-placeholder">
                {profile.displayName.charAt(0)}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
