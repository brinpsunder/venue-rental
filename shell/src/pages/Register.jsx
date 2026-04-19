import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../api';
import AuthCard from '../components/AuthCard';
import styles from './Auth.module.css';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', role: 'RENTER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/auth/register', { method: 'POST', body: form });
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Create account" subtitle="Join Venue Rental today">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <input
            className={styles.input}
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Password</label>
          <input
            className={styles.input}
            type="password"
            name="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>I am a</label>
          <div className={styles.roleToggle}>
            <button
              type="button"
              className={`${styles.roleOption} ${form.role === 'RENTER' ? styles.roleActive : ''}`}
              onClick={() => setForm({ ...form, role: 'RENTER' })}
            >
              Renter
            </button>
            <button
              type="button"
              className={`${styles.roleOption} ${form.role === 'OWNER' ? styles.roleActive : ''}`}
              onClick={() => setForm({ ...form, role: 'OWNER' })}
            >
              Owner
            </button>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </AuthCard>
  );
}
