import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined, general: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await register(form);
      // Auto-login after registration
      await login({ email: form.email, password: form.password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        setErrors(data);
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">⚡</div>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join TaskFlow and start managing your team</p>

        {errors.general && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
            ⚠️ {errors.general}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} id="signup-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="signup-first-name">First Name</label>
              <input
                id="signup-first-name"
                type="text"
                name="first_name"
                placeholder="John"
                value={form.first_name}
                onChange={handleChange}
                required
              />
              {errors.first_name && <span className="form-error">{errors.first_name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-last-name">Last Name</label>
              <input
                id="signup-last-name"
                type="text"
                name="last_name"
                placeholder="Doe"
                value={form.last_name}
                onChange={handleChange}
                required
              />
              {errors.last_name && <span className="form-error">{errors.last_name}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email address</label>
            <input
              id="signup-email"
              type="email"
              name="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              name="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            {errors.password && (
              <span className="form-error">
                {Array.isArray(errors.password) ? errors.password.join(' ') : errors.password}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-confirm">Confirm Password</label>
            <input
              id="signup-confirm"
              type="password"
              name="password_confirm"
              placeholder="Repeat password"
              value={form.password_confirm}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            {errors.password_confirm && <span className="form-error">{errors.password_confirm}</span>}
          </div>

          <button
            id="signup-submit"
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating account...</>
              : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <p style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" id="goto-login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
