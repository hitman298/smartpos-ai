import React, { useState, useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';
import { useToast } from '../contexts/ToastContext';
import { itemsAPI, transactionsAPI, dashboardAPI } from '../services/api';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';
import TransactionDetail from './TransactionDetail';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, ShoppingCart, Package, Users, Power, Download, FileText, CheckCircle, RefreshCcw } from 'lucide-react';


const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    lifetimeRevenue: 0,
    todayTransactions: 0,
    activeItems: 0,
    totalCustomers: 0
  });
  const [loading, setLoading] = useState(true);
  const [showReports, setShowReports] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const { currentSession, isShopOpen, refreshSession } = useSession();
  const { success, info } = useToast();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data...');
      
      // Fetch all data in parallel
      const [itemsResponse, transactionsResponse, dashboardResponse] = await Promise.all([
        itemsAPI.getAll(),
        transactionsAPI.getAll(),
        dashboardAPI.getOverview()
      ]);

      console.log('API Responses:', {
        items: itemsResponse.data,
        transactions: transactionsResponse.data,
        dashboard: dashboardResponse.data
      });

      const items = itemsResponse.data.data || [];
      const transactionsData = transactionsResponse.data.data || [];
      const dashboardData = dashboardResponse.data.data || {};
      
      // Store transactions for reports
      setTransactions(transactionsData);

      // Calculate today's transactions
      const today = new Date().toDateString();
      const todayTransactions = transactionsData.filter(t => 
        new Date(t.timestamp).toDateString() === today
      ).length;

      setStats({
        activeItems: dashboardData.active_items || items.length,
        totalCustomers: dashboardData.total_customers || 0,
        totalSales: dashboardData.today_sales || 0,
        lifetimeRevenue: dashboardData.lifetime_revenue || 0,
        todayTransactions: dashboardData.today_transactions || todayTransactions
      });

      console.log('✅ Dashboard data updated:', {
        activeItems: items.length,
        totalCustomers: dashboardData.total_customers || 0,
        totalSales: dashboardData.today_sales || 0,
        lifetimeRevenue: dashboardData.lifetime_revenue || 0,
        todayTransactions
      });

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const exportData = () => {
    const data = {
      stats,
      transactions,
      currentSession,
      exportedAt: new Date().toISOString()
    };
    
    exportToJSON(data, 'smartpos-data');
    success('Data exported successfully!');
  };

  const exportTransactionsCSV = () => {
    if (transactions.length === 0) {
      info('No transactions to export');
      return;
    }
    
    const csvData = transactions.map(t => ({
      'Transaction ID': t.id || t._id,
      'Date': new Date(t.timestamp).toLocaleString(),
      'Total Amount': `₹${t.total_amount || 0}`,
      'Payment Method': t.payment_mode || t.payment_method || 'Cash',
      'Items Count': t.items?.length || 0,
      'Customer ID': t.customer_id || 'N/A'
    }));
    
    exportToCSV(csvData, 'transactions');
    success('Transactions exported to CSV!');
  };

  const generateReport = () => {
    const report = {
      title: "SmartPOS Dashboard Report",
      generatedAt: new Date().toISOString(),
      summary: {
        totalSales: stats.totalSales,
        lifetimeRevenue: stats.lifetimeRevenue,
        todayTransactions: stats.todayTransactions,
        activeItems: stats.activeItems,
        totalCustomers: stats.totalCustomers
      },
      sessionInfo: currentSession ? {
        sessionId: currentSession.id,
        startTime: currentSession.start_time,
        totalSales: currentSession.total_sales,
        transactionCount: currentSession.transaction_count
      } : null,
      recentTransactions: transactions.slice(0, 10)
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartpos-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem auto', width: '2rem', height: '2rem' }}></div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Loading Dashboard...</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Please wait while we load your business data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Header Section */}
      <div className="dashboard-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        padding: '2rem',
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--gray-200)',
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
            Business Dashboard
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            margin: '0',
            fontSize: '1rem',
            fontWeight: '500'
          }}>
            Real-time insights and analytics for your business
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 2 }}>
          <button 
            onClick={exportData}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem'
            }}
          >
            <Download size={18} />
            Export JSON
          </button>
          <button 
            onClick={exportTransactionsCSV}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem'
            }}
          >
            <Download size={18} />
            Export CSV
          </button>
          <button 
            onClick={generateReport}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem'
            }}
          >
            <FileText size={18} />
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-grid">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stats-card elevated">
          <div className="stats-card-header">
            <div className="stats-card-title">Today's Sales</div>
            <div className="stats-card-icon" style={{ background: 'var(--success-color)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="stats-card-value" style={{ color: 'var(--success-color)' }}>
            ₹{stats.totalSales.toLocaleString()}
          </div>
          <div className="stats-card-change">
            <span style={{ color: 'var(--text-tertiary)' }}>Revenue today</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stats-card elevated">
          <div className="stats-card-header">
            <div className="stats-card-title">Lifetime Revenue</div>
            <div className="stats-card-icon" style={{ background: 'var(--gray-700)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stats-card-value" style={{ color: 'var(--text-primary)' }}>
            ₹{stats.lifetimeRevenue.toLocaleString()}
          </div>
          <div className="stats-card-change">
            <span style={{ color: 'var(--text-tertiary)' }}>Total earnings</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="stats-card elevated">
          <div className="stats-card-header">
            <div className="stats-card-title">Today's Transactions</div>
            <div className="stats-card-icon" style={{ background: 'var(--primary-color)' }}>
              <ShoppingCart size={20} />
            </div>
          </div>
          <div className="stats-card-value" style={{ color: 'var(--primary-color)' }}>
            {stats.todayTransactions}
          </div>
          <div className="stats-card-change">
            <span style={{ color: 'var(--text-tertiary)' }}>Orders today</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="stats-card elevated">
          <div className="stats-card-header">
            <div className="stats-card-title">Active Items</div>
            <div className="stats-card-icon" style={{ background: 'var(--warning-color)' }}>
              <Package size={20} />
            </div>
          </div>
          <div className="stats-card-value" style={{ color: 'var(--warning-color)' }}>
            {stats.activeItems}
          </div>
          <div className="stats-card-change">
            <span style={{ color: 'var(--text-tertiary)' }}>In menu</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="stats-card elevated">
          <div className="stats-card-header">
            <div className="stats-card-title">Total Customers</div>
            <div className="stats-card-icon" style={{ background: 'var(--gray-600)' }}>
              <Users size={20} />
            </div>
          </div>
          <div className="stats-card-value" style={{ color: 'var(--text-primary)' }}>
            {stats.totalCustomers}
          </div>
          <div className="stats-card-change">
            <span style={{ color: 'var(--text-tertiary)' }}>Registered</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="stats-card elevated">
          <div className="stats-card-header">
            <div className="stats-card-title">Shop Status</div>
            <div className="stats-card-icon" style={{ 
              background: isShopOpen ? 'var(--success-color)' : 'var(--error-color)'
            }}>
              <Power size={20} />
            </div>
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: '600',
            backgroundColor: isShopOpen ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: isShopOpen ? 'var(--success-color)' : 'var(--error-color)',
            border: `1px solid ${isShopOpen ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            marginBottom: '1rem'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isShopOpen ? 'var(--success-color)' : 'var(--error-color)',
              animation: 'pulse 2s infinite'
            }}></span>
            {isShopOpen ? 'OPEN' : 'CLOSED'}
          </div>
            {currentSession && (
            <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
              <div style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
                Session #{currentSession.id}
              </div>
              <div style={{ marginTop: '0.25rem' }}>
                Started: {new Date(currentSession.start_time).toLocaleTimeString()}
              </div>
                {currentSession.transaction_count > 0 && (
                  <div style={{ marginTop: '0.25rem' }}>
                    Transactions: {currentSession.transaction_count}
                  </div>
                )}
              </div>
            )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem' }}>
          <h3 style={{ 
            margin: '0 0 1.5rem 0', 
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            Quick Actions
          </h3>
          <div className="quick-actions">
          <button 
            onClick={() => {
              fetchDashboardData();
              refreshSession();
            }}
              className="action-button"
            >
              <div className="action-icon" style={{ background: 'var(--primary-color)' }}>
                <RefreshCcw size={24} />
              </div>
              <div className="action-title">Refresh All Data</div>
              <div className="action-description">Update all metrics</div>
          </button>
            
            <button 
              onClick={() => setShowReports(!showReports)}
              className="action-button"
            >
              <div className="action-icon" style={{ background: 'var(--gray-600)' }}>
                <TrendingUp size={24} />
              </div>
              <div className="action-title">{showReports ? 'Hide Reports' : 'View Reports'}</div>
              <div className="action-description">Analytics & insights</div>
          </button>
            
            <button 
              onClick={exportData}
              className="action-button"
            >
              <div className="action-icon" style={{ background: 'var(--success-color)' }}>
                <Download size={24} />
              </div>
              <div className="action-title">Export Data</div>
              <div className="action-description">Download JSON</div>
          </button>
          
          <button 
            onClick={exportTransactionsCSV}
            className="action-button"
          >
              <div className="action-icon" style={{ background: 'var(--warning-color)' }}>
                <FileText size={24} />
              </div>
              <div className="action-title">Export CSV</div>
              <div className="action-description">Download transactions</div>
          </button>
          </div>
        </div>
      </div>

      {/* Reports Section */}
      {showReports && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card">
          <div style={{ padding: '1.5rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1.5rem' 
            }}>
              <h3 style={{ 
                margin: '0', 
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Reports & Analytics
              </h3>
              <button 
                onClick={generateReport}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                Generate Report
              </button>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem', 
              marginBottom: '1.5rem' 
            }}>
              <div className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)' }}>
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  fontSize: '0.875rem', 
                  color: 'var(--text-secondary)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Revenue Analysis
                </h4>
                <p style={{ 
                  margin: '0', 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: 'var(--success-color)' 
                }}>
                  ₹{stats.totalSales.toLocaleString()}
                </p>
                <p style={{ 
                  margin: '0', 
                  fontSize: '0.75rem', 
                  color: 'var(--text-tertiary)' 
                }}>
                  Today's Revenue
                </p>
              </div>
              
              <div className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)' }}>
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  fontSize: '0.875rem', 
                  color: 'var(--text-secondary)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Transaction Volume
                </h4>
                <p style={{ 
                  margin: '0', 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: 'var(--primary-color)' 
                }}>
                  {stats.todayTransactions}
                </p>
                <p style={{ 
                  margin: '0', 
                  fontSize: '0.75rem', 
                  color: 'var(--text-tertiary)' 
                }}>
                  Today's Orders
                </p>
              </div>
              
              <div className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)' }}>
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  fontSize: '0.875rem', 
                  color: 'var(--text-secondary)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Average Order Value
                </h4>
                <p style={{ 
                  margin: '0', 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: 'var(--warning-color)' 
                }}>
                  ₹{stats.todayTransactions > 0 ? (stats.totalSales / stats.todayTransactions).toFixed(2) : '0.00'}
                </p>
                <p style={{ 
                  margin: '0', 
                  fontSize: '0.75rem', 
                  color: 'var(--text-tertiary)' 
                }}>
                  Per Transaction
                </p>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ 
                margin: '0 0 1rem 0', 
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Recent Transactions
              </h4>
              <div style={{ 
                maxHeight: '300px', 
                overflowY: 'auto', 
                border: '1px solid var(--gray-200)', 
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-primary)'
              }}>
                {transactions.slice(0, 5).map((transaction, index) => (
                  <div key={index} style={{ 
                    padding: '1rem', 
                    borderBottom: index < 4 ? '1px solid var(--gray-200)' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background-color var(--transition-fast)',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setSelectedTransaction(transaction);
                    setShowTransactionDetail(true);
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <div>
                      <p style={{ 
                        margin: '0', 
                        fontSize: '0.875rem', 
                        fontWeight: '600',
                        color: 'var(--text-primary)'
                      }}>
                        Transaction #{transaction.id}
                      </p>
                      <p style={{ 
                        margin: '0', 
                        fontSize: '0.75rem', 
                        color: 'var(--text-tertiary)' 
                      }}>
                        {new Date(transaction.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ 
                        margin: '0', 
                        fontSize: '0.875rem', 
                        fontWeight: 'bold', 
                        color: 'var(--success-color)' 
                      }}>
                        ₹{transaction.total_amount}
                      </p>
                      <p style={{ 
                        margin: '0', 
                        fontSize: '0.75rem', 
                        color: 'var(--text-tertiary)' 
                      }}>
                        {transaction.payment_mode}
                      </p>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div style={{ 
                    padding: '2rem', 
                    textAlign: 'center', 
                    color: 'var(--text-tertiary)' 
                  }}>
                    No transactions found
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Transaction Detail Modal */}
      {showTransactionDetail && selectedTransaction && (
        <TransactionDetail
          transaction={selectedTransaction}
          onClose={() => {
            setShowTransactionDetail(false);
            setSelectedTransaction(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;