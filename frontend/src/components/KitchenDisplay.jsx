import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Clock, CheckCircle, ArrowRight, Play, Info, Plus } from 'lucide-react';

const MOCK_ORDERS = [
  { id: '101', table: '4', items: [{ name: 'Mojito', qty: 2 }, { name: 'Samosa', qty: 4 }], status: 'pending', time: '18:45', priority: 'high' },
  { id: '102', table: '2', items: [{ name: 'Tea', qty: 2 }], status: 'pending', time: '18:50', priority: 'normal' },
  { id: '103', table: 'Takeaway', items: [{ name: 'Egg Puff', qty: 1 }], status: 'preparing', time: '18:35', priority: 'normal' },
  { id: '104', table: '6', items: [{ name: 'Allam Tea', qty: 3 }, { name: 'Samosa', qty: 2 }], status: 'ready', time: '18:20', priority: 'normal' },
];

const KitchenDisplay = () => {
  const [orders, setOrders] = useState(MOCK_ORDERS);

  // Play a sound when a new order comes in (simulated by clicking a button for now)
  const simulateNewOrder = () => {
    const newOrder = {
      id: Math.floor(Math.random() * 1000).toString(),
      table: Math.floor(Math.random() * 10).toString(),
      items: [{ name: 'Lemon Tea', qty: 1 }],
      status: 'pending',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priority: Math.random() > 0.8 ? 'high' : 'normal'
    };
    setOrders([...orders, newOrder]);
    // In a real app, we would play a sound here
    // const audio = new Audio('/notification.mp3');
    // audio.play();
  };

  const moveOrder = (id, newStatus) => {
    setOrders(orders.map(order => 
      order.id === id ? { ...order, status: newStatus } : order
    ));
  };

  const removeOrder = (id) => {
    setOrders(orders.filter(order => order.id !== id));
  };

  const renderOrderCard = (order) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      className={`card elevated ${order.priority === 'high' ? 'border-l-4' : ''}`}
      style={{
        padding: '1.25rem',
        marginBottom: '1rem',
        borderLeft: order.priority === 'high' ? '4px solid var(--error-color)' : '1px solid var(--gray-200)',
        background: 'var(--bg-primary)'
      }}
      key={order.id}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            #{order.id}
            <span className="badge" style={{ 
              background: order.table === 'Takeaway' ? 'var(--primary-color)' : 'var(--gray-800)',
              color: 'white',
              fontSize: '0.75rem',
              padding: '0.25rem 0.5rem'
            }}>
              {order.table === 'Takeaway' ? 'Pickup' : `Table ${order.table}`}
            </span>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <Clock size={14} />
            <span>{order.time}</span>
            {order.priority === 'high' && (
               <span style={{ color: 'var(--error-color)', fontWeight: 'bold', marginLeft: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                 Rush
               </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ margin: '1rem 0', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {order.items.map((item, idx) => (
            <li key={idx} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '0.25rem 0',
              borderBottom: idx !== order.items.length - 1 ? '1px solid var(--gray-200)' : 'none',
              color: 'var(--text-primary)',
              fontWeight: '500'
            }}>
              <span>{item.name}</span>
              <span style={{ fontWeight: 'bold' }}>x{item.qty}</span>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        {order.status === 'pending' && (
          <button 
            onClick={() => moveOrder(order.id, 'preparing')}
            className="btn-primary" 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', padding: '0.5rem' }}
          >
            <Play size={16} /> Start
          </button>
        )}
        
        {order.status === 'preparing' && (
          <button 
            onClick={() => moveOrder(order.id, 'ready')}
            className="btn-success" 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', padding: '0.5rem' }}
          >
            <CheckCircle size={16} /> Ready
          </button>
        )}
        
        {order.status === 'ready' && (
          <button 
            onClick={() => removeOrder(order.id)}
            className="btn-secondary" 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', padding: '0.5rem' }}
          >
            <CheckCircle size={16} /> Mark Served
          </button>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="main-content" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="card" style={{ 
        marginBottom: '1.5rem',
        padding: '1.5rem 2rem',
        background: 'linear-gradient(135deg, var(--gray-900) 0%, var(--gray-800) 100%)',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <ChefHat size={32} color="var(--primary-light)" />
            </div>
            <div>
              <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>Kitchen Display System</h1>
              <p style={{ margin: 0, color: 'var(--gray-300)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-color)' }}></span>
                Live Order Tracking
              </p>
            </div>
          </div>
          
          <button 
            onClick={simulateNewOrder}
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} /> Simulate Order
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '1.5rem',
        flex: 1,
        minHeight: 0
      }}>
        {/* Pending Column */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '1rem', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--error-color)' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Pending <span className="badge badge-error">{orders.filter(o => o.status === 'pending').length}</span>
            </h2>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            <AnimatePresence>
              {orders.filter(o => o.status === 'pending').map(renderOrderCard)}
              {orders.filter(o => o.status === 'pending').length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>No pending orders</div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Preparing Column */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '1rem', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--warning-color)' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Preparing <span className="badge badge-warning">{orders.filter(o => o.status === 'preparing').length}</span>
            </h2>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            <AnimatePresence>
              {orders.filter(o => o.status === 'preparing').map(renderOrderCard)}
              {orders.filter(o => o.status === 'preparing').length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>Empty</div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Ready Column */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '1rem', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--success-color)' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Ready for Pickup <span className="badge badge-success">{orders.filter(o => o.status === 'ready').length}</span>
            </h2>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            <AnimatePresence>
              {orders.filter(o => o.status === 'ready').map(renderOrderCard)}
              {orders.filter(o => o.status === 'ready').length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>Empty</div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KitchenDisplay;
