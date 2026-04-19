import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth';
import styles from './Page.module.css';

export default function Home() {
  const { user } = useAuth();
  const isOwner = user?.role === 'OWNER';

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Welcome, {user?.email}</h1>
        <p className={styles.pageSubtitle}>
          This shell is a React host. The tiles below are rendered by separate micro-frontends,
          loaded at runtime via Module Federation.
        </p>
      </div>

      <div className={styles.grid}>
        <Link to="/venues" className={styles.tile}>
          <span className={styles.tileTag}>venues-mfe</span>
          <h2 className={styles.tileTitle}>Browse venues</h2>
          <p className={styles.tileText}>
            Search the catalogue, open venue details with a 7-day availability calendar.
          </p>
        </Link>

        {isOwner && (
          <Link to="/venues/new" className={styles.tile}>
            <span className={styles.tileTag}>venues-mfe</span>
            <h2 className={styles.tileTitle}>List a new venue</h2>
            <p className={styles.tileText}>Owner-only: create, edit and delete your venues.</p>
          </Link>
        )}

        <Link to="/reservations" className={styles.tile}>
          <span className={styles.tileTag}>reservations-mfe</span>
          <h2 className={styles.tileTitle}>My reservations</h2>
          <p className={styles.tileText}>
            See your bookings. {isOwner ? 'Confirm or cancel bookings for your venues.' : 'Cancel bookings you no longer need.'}
          </p>
        </Link>

        <Link to="/profile" className={styles.tile}>
          <span className={styles.tileTag}>shell</span>
          <h2 className={styles.tileTitle}>Profile</h2>
          <p className={styles.tileText}>View your account details via GET /users/me.</p>
        </Link>
      </div>
    </div>
  );
}
