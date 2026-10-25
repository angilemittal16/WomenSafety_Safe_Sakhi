import React, { useState } from 'react';
import { Shield, Lock, Mail, User, Phone, ArrowRight, Sparkles } from 'lucide-react';
import { api, setToken, setStoredUser } from '../lib/api';

export function Login({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let data;
      if (isRegister) {
        data = await api.register({ name, phone, email, password });
      } else {
        data = await api.login({ email, password });
      }

      setToken(data.token);
      setStoredUser(data.user);
      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.login({
        email: 'demo@safesakhi.app',
        password: 'demo1234'
      });
      setToken(data.token);
      setStoredUser(data.user);
      onAuthSuccess(data.user);
    } catch (err) {
      setError('Demo login error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '24px 20px',
        backgroundColor: 'var(--bg)'
      }}
    >
      <div className="card" style={{ padding: '32px 24px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Shield size={36} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            SafeSakhi
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {isRegister ? 'Create your personal safety account' : 'Personal safety & evidence organizer'}
          </p>
        </div>

        {/* Demo One-Tap Login Button */}
        {!isRegister && (
          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDemoLogin}
              disabled={loading}
              style={{
                width: '100%',
                minHeight: '52px',
                fontSize: '16px',
                fontWeight: 800,
                backgroundColor: 'var(--primary-dark)'
              }}
            >
              <Sparkles size={18} /> One-Tap Demo Login (Priya Sharma)
            </button>
            <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Prefilled credentials: demo@safesakhi.app / demo1234
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '18px 0',
                color: 'var(--text-muted)',
                fontSize: '12px'
              }}
            >
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
              <span style={{ padding: '0 10px', fontWeight: 600 }}>OR ENTER DETAILS</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#FFE8E8',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#900',
              fontWeight: 600
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Priya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <User size={18} color="var(--primary)" style={{ position: 'absolute', right: '14px', top: '15px' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+919876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  <Phone size={18} color="var(--primary)" style={{ position: 'absolute', right: '14px', top: '15px' }} />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail size={18} color="var(--primary)" style={{ position: 'absolute', right: '14px', top: '15px' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock size={18} color="var(--primary)" style={{ position: 'absolute', right: '14px', top: '15px' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', minHeight: '52px', fontSize: '16px', fontWeight: 800, marginTop: '8px' }}
          >
            {isRegister ? 'Create Account' : 'Log In'} <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {isRegister ? 'Already have an account? Log In' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
