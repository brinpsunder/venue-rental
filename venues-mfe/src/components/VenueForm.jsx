import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { useCtx } from '../ctx';
import styles from '../styles.module.css';

const EMPTY = { name: '', description: '', location: '', capacity: 10, pricePerDay: 100 };

export default function VenueForm({ mode }) {
  const { id } = useParams();
  const { token, user } = useCtx();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode !== 'edit') return;
    setLoading(true);
    apiFetch(`/venues/${id}`)
      .then((v) => {
        setForm({
          name: v.name ?? '',
          description: v.description ?? '',
          location: v.location ?? '',
          capacity: Number(v.capacity ?? 0),
          pricePerDay: Number(v.pricePerDay ?? 0),
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, mode]);

  function update(field) {
    return (e) => {
      const v = e.target.value;
      setForm((f) => ({
        ...f,
        [field]: field === 'capacity' || field === 'pricePerDay' ? (v === '' ? '' : Number(v)) : v,
      }));
    };
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        location: form.location,
        capacity: Number(form.capacity),
        pricePerDay: Number(form.pricePerDay),
      };
      if (mode === 'create') {
        const created = await apiFetch('/venues', { method: 'POST', body: payload, token });
        navigate(`/venues/${created.id}`);
      } else {
        await apiFetch(`/venues/${id}`, { method: 'PUT', body: payload, token });
        navigate(`/venues/${id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (user?.role !== 'OWNER') {
    return <div className={styles.notice}>Only accounts with role <strong>OWNER</strong> can manage venues.</div>;
  }
  if (loading) return <div className={styles.empty}>Loading…</div>;

  return (
    <div>
      <div className={styles.linkRow}>
        <Link to={mode === 'edit' ? `/venues/${id}` : '/venues'} className={styles.secondaryBtn}>
          ← Cancel
        </Link>
        <span className={styles.mfeTag}>
          venues-mfe · {mode === 'create' ? 'POST /venues' : `PUT /venues/${id}`}
        </span>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          {mode === 'create' ? 'Add a new venue' : 'Edit venue'}
        </div>

        <form onSubmit={submit}>
          <div className={styles.form}>
            <div className={`${styles.formField} ${styles.formFieldFull}`}>
              <label className={styles.label}>Name</label>
              <input
                className={styles.input}
                value={form.name}
                onChange={update('name')}
                required
                minLength={2}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.label}>Location</label>
              <input
                className={styles.input}
                value={form.location}
                onChange={update('location')}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.label}>Capacity</label>
              <input
                className={styles.input}
                type="number"
                min="1"
                value={form.capacity}
                onChange={update('capacity')}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.label}>Price per day (€)</label>
              <input
                className={styles.input}
                type="number"
                step="0.01"
                min="0"
                value={form.pricePerDay}
                onChange={update('pricePerDay')}
                required
              />
            </div>

            <div className={`${styles.formField} ${styles.formFieldFull}`}>
              <label className={styles.label}>Description</label>
              <textarea
                className={styles.textarea}
                value={form.description}
                onChange={update('description')}
                placeholder="Optional — describe your venue"
              />
            </div>
          </div>

          {error && <div className={styles.error} style={{ marginTop: 14 }}>{error}</div>}

          <div className={styles.detailActions}>
            <button type="submit" className={styles.primaryBtn} disabled={saving}>
              {saving ? 'Saving…' : mode === 'create' ? 'Create venue' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
