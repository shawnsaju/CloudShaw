import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (mode === 'register' && !form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Valid email required';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back! 👋');
      } else {
        await register(form.name, form.email, form.password);
        toast.success('Account created! 🎉');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setErrors({});
    setForm({ name: '', email: '', password: '' });
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', position: 'relative',
    }}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,108,248,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,157,248,0.08) 0%, transparent 70%)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>☁️</div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, background: 'linear-gradient(135deg, #7c6cf8, #a89df8, #c4b8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            CloudShaw
          </h1>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Your personal media vault & social content hub
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '2rem', boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(124,108,248,0.1)' }}>
          {/* Mode tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)', padding: 4, marginBottom: '1.75rem' }}>
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setErrors({}); setForm({ name: '', email: '', password: '' }); }}
                style={{
                  flex: 1, padding: '0.55rem', border: 'none', borderRadius: 6, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: mode === m ? 700 : 400,
                  background: mode === m ? 'linear-gradient(135deg, #7c6cf8, #9b8cf8)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                }}
              >
                {m === 'login' ? '🔑 Sign In' : '✨ Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Name field (register only) */}
            {mode === 'register' && (
              <div style={{ marginBottom: '1.1rem' }}>
                <label className="label">Full Name</label>
                <input
                  id="auth-name"
                  className="input"
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  style={errors.name ? { borderColor: 'var(--danger)' } : {}}
                  autoFocus
                />
                {errors.name && <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: 'var(--danger)' }}>{errors.name}</p>}
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: '1.1rem' }}>
              <label className="label">Email</label>
              <input
                id="auth-email"
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                style={errors.email ? { borderColor: 'var(--danger)' } : {}}
                autoFocus={mode === 'login'}
              />
              {errors.email && <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: 'var(--danger)' }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label">Password</label>
              <input
                id="auth-password"
                className="input"
                type="password"
                placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                style={errors.password ? { borderColor: 'var(--danger)' } : {}}
              />
              {errors.password && <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: 'var(--danger)' }}>{errors.password}</p>}
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', fontSize: '0.95rem' }}
            >
              {loading ? '⏳ Please wait…' : mode === 'login' ? '🚀 Sign In' : '🎉 Create Account'}
            </button>
          </form>

          {/* Switch mode */}
          <p style={{ margin: '1.25rem 0 0', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={switchMode}
              style={{ background: 'none', border: 'none', color: 'var(--accent-light)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', padding: 0, fontFamily: 'inherit' }}
            >
              {mode === 'login' ? 'Create one →' : 'Sign in →'}
            </button>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Organize Instagram, YouTube, TikTok & more — all in one place.
        </p>
      </div>
    </div>
  );
}
