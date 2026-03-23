import React from 'react';
import { Printer, X, Download, Store } from 'lucide-react';

const Receipt = ({ transaction, onClose, onPrint }) => {
  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleString();
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 'var(--radius-lg)',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        position: 'relative'
      }} id="receipt-content">
        {/* Receipt Header */}
        <div style={{
          padding: '2rem 2rem 1rem',
          textAlign: 'center',
          borderBottom: '2px dashed var(--gray-300)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{ 
            background: 'var(--primary-color)', 
            color: 'white', 
            padding: '0.75rem', 
            borderRadius: '50%',
            marginBottom: '0.5rem',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)'
          }}>
            <Store size={28} />
          </div>
          <h2 style={{
            margin: '0',
            fontSize: '1.75rem',
            fontWeight: '800',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            textTransform: 'uppercase'
          }}>
            SmartPOS <span style={{ color: 'var(--primary-color)' }}>Pro</span>
          </h2>
          <p style={{ margin: '0', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500', lineHeight: '1.5' }}>
            123 Innovation Drive, Tech Park<br />
            contact@smartpos.pro | +1 (555) 123-4567<br />
            GSTIN: 29ABCDE1234F1Z5
          </p>
        </div>

        {/* Receipt Body */}
        <div style={{ padding: '1.5rem' }}>
          {/* Transaction Info */}
          <div style={{
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--gray-200)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>Transaction ID:</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                #{transaction.id || transaction.transaction_id || 'N/A'}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>Date:</span>
              <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                {formatDate(transaction.timestamp)}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.875rem'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>Payment Method:</span>
              <span style={{
                fontWeight: '600',
                color: 'var(--text-primary)',
                textTransform: 'uppercase'
              }}>
                {transaction.payment_mode || transaction.payment_method || 'Cash'}
              </span>
            </div>
          </div>

          {/* Items List */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--gray-200)',
              marginBottom: '0.75rem',
              fontWeight: '600',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-secondary)'
            }}>
              <span>Item</span>
              <span style={{ display: 'flex', gap: '2rem' }}>
                <span>Qty</span>
                <span>Price</span>
                <span>Total</span>
              </span>
            </div>
            {(transaction.items || []).map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
                fontSize: '0.875rem'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {item.item_name || item.name}
                  </div>
                  {item.item_id && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      ID: {item.item_id}
                    </div>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  gap: '2rem',
                  alignItems: 'center',
                  minWidth: '150px',
                  justifyContent: 'flex-end'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.quantity}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>₹{item.price?.toFixed(2) || '0.00'}</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    ₹{item.total?.toFixed(2) || (item.price * item.quantity)?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{
            paddingTop: '1rem',
            borderTop: '2px solid var(--gray-300)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal:</span>
              <span>₹{((transaction.total_amount || 0) * 0.95).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <span>GST (5%):</span>
              <span>₹{((transaction.total_amount || 0) * 0.05).toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
              padding: '1rem 0',
              borderTop: '1px dashed var(--gray-300)',
              borderBottom: '1px dashed var(--gray-300)'
            }}>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'var(--text-primary)'
              }}>
                GRAND TOTAL:
              </span>
              <span style={{
                fontSize: '1.5rem',
                fontWeight: '800',
                color: 'var(--primary-color)'
              }}>
                ₹{(transaction.total_amount || 0).toFixed(2)}
              </span>
            </div>
            {transaction.customer_name && (
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--gray-200)'
              }}>
                <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>Customer:</div>
                <div>{transaction.customer_name}</div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            {/* Fake Barcode */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: '0.5rem',
              opacity: 0.8
            }}>
              <div style={{ 
                height: '40px', 
                width: '80%', 
                background: 'repeating-linear-gradient(90deg, #000 0, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 6px, transparent 6px, transparent 9px, #000 9px, #000 12px, transparent 12px, transparent 15px)',
                margin: '0 auto'
              }}></div>
            </div>
            <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: '0.2em', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              {transaction.id || transaction.transaction_id || '1234567890'}
            </p>
            <p style={{ margin: '0', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Thank you for visiting!
            </p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Powered by SmartPOS Pro
            </p>
          </div>
        </div>

        {/* Receipt Actions */}
        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--gray-200)', display: 'flex', gap: '1rem', background: 'var(--bg-secondary)', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
          <button onClick={onPrint} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Printer size={18} /> Print
          </button>
          <button onClick={() => alert('Downloading PDF...')} className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Download size={18} /> PDF
          </button>
          <button onClick={onClose} className="btn-secondary" style={{ width: '48px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error-color)', borderColor: 'var(--error-color)' }}>
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;


