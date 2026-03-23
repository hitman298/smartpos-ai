import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Store, User, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const result = login(username, password);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-app)',
      padding: '2rem'
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="card"
        style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            background: 'var(--primary-color)', 
            color: 'white', 
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            boxShadow: '0 4px 14px 0 rgba(47, 79, 79, 0.3)'
          }}>
            <Store size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>SmartPOS <span style={{ color: 'var(--primary-color)', opacity: 0.8 }}>Pro</span></h1>
          <p style={{ color: 'var(--text-secondary)' }}>Sign in to continue</p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(209, 107, 107, 0.1)', 
            color: 'var(--error-color)', 
            border: '1px solid var(--error-color)',
            padding: '1rem', 
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin, cashier, kitchen"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                  fontSize: '1rem',
                  color: 'var(--text-primary)'
                }} 
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                  fontSize: '1rem',
                  color: 'var(--text-primary)'
                }} 
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            Login <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
          </button>
        </form>

        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'var(--text-tertiary)' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--gray-300)' }}></div>
            <span style={{ padding: '0 1rem', fontSize: '0.875rem' }}>or 1-Click Demo Login</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--gray-300)' }}></div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              type="button" 
              onClick={() => login('admin', 'admin123')}
              className="btn-secondary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem' }}
            >
              <span>Login as <strong style={{color: 'var(--text-primary)'}}>Admin</strong></span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>(Full Access)</span>
            </button>
            <button 
              type="button" 
              onClick={() => login('cashier', 'cashier123')}
              className="btn-secondary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem' }}
            >
              <span>Login as <strong style={{color: 'var(--text-primary)'}}>Cashier</strong></span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>(POS & Tables)</span>
            </button>
            <button 
              type="button" 
              onClick={() => login('kitchen', 'kitchen123')}
              className="btn-secondary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem' }}
            >
              <span>Login as <strong style={{color: 'var(--text-primary)'}}>Kitchen</strong></span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>(KDS Only)</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
