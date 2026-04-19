import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { useCtx } from '../ctx';
import styles from '../styles.module.css';

function today() {
  return new Date().toISOString().slice(0, 10);
}
function plusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function CreateReservation() {
  const { token, user } = useCtx();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [form, setForm] = useState({
    venueId: params.get('venueId') ?? '',
    startDate: today(),
    endDate: plusDays(1),
  });
  const [venuePreview, setVenuePreview] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const presetVenue = params.get('venueId');

  useEffect(() => {
    if (!presetVenue) return;
    apiFetch(`/venues/${presetVenue}`)
      .then(setVenuePreview)
      .catch(() => setVenuePreview(null));
  }, [presetVenue]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        venueId: Number(form.venueId),
        startDate: form.startDate,
        endDate: form.endDate,
      };
      await apiFetch('/reservations', { method: 'POST', body: payload, token });
      navigate('/reservations');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className={styles.linkRow}>
        <Link to="/reservations" className={styles.secondaryBtn}>
          ← Cancel
        </Link>
        <span className={styles.mfeTag}>reservations-mfe · POST /reservations</span>
      </div>

      {user?.role === 'OWNER' && (
        <div className={styles.notice} style={{ marginBottom: 14 }}>
          Note: the backend only permits renters (role <strong>RENTER</strong>) to create
          reservations. Owner accounts will get a 403.
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          {venuePreview ? `Book ${venuePreview.name}` : 'New reservation'}
        </div>

        {venuePreview && (
          <div className={styles.notice} style={{ marginBottom: 14 }}>
            📍 {venuePreview.location} · €{Number(venuePreview.pricePerDay).toFixed(2)} / day
          </div>
        )}

        <form onSubmit={submit}>
          <div className={styles.form}>
            <div className={`${styles.formField} ${styles.formFieldFull}`}>
              <label className={styles.label}>Venue ID</label>
              <input
                className={styles.input}
                type="number"
                min="1"
                value={form.venueId}
                onChange={update('venueId')}
                required
                readOnly={Boolean(presetVenue)}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Start date</label>
              <input
                className={styles.input}
                type="date"
                value={form.startDate}
                onChange={update('startDate')}
                required
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>End date</label>
              <input
                className={styles.input}
                type="date"
                value={form.endDate}
                onChange={update('endDate')}
                required
              />
            </div>
          </div>

          {error && <div className={styles.error} style={{ marginTop: 14 }}>{error}</div>}

          <div style={{ marginTop: 18 }}>
            <button type="submit" className={styles.primaryBtn} disabled={saving}>
              {saving ? 'Creating…' : 'Create reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
