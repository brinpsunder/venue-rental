import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import styles from './Layout.module.css';

export default function Layout() {
  const { user, clearSession } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    clearSession();
    navigate('/login');
  }

  const navLinkClass = ({ isActive }) =>
    isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>🏛</span>
          <span className={styles.brandText}>Venue Rental</span>
          <span className={styles.shellTag}>shell</span>
        </div>
        <nav className={styles.nav}>
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/venues" className={navLinkClass}>
            Venues
            <span className={styles.mfeTag}>mfe</span>
          </NavLink>
          <NavLink to="/reservations" className={navLinkClass}>
            Reservations
            <span className={styles.mfeTag}>mfe</span>
          </NavLink>
          <NavLink to="/profile" className={navLinkClass}>
            Profile
          </NavLink>
        </nav>
        <div className={styles.userBox}>
          <span className={styles.userEmail}>{user?.email}</span>
          <span className={styles.roleBadge}>
            {user?.role === 'OWNER' ? '🏠 Owner' : '🔍 Renter'}
          </span>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
