import React, { useState } from 'react';
import {
  Activity,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Globe,
  Flame,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (registerMode) => {
    setIsRegister(registerMode);
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background:
          'radial-gradient(circle at top right, rgba(59, 130, 246, 0.16), transparent 45%), radial-gradient(circle at bottom left, rgba(139, 92, 246, 0.14), transparent 45%), var(--bg-primary)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(18px)',
          border: '1px solid var(--border-medium)',
          borderRadius: '20px',
          padding: '2.25rem',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.65)',
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div className="brand-icon">
            <Activity size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="brand-name" style={{ fontSize: '1.25rem' }}>CausalFunnel</span>
              <span className="brand-badge">Analytics</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Privacy-First Session & Heatmap Platform
            </div>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.35rem',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '0.3rem',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem',
          }}
        >
          <button
            type="button"
            onClick={() => switchMode(false)}
            style={{
              padding: '0.55rem',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              background: !isRegister ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: !isRegister ? '#fff' : 'var(--text-muted)',
              boxShadow: !isRegister ? 'inset 0 0 0 1px rgba(59, 130, 246, 0.4)' : 'none',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode(true)}
            style={{
              padding: '0.55rem',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              background: isRegister ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: isRegister ? '#fff' : 'var(--text-muted)',
              boxShadow: isRegister ? 'inset 0 0 0 1px rgba(59, 130, 246, 0.4)' : 'none',
            }}
          >
            Create Account
          </button>
        </div>

        <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#fff', marginBottom: '0.35rem' }}>
          {isRegister ? 'Get started in seconds' : 'Welcome back'}
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.4rem', lineHeight: '1.45' }}>
          {isRegister
            ? 'Create your workspace to get a unique Site ID and 4KB tracking script for your website.'
            : 'Sign in to inspect live visitor journeys, click heatmaps, and engagement trends.'}
        </p>

        {error && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.14)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              color: '#fda4af',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              fontSize: '0.84rem',
              marginBottom: '1.25rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.05rem' }}>
          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="search-input"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem 0.9rem 0.7rem 2.4rem', borderRadius: '10px' }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="search-input"
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem 0.9rem 0.7rem 2.4rem', borderRadius: '10px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder={isRegister ? 'Create a password (min. 6 chars)' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="search-input"
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem 2.5rem 0.7rem 2.4rem', borderRadius: '10px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              marginTop: '0.4rem',
              padding: '0.8rem',
              borderRadius: '10px',
              fontSize: '0.92rem',
            }}
          >
            <span>{submitting ? 'Signing in...' : isRegister ? 'Create Workspace' : 'Sign In to Dashboard'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Feature Highlights Footer */}
        <div
          style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            textAlign: 'center',
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
            <Globe size={15} color="#38bdf8" />
            <span>Multi-Site</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
            <Flame size={15} color="#fb7185" />
            <span>Heatmaps</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
            <ShieldCheck size={15} color="#34d399" />
            <span>Privacy-First</span>
          </div>
        </div>
      </div>
    </div>
  );
}
