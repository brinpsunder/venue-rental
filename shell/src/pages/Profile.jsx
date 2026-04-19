import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/auth';
import styles from './Page.module.css';

export default function Profile() {
  const { token } = useAuth();
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/users/me', { token })
      .then(setMe)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Profile</h1>
        <p className={styles.pageSubtitle}>GET /users/me via web-bff</p>
      </div>

      <div className={styles.card}>
        {loading && <p>Loading…</p>}
        {error && <p className={styles.error}>{error}</p>}
        {me && (
          <dl className={styles.defList}>
            <dt>ID</dt>
            <dd>{me.id}</dd>
            <dt>Email</dt>
            <dd>{me.email}</dd>
            <dt>Role</dt>
            <dd>{me.role}</dd>
            {me.createdAt && (
              <>
                <dt>Created</dt>
                <dd>{new Date(me.createdAt).toLocaleString()}</dd>
              </>
            )}
          </dl>
        )}
      </div>
    </div>
  );
}
