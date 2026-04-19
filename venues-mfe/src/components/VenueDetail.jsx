import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { useCtx } from '../ctx';
import AvailabilityChecker from './AvailabilityChecker';
import styles from '../styles.module.css';

export default function VenueDetail() {
  const { id } = useParams();
  const { token, user } = useCtx();
  const navigate = useNavigate();

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/venues/${id}/details`)
      .then(setVenue)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!window.confirm('Delete this venue? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await apiFetch(`/venues/${id}`, { method: 'DELETE', token });
      navigate('..');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (loading) return <div className={styles.empty}>Loading venue…</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!venue) return <div className={styles.empty}>Venue not found.</div>;

  const isOwner = user?.role === 'OWNER' && user?.id === venue.ownerId;

  return (
    <div>
      <div className={styles.linkRow}>
        <Link to=".." className={styles.secondaryBtn}>
          ← Back to list
        </Link>
        <span className={styles.mfeTag}>venues-mfe · remote</span>
      </div>

      <div className={styles.detailHeader}>
        <div className={styles.detailTitle}>{venue.name}</div>
        <div className={styles.detailMeta}>
          <span>📍 {venue.location}</span>
          <span>👥 Up to {venue.capacity} guests</span>
          <span>ID #{venue.id}</span>
        </div>
        <div className={styles.detailPrice}>€{Number(venue.pricePerDay).toFixed(2)} / day</div>
        {venue.description && <p className={styles.detailDescription}>{venue.description}</p>}

        <div className={styles.detailActions}>
          <Link
            to={`/reservations/new?venueId=${venue.id}`}
            className={styles.primaryBtn}
            style={{ textDecoration: 'none' }}
          >
            Book this venue
          </Link>
          {isOwner && (
            <>
              <Link to="edit" className={styles.secondaryBtn}>
                Edit
              </Link>
              <button className={styles.dangerBtn} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Owner</div>
        <div className={styles.ownerChip}>
          🧑 {venue.owner?.email ?? `User #${venue.ownerId}`}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Next 7 days · GET /venues/:id/details</div>
        <div className={styles.calendar}>
          {(venue.availability ?? []).map((slot) => {
            const d = new Date(slot.date);
            const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
            const month = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
            return (
              <div
                key={slot.date}
                className={`${styles.calendarCell} ${
                  slot.available ? styles.calendarAvailable : styles.calendarBusy
                }`}
              >
                <div className={styles.dayLabel}>{weekday}</div>
                <div className={styles.daySub}>{month}</div>
                <div className={styles.daySub}>{slot.available ? 'Free' : 'Busy'}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Check custom availability · GET /venues/:id/availability</div>
        <AvailabilityChecker venueId={venue.id} />
      </div>
    </div>
  );
}
