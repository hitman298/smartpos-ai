import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Plus, Check, X, Coffee } from 'lucide-react';

// Mock data until backend is ready
const MOCK_TABLES = [
  { id: '1', number: '1', capacity: 2, status: 'available' },
  { id: '2', number: '2', capacity: 2, status: 'occupied', guests: 2, timeSeated: '10 mins' },
  { id: '3', number: '3', capacity: 4, status: 'available' },
  { id: '4', number: '4', capacity: 4, status: 'reserved', reserveTime: '19:00' },
  { id: '5', number: '5', capacity: 6, status: 'cleaning' },
  { id: '6', number: '6', capacity: 4, status: 'occupied', guests: 3, timeSeated: '45 mins' },
  { id: '7', number: '7', capacity: 2, status: 'available' },
  { id: '8', number: '8', capacity: 8, status: 'available' },
];

const TableManager = () => {
  const [tables, setTables] = useState(MOCK_TABLES);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return 'var(--success-color)';
      case 'occupied': return 'var(--error-color)';
      case 'reserved': return 'var(--warning-color)';
      case 'cleaning': return 'var(--primary-color)';
      default: return 'var(--gray-500)';
    }
  };

  const handleTableClick = (table) => {
    setSelectedTable(table);
    setShowModal(true);
  };

  const updateTableStatus = (status) => {
    if (!selectedTable) return;
    
    setTables(tables.map(t => 
      t.id === selectedTable.id 
        ? { ...t, status, guests: status === 'occupied' ? t.capacity : null }
        : t
    ));
    setShowModal(false);
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div className="card" style={{ 
        marginBottom: '2rem',
        padding: '2rem',
        background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)',
              margin: '0 0 0.5rem 0',
              background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Table Management
            </h1>
            <p style={{ 
              color: 'var(--text-secondary)', 
              margin: '0',
              fontSize: '1rem',
              fontWeight: '500'
            }}>
              Visual seating chart and real-time status tracking
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', padding: '0.5rem 1rem' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-color)', marginRight: '0.5rem' }}></span>
              Available ({tables.filter(t => t.status === 'available').length})
            </div>
            <div className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error-color)', padding: '0.5rem 1rem' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--error-color)', marginRight: '0.5rem' }}></span>
              Occupied ({tables.filter(t => t.status === 'occupied').length})
            </div>
            <div className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-color)', padding: '0.5rem 1rem' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning-color)', marginRight: '0.5rem' }}></span>
              Reserved ({tables.filter(t => t.status === 'reserved').length})
            </div>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="card" style={{ padding: '2rem', minHeight: '60vh' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '2rem' 
        }}>
          {tables.map((table, index) => (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5, boxShadow: 'var(--shadow-lg)' }}
              onClick={() => handleTableClick(table)}
              className="elevated"
              style={{
                position: 'relative',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${getStatusColor(table.status)}`,
                background: 'var(--bg-primary)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '180px',
                textAlign: 'center',
                overflow: 'hidden'
              }}
            >
              {/* Top border color strip */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: getStatusColor(table.status)
              }} />

              <h3 style={{ 
                margin: '0 0 1rem 0', 
                fontSize: '2rem', 
                fontWeight: 'bold',
                color: 'var(--text-primary)'
              }}>
                T-{table.number}
              </h3>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                <Users size={16} />
                <span>Capacity: {table.capacity}</span>
              </div>

              {table.status === 'occupied' && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  color: 'var(--error-color)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginTop: '0.5rem'
                }}>
                  <Clock size={16} />
                  <span>{table.timeSeated}</span>
                </div>
              )}
              
              {table.status === 'reserved' && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  color: 'var(--warning-color)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginTop: '0.5rem'
                }}>
                  <Clock size={16} />
                  <span>{table.reserveTime}</span>
                </div>
              )}

              <div style={{
                marginTop: '1rem',
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                background: `${getStatusColor(table.status)}20`,
                color: getStatusColor(table.status),
                fontSize: '0.75rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {table.status}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Table Action Modal */}
      <AnimatePresence>
        {showModal && selectedTable && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay" 
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="modal" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Manage Table {selectedTable.number}
                </h3>
                <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Current Status: <strong style={{ color: getStatusColor(selectedTable.status), textTransform: 'capitalize' }}>{selectedTable.status}</strong>
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {selectedTable.status !== 'occupied' && (
                    <button 
                      onClick={() => updateTableStatus('occupied')}
                      className="btn-error" 
                      style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}
                    >
                      <Users size={18} /> Seat Guests
                    </button>
                  )}
                  
                  {selectedTable.status === 'occupied' && (
                    <>
                      <button 
                        className="btn-primary" 
                        style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}
                      >
                        <Plus size={18} /> Add Order
                      </button>
                      <button 
                        onClick={() => updateTableStatus('cleaning')}
                        className="btn-warning" 
                        style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}
                      >
                        <Coffee size={18} /> Mark as Needs Cleaning
                      </button>
                    </>
                  )}
                  
                  {selectedTable.status === 'cleaning' && (
                    <button 
                      onClick={() => updateTableStatus('available')}
                      className="btn-success" 
                      style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}
                    >
                      <Check size={18} /> Mark as Clean & Available
                    </button>
                  )}
                  
                  {selectedTable.status !== 'reserved' && selectedTable.status !== 'occupied' && (
                    <button 
                      onClick={() => updateTableStatus('reserved')}
                      className="btn-secondary" 
                      style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}
                    >
                      <Clock size={18} /> Reserve Table
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TableManager;
