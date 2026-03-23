import React from 'react';
import { useToast } from '../contexts/ToastContext';

const TransactionDetail = ({ transaction, onClose }) => {
  const { info } = useToast();

  if (!transaction) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Transaction Details</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          {/* Transaction Info */}
          <div style={{
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--gray-200)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.25rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Transaction ID
                </div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  #{transaction.id || transaction._id || 'N/A'}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.25rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Date & Time
                </div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  {formatDate(transaction.timestamp)}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.25rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Payment Method
                </div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  textTransform: 'uppercase'
                }}>
                  {transaction.payment_mode || transaction.payment_method || 'Cash'}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.25rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Total Amount
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: 'var(--success-color)'
                }}>
                  ₹{transaction.total_amount?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{
              margin: '0 0 1rem 0',
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              Items ({transaction.items?.length || 0})
            </h4>
            <div style={{
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    background: 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--gray-200)'
                  }}>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Item
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Quantity
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'right',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Price
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'right',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(transaction.items || []).map((item, index) => (
                    <tr key={index} style={{
                      borderBottom: index < transaction.items.length - 1 ? '1px solid var(--gray-200)' : 'none'
                    }}>
                      <td style={{
                        padding: '0.75rem',
                        fontWeight: '500',
                        color: 'var(--text-primary)'
                      }}>
                        {item.item_name || item.name}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        color: 'var(--text-secondary)'
                      }}>
                        {item.quantity}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        color: 'var(--text-secondary)'
                      }}>
                        ₹{item.price?.toFixed(2) || '0.00'}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: 'var(--text-primary)'
                      }}>
                        ₹{item.total?.toFixed(2) || (item.price * item.quantity)?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div style={{
            padding: '1rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--gray-200)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Total Amount:
              </span>
              <span style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--success-color)'
              }}>
                ₹{transaction.total_amount?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;


