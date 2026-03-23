import React, { useState, useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';
import { useToast } from '../contexts/ToastContext';
import { itemsAPI, transactionsAPI, dashboardAPI } from '../services/api';
import Receipt from './Receipt';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ShoppingCart, Plus, Minus, X, Banknote, CreditCard, Wallet, UserPlus } from 'lucide-react';


const Billing = () => {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [dashboardData, setDashboardData] = useState({ today_sales: 0 });
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const { currentSession, isShopOpen, refreshSession } = useSession();
  const { success, error: showError, info } = useToast();

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-refresh dashboard data every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const dashboardResponse = await dashboardAPI.getOverview();
        setDashboardData(dashboardResponse.data.data || { today_sales: 0 });
      } catch (error) {
        console.log('Auto-refresh using fallback data');
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Persist cart data to localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('smartpos_cart');
    if (savedCart && JSON.parse(savedCart).length > 0) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('smartpos_cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('smartpos_cart');
    }
  }, [cart]);

  const loadInitialData = async () => {
    try {
      console.log('Loading initial billing data...');
      
      const [itemsResponse, customersResponse, dashboardResponse] = await Promise.all([
        itemsAPI.getAll(),
        fetch('http://localhost:5000/customers/').then(res => res.json()).catch(() => ({ data: [] })),
        dashboardAPI.getOverview()
      ]);
      
      setItems(itemsResponse.data.data || []);
      setCustomers(customersResponse.data || []);
      setDashboardData(dashboardResponse.data.data || { today_sales: 0 });
      
      console.log('✅ Billing data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading billing data:', error);
    }
  };

  const addToCart = (item) => {
    if (item.stock !== undefined && item.stock <= 0) {
      showError('Item is out of stock');
      return;
    }
    
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      if (item.stock !== undefined && existingItem.quantity >= item.stock) {
        showError(`Only ${item.stock} items available in stock`);
        return;
      }
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1, total: (cartItem.quantity + 1) * cartItem.price }
          : cartItem
      ));
      info(`Added ${item.name} to cart`);
    } else {
      setCart([...cart, { ...item, quantity: 1, total: item.price }]);
      info(`Added ${item.name} to cart`);
    }
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item =>
        item.id === id
          ? { ...item, quantity, total: quantity * item.price }
          : item
      ));
    }
  };

  const removeFromCart = (id) => {
    const item = cart.find(i => i.id === id);
    setCart(cart.filter(item => item.id !== id));
    if (item) {
      info(`Removed ${item.name} from cart`);
    }
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
  };

  const addNewCustomer = async () => {
    try {
      const response = await fetch('http://localhost:5000/customers/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      });
      
      if (response.ok) {
        const customer = await response.json();
        setCustomers([...customers, customer.data || customer]);
        setSelectedCustomer(customer.data || customer);
        setShowCustomerModal(false);
        setNewCustomer({ name: '', email: '', phone: '' });
        success('Customer added successfully!');
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      showError('Error adding customer');
    }
  };

  const processPayment = async (paymentMethod) => {
    if (cart.length === 0) {
      showError('Cart is empty!');
      return;
    }

    if (!isShopOpen) {
      showError('Shop is closed! Please open the shop first.');
      return;
    }

    setLoading(true);
    
    try {
      const transactionData = {
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.total || (item.price * item.quantity)
        })),
        total_amount: total,
        payment_method: paymentMethod,
        customer_id: selectedCustomer?.id || null
      };

      const response = await transactionsAPI.create(transactionData);
      
      if (response.data && response.data.success) {
        const transaction = response.data.data || response.data;
        
        // Prepare receipt data
        const receiptData = {
          ...transaction,
          customer_name: selectedCustomer?.name || null,
          items: cart.map(item => ({
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.total || (item.price * item.quantity)
          }))
        };
        
        setLastTransaction(receiptData);
        
        // Refresh session data
        await refreshSession();
        
        // Clear cart and refresh dashboard data
        clearCart();
        await loadInitialData();
        
        success(`Payment processed! ₹${total.toFixed(2)} via ${paymentMethod.toUpperCase()}`);
        
        // Show receipt after short delay
        setTimeout(() => {
          setShowReceipt(true);
        }, 500);
      } else {
        throw new Error(response.data?.detail || 'Transaction failed');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
      showError(`Payment failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    const receiptContent = document.getElementById('receipt-content');
    if (receiptContent) {
      const printWindow = window.open('', '', 'width=800,height=600');
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - SmartPOS AI</title>
            <style>
              body { font-family: 'Inter', sans-serif; padding: 2rem; margin: 0; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            ${receiptContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setLastTransaction(null);
  };

  // Calculate total whenever cart changes
  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + (item.total || 0), 0);
    setTotal(newTotal);
  }, [cart]);

  return (
    <div className="main-content">
      {/* Header Section */}
      <div className="card" style={{ 
        marginBottom: '2rem',
        padding: '2rem',
        background: 'var(--bg-primary)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.02em'
          }}>
            Billing System
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            margin: '0 0 1.5rem 0',
            fontSize: '1rem',
            fontWeight: '500'
          }}>
            Process transactions and manage customer orders
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="badge badge-primary" style={{ 
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>$</span>
              Today's Sales: ₹{dashboardData.today_sales || 0}
            </div>
            <div className="badge badge-success" style={{ 
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>◆</span>
              Session: {currentSession ? `#${currentSession.id}` : 'None'}
            </div>
          {currentSession && (
              <div className="badge badge-warning" style={{ 
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>#</span>
                Transactions: {currentSession.transaction_count || 0}
              </div>
          )}
        </div>
      </div>
        
      </div>

      {/* Shop Status Alert */}
      {!isShopOpen && (
        <div className="card" style={{ 
          marginBottom: '2rem',
          padding: '1.5rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            color: 'var(--error-color)'
          }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>!</span>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
                Shop is Closed
              </h3>
              <p style={{ margin: '0', fontSize: '0.875rem' }}>
                Please open the shop from the navigation to start processing transactions.
              </p>
            </div>
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '2rem',
        minHeight: '600px'
      }}>
        {/* Left Side - Products */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1.5rem' 
          }}>
            <h2 style={{ 
              margin: '0', 
              fontSize: '1.5rem', 
              fontWeight: '600',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Package size={24} />
              Products
            </h2>
            <div className="badge badge-primary">
              {items.length} items available
              </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem',
            maxHeight: '500px',
            overflowY: 'auto',
            padding: '0.5rem'
          }}>
            {items.map((item, index) => (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card elevated" style={{
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all var(--transition-normal)',
                border: '1px solid var(--gray-200)'
              }}
              onClick={() => isShopOpen && addToCart(item)}
              whileHover={isShopOpen ? { y: -4, boxShadow: 'var(--shadow-lg)' } : {}}
              >
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem'
                }}>
                  <h3 style={{ 
                    margin: '0', 
                    fontSize: '1rem', 
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    {item.name}
                  </h3>
                  <div className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                    {item.category}
                  </div>
                </div>
                
                <p style={{ 
                  margin: '0 0 0.75rem 0', 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold',
                  color: 'var(--success-color)'
                }}>
                  ₹{item.price}
                </p>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)'
                }}>
                  <span>Stock: {item.stock || 'N/A'}</span>
                  {!isShopOpen && (
                    <span style={{ color: 'var(--error-color)', fontWeight: '500' }}>
                      Shop Closed
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Side - Cart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ 
            margin: '0 0 1.5rem 0', 
            fontSize: '1.5rem', 
            fontWeight: '600',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ShoppingCart size={24} />
            Shopping Cart
          </h2>

          {/* Customer Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
              Customer
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={selectedCustomer?.id || ''}
                onChange={(e) => {
                  const customer = customers.find(c => c.id === e.target.value);
                  setSelectedCustomer(customer || null);
                }}
                className="form-select"
                style={{ flex: 1 }}
              >
                <option value="">Walk-in Customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.phone})
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowCustomerModal(true)}
                className="btn-secondary"
                style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <UserPlus size={18} />
                Add
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div style={{ 
            maxHeight: '300px', 
            overflowY: 'auto', 
            marginBottom: '1.5rem',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem'
          }}>
            {cart.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                color: 'var(--text-tertiary)' 
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>$</div>
                <p style={{ margin: '0' }}>Cart is empty</p>
                <p style={{ margin: '0', fontSize: '0.875rem' }}>
                  Add items to get started
                </p>
              </div>
            ) : (
              <AnimatePresence>
              {cart.map(item => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  borderBottom: '1px solid var(--gray-200)'
                }}
                whileHover={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      margin: '0 0 0.25rem 0', 
                      fontSize: '0.875rem', 
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}>
                      {item.name}
                    </h4>
                    <p style={{ 
                      margin: '0', 
                      fontSize: '0.75rem', 
                      color: 'var(--text-secondary)' 
                    }}>
                      ₹{item.price} each
                    </p>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                    gap: '0.5rem' 
                  }}>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="btn-secondary"
                      style={{
                        padding: '0.25rem',
                        fontSize: '0.75rem',
                        minWidth: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ 
                      minWidth: '2rem', 
                      textAlign: 'center',
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}>
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="btn-secondary"
                      style={{
                        padding: '0.25rem',
                        fontSize: '0.75rem',
                        minWidth: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                      className="btn-error"
                    style={{
                        padding: '0.25rem',
                        fontSize: '0.75rem',
                        minWidth: '24px',
                        marginLeft: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <X size={14} />
                  </button>
                </div>

              <div style={{ 
                    textAlign: 'right', 
                    marginLeft: '1rem',
                    minWidth: '4rem'
                  }}>
                    <p style={{ 
                      margin: '0', 
                      fontSize: '0.875rem', 
                      fontWeight: 'bold',
                      color: 'var(--success-color)'
                    }}>
                      ₹{item.total}
                </p>
              </div>
                </motion.div>
              ))}
              </AnimatePresence>
            )}
          </div>

          {/* Total and Payment */}
          {cart.length > 0 && (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                border: '1px solid var(--gray-200)'
              }}>
                <span style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  Total:
                </span>
                <span style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold',
                  color: 'var(--success-color)'
                }}>
                  ₹{total}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => processPayment('cash')}
                  disabled={loading || !isShopOpen}
                  className="btn-success"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner" style={{ width: '1rem', height: '1rem' }}></div>
                      Processing...
                    </>
                  ) : (
                    <><Banknote size={18} /> Cash</>
                  )}
                </button>
                <button
                  onClick={() => processPayment('card')}
                  disabled={loading || !isShopOpen}
                  className="btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <CreditCard size={18} /> Card
                </button>
                <button 
                  onClick={() => processPayment('upi')}
                  disabled={loading || !isShopOpen}
                  className="btn-warning"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Wallet size={18} /> UPI
                </button>
              </div>

              <button
                onClick={clearCart}
                className="btn-secondary"
                style={{ 
                  width: '100%', 
                  marginTop: '0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                Clear Cart
              </button>
            </>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastTransaction && (
        <Receipt 
          transaction={lastTransaction} 
          onClose={handleCloseReceipt}
          onPrint={handlePrintReceipt}
        />
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="modal-overlay" onClick={() => setShowCustomerModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Customer</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCustomerModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  onClick={addNewCustomer}
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  Add Customer
                </button>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;