import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', password: '', password_confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => { setForm((p) => ({ ...p, [k]: e.target.value })); setErrors((p) => ({ ...p, [k]: undefined, general: undefined })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await register(form);
      await login({ email: form.email, password: form.password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      setErrors(typeof data === 'object' ? data : { general: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (k) => errors[k] && (
    <span className="form-error">{Array.isArray(errors[k]) ? errors[k].join(' ') : errors[k]}</span>
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-mark">⚡</div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join your team on TaskFlow</p>

        {errors.general && <div className="alert alert-error" style={{ marginBottom: 16 }}>{errors.general}</div>}

        <form className="auth-form" onSubmit={handleSubmit} id="signup-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="signup-first">First name</label>
              <input id="signup-first" type="text" name="first_name" placeholder="John" value={form.first_name} onChange={set('first_name')} required />
              {fieldError('first_name')}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="signup-last">Last name</label>
              <input id="signup-last" type="text" name="last_name" placeholder="Doe" value={form.last_name} onChange={set('last_name')} required />
              {fieldError('last_name')}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email</label>
            <input id="signup-email" type="email" name="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required autoComplete="email" />
            {fieldError('email')}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password</label>
            <input id="signup-password" type="password" name="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} required autoComplete="new-password" />
            {fieldError('password')}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-confirm">Confirm password</label>
            <input id="signup-confirm" type="password" name="password_confirm" placeholder="Repeat password" value={form.password_confirm} onChange={set('password_confirm')} required autoComplete="new-password" />
            {fieldError('password_confirm')}
          </div>

          <button id="signup-submit" type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Creating account…</> : 'Create account'}
          </button>
        </form>

        <p className="auth-foot">
          Already have an account? <Link to="/login" id="goto-login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
