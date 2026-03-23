import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((message, duration) => showToast(message, 'success', duration), [showToast]);
  const error = useCallback((message, duration) => showToast(message, 'error', duration), [showToast]);
  const info = useCallback((message, duration) => showToast(message, 'info', duration), [showToast]);
  const warning = useCallback((message, duration) => showToast(message, 'warning', duration), [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      pointerEvents: 'none'
    }}>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
};

const Toast = ({ toast, removeToast }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => removeToast(toast.id), 300);
  };

  const colors = {
    success: { bg: 'var(--success-color)', border: 'rgba(16, 185, 129, 0.2)' },
    error: { bg: 'var(--error-color)', border: 'rgba(239, 68, 68, 0.2)' },
    warning: { bg: 'var(--warning-color)', border: 'rgba(245, 158, 11, 0.2)' },
    info: { bg: 'var(--accent-color)', border: 'rgba(37, 99, 235, 0.2)' }
  };

  const color = colors[toast.type] || colors.info;

  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        border: `1px solid ${color.border}`,
        borderLeft: `4px solid ${color.bg}`,
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.25rem',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
        minWidth: '300px',
        maxWidth: '400px',
        pointerEvents: 'auto',
        transform: isExiting ? 'translateX(100%)' : 'translateX(0)',
        opacity: isExiting ? 0 : 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        cursor: 'pointer'
      }}
      onClick={handleClose}
    >
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: color.bg,
        marginTop: '0.375rem',
        flexShrink: 0
      }}></div>
      <div style={{ flex: 1 }}>
        <p style={{
          margin: 0,
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'var(--text-primary)',
          lineHeight: '1.5'
        }}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '0',
          fontSize: '1.25rem',
          lineHeight: '1',
          width: '1.5rem',
          height: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-sm)',
          transition: 'all var(--transition-fast)',
          flexShrink: 0
        }}
        onMouseEnter={(e) => e.target.style.background = 'var(--bg-secondary)'}
        onMouseLeave={(e) => e.target.style.background = 'transparent'}
      >
        ×
      </button>
    </div>
  );
};


