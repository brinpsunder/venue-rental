import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api';
import { useCtx } from '../ctx';
import styles from '../styles.module.css';

export default function VenuesList() {
  const { user } = useCtx();
  const isOwner = user?.role === 'OWNER';

  const [venues, setVenues] = useState([]);
  const [location, setLocation] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (location) query.set('location', location);
      if (minCapacity) query.set('minCapacity', minCapacity);
      const qs = query.toString();
      const data = await apiFetch(`/venues${qs ? `?${qs}` : ''}`);
      setVenues(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    load();
  }

  return (
    <div>
      <span className={styles.mfeTag}>venues-mfe · remote</span>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Venues</div>
          <div className={styles.subtitle}>
            GET /venues · filter by location and minimum capacity
          </div>
        </div>
        {isOwner && (
          <Link to="new" className={styles.primaryBtn}>
            + New venue
          </Link>
        )}
      </div>

      <form className={styles.toolbar} onSubmit={handleSubmit}>
        <input
          placeholder="Location (e.g. Ljubljana)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <input
          type="number"
          min="1"
          placeholder="Min capacity"
          value={minCapacity}
          onChange={(e) => setMinCapacity(e.target.value)}
          style={{ width: 140 }}
        />
        <button type="submit" className={styles.primaryBtn}>
          Search
        </button>
      </form>

      {error && <div className={styles.error}>{error}</div>}
      {loading && <div className={styles.empty}>Loading venues…</div>}
      {!loading && venues.length === 0 && (
        <div className={styles.empty}>No venues match your filters.</div>
      )}

      <div className={styles.grid}>
        {venues.map((v) => (
          <Link to={String(v.id)} key={v.id} className={styles.card}>
            <div className={styles.cardTitle}>{v.name}</div>
            <div className={styles.cardLine}>📍 {v.location}</div>
            <div className={styles.cardLine}>👥 Up to {v.capacity} guests</div>
            <div className={styles.price}>€{Number(v.pricePerDay).toFixed(2)} / day</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
