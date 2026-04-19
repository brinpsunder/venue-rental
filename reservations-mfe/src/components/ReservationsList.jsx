import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api';
import { useCtx } from '../ctx';
import styles from '../styles.module.css';

const STATUS_STYLE = {
  PENDING: styles.statusPending,
  CONFIRMED: styles.statusConfirmed,
  CANCELLED: styles.statusCancelled,
};

function fmtDate(v) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString();
}

export default function ReservationsList() {
  const { token, user } = useCtx();
  const isOwner = user?.role === 'OWNER';

  const [reservations, setReservations] = useState([]);
  const [venueFilter, setVenueFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const qs = venueFilter ? `?venueId=${encodeURIComponent(venueFilter)}` : '';
      const data = await apiFetch(`/reservations${qs}`, { token });
      setReservations(Array.isArray(data) ? data : []);
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

  async function act(id, action) {
    setActingId(id);
    setError('');
    try {
      await apiFetch(`/reservations/${id}/${action}`, { method: 'PATCH', token });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActingId(null);
    }
  }

  return (
    <div>
      <span className={styles.mfeTag}>reservations-mfe · remote</span>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Reservations</div>
          <div className={styles.subtitle}>
            GET /reservations · {isOwner ? 'owners see bookings for their venues' : 'renters see their own bookings'}
          </div>
        </div>
        <Link to="new" className={styles.primaryBtn} style={{ textDecoration: 'none' }}>
          + New reservation
        </Link>
      </div>

      <form
        className={styles.toolbar}
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <input
          type="number"
          min="1"
          placeholder="Filter by venue id"
          value={venueFilter}
          onChange={(e) => setVenueFilter(e.target.value)}
        />
        <button type="submit" className={styles.primaryBtn}>
          Apply
        </button>
        {venueFilter && (
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => {
              setVenueFilter('');
              setTimeout(load, 0);
            }}
          >
            Clear
          </button>
        )}
      </form>

      {error && <div className={styles.error}>{error}</div>}
      {loading && <div className={styles.empty}>Loading reservations…</div>}
      {!loading && reservations.length === 0 && (
        <div className={styles.empty}>No reservations yet.</div>
      )}

      <div className={styles.list}>
        {reservations.map((r) => {
          const canCancel = r.status !== 'CANCELLED';
          const canConfirm = isOwner && r.status === 'PENDING';
          const busy = actingId === r.id;
          return (
            <div key={r.id} className={styles.row}>
              <div className={styles.rowId}>#{r.id}</div>
              <div className={styles.rowMain}>
                <div className={styles.rowTitle}>
                  <Link to={`/venues/${r.venue_id}`}>Venue #{r.venue_id}</Link>
                </div>
                <div className={styles.rowMeta}>
                  <span>📅 {fmtDate(r.start_date)} → {fmtDate(r.end_date)}</span>
                  <span>Renter #{r.renter_id}</span>
                  <span className={`${styles.statusBadge} ${STATUS_STYLE[r.status] ?? ''}`}>
                    {r.status}
                  </span>
                </div>
              </div>
              <div className={styles.rowActions}>
                {canConfirm && (
                  <button
                    className={styles.primaryBtn}
                    onClick={() => act(r.id, 'confirm')}
                    disabled={busy}
                  >
                    {busy ? '…' : 'Confirm'}
                  </button>
                )}
                {canCancel && (
                  <button
                    className={styles.dangerBtn}
                    onClick={() => act(r.id, 'cancel')}
                    disabled={busy}
                  >
                    {busy ? '…' : 'Cancel'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
