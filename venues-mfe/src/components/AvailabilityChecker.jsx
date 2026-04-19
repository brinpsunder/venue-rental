import { useState } from 'react';
import { apiFetch } from '../api';
import styles from '../styles.module.css';

function today() {
  return new Date().toISOString().slice(0, 10);
}
function plusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function AvailabilityChecker({ venueId }) {
  const [startDate, setStart] = useState(today());
  const [endDate, setEnd] = useState(plusDays(1));
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  async function check(e) {
    e.preventDefault();
    setChecking(true);
    setError('');
    setResult(null);
    try {
      const data = await apiFetch(
        `/venues/${venueId}/availability?startDate=${startDate}&endDate=${endDate}`
      );
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  }

  return (
    <form onSubmit={check}>
      <div className={styles.availabilityRow}>
        <div className={styles.formField}>
          <label className={styles.label}>Start date</label>
          <input
            className={styles.input}
            type="date"
            value={startDate}
            onChange={(e) => setStart(e.target.value)}
            required
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.label}>End date</label>
          <input
            className={styles.input}
            type="date"
            value={endDate}
            onChange={(e) => setEnd(e.target.value)}
            required
          />
        </div>
        <button className={styles.primaryBtn} type="submit" disabled={checking}>
          {checking ? 'Checking…' : 'Check'}
        </button>
      </div>

      {error && <div className={styles.error} style={{ marginTop: 12 }}>{error}</div>}
      {result && (
        <div
          className={`${styles.availabilityResult} ${
            result.available ? styles.availabilityOk : styles.availabilityNo
          }`}
        >
          {result.available
            ? `✅ Available ${result.startDate} → ${result.endDate}`
            : `❌ Not available ${result.startDate} → ${result.endDate}`}
        </div>
      )}
    </form>
  );
}
