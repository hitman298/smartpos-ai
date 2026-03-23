import React, { useState, useEffect } from 'react';
import { customersAPI, transactionsAPI, dashboardAPI } from '../services/api';

const CustomerManager = () => {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    topCustomers: [],
    averageSpending: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all'); // all, high-value, new, frequent
  const [sortBy, setSortBy] = useState('total_spent'); // total_spent, name, visit_count, last_visit
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [customerAnalytics, setCustomerAnalytics] = useState({
    newCustomers: 0,
    returningCustomers: 0,
    highValueCustomers: 0,
    customerGrowth: []
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const [customersRes, transactionsRes] = await Promise.all([
        customersAPI.getAll(),
        transactionsAPI.getAll()
      ]);

      const customersData = customersRes.data?.data || [];
      const transactionsData = transactionsRes.data?.data || [];

      setCustomers(customersData);

      // Calculate statistics
      const totalCustomers = customersData.length;
      const topCustomers = customersData
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 5);
      
      const totalRevenue = customersData.reduce((sum, customer) => sum + customer.total_spent, 0);
      const averageSpending = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

      setStats({
        totalCustomers,
        topCustomers,
        averageSpending,
        totalRevenue
      });

      // Calculate advanced analytics
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const newCustomers = customersData.filter(c => 
        new Date(c.created_at || c.last_visit) > thirtyDaysAgo
      ).length;
      
      const returningCustomers = customersData.filter(c => c.visit_count > 1).length;
      const highValueCustomers = customersData.filter(c => c.total_spent > 500).length;
      
      // Customer growth over last 7 days
      const customerGrowth = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const dayCustomers = customersData.filter(c => {
          const customerDate = new Date(c.created_at || c.last_visit);
          return customerDate >= dayStart && customerDate < dayEnd;
        }).length;
        
        customerGrowth.push({
          date: dayStart.toLocaleDateString(),
          count: dayCustomers
        });
      }

      setCustomerAnalytics({
        newCustomers,
        returningCustomers,
        highValueCustomers,
        customerGrowth
      });

    } catch (error) {
      console.error('Error fetching customers:', error);
      // Fallback data
      const fallbackCustomers = [
        { id: 1, name: "John Doe", email: "john@email.com", phone: "+91 9876543210", total_spent: 235.0, visit_count: 5, created_at: new Date().toISOString() },
        { id: 2, name: "Jane Smith", email: "jane@email.com", phone: "+91 9876543211", total_spent: 150.0, visit_count: 3, created_at: new Date().toISOString() },
        { id: 3, name: "Bob Wilson", email: "bob@email.com", phone: "+91 9876543212", total_spent: 320.0, visit_count: 7, created_at: new Date().toISOString() }
      ];
      setCustomers(fallbackCustomers);
      setStats({
        totalCustomers: fallbackCustomers.length,
        topCustomers: fallbackCustomers.slice(0, 3),
        averageSpending: fallbackCustomers.reduce((sum, c) => sum + c.total_spent, 0) / fallbackCustomers.length,
        totalRevenue: fallbackCustomers.reduce((sum, c) => sum + c.total_spent, 0)
      });
    } finally {
      setLoading(false);
    }
  };

  const addNewCustomer = async () => {
    try {
      await customersAPI.create(newCustomer);
      setNewCustomer({ name: '', email: '', phone: '' });
      setShowAddModal(false);
      fetchCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  const exportData = (format) => {
    const dataToExport = filteredCustomers.map(customer => ({
      Name: customer.name,
      Email: customer.email,
      Phone: customer.phone || 'N/A',
      'Total Spent': customer.total_spent,
      'Visit Count': customer.visit_count,
      'Average Order': customer.visit_count > 0 ? (customer.total_spent / customer.visit_count).toFixed(2) : 0,
      'Last Visit': customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'
    }));

    if (format === 'csv') {
      const csvContent = [
        Object.keys(dataToExport[0]).join(','),
        ...dataToExport.map(row => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (format === 'json') {
      const jsonContent = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const generateCustomerReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalCustomers: stats.totalCustomers,
        totalRevenue: stats.totalRevenue,
        averageSpending: stats.averageSpending,
        newCustomers: customerAnalytics.newCustomers,
        returningCustomers: customerAnalytics.returningCustomers,
        highValueCustomers: customerAnalytics.highValueCustomers
      },
      topCustomers: stats.topCustomers,
      customerGrowth: customerAnalytics.customerGrowth,
      filteredResults: filteredCustomers.length
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredCustomers = customers.filter(customer => {
    // Search filter
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm));
    
    if (!matchesSearch) return false;
    
    // Category filter
    switch (filterBy) {
      case 'high-value':
        return customer.total_spent > 500;
      case 'new':
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return new Date(customer.created_at || customer.last_visit) > thirtyDaysAgo;
      case 'frequent':
        return customer.visit_count > 3;
      default:
        return true;
    }
  }).sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'visit_count':
        aValue = a.visit_count;
        bValue = b.visit_count;
        break;
      case 'last_visit':
        aValue = new Date(a.created_at || a.last_visit);
        bValue = new Date(b.created_at || b.last_visit);
        break;
      default: // total_spent
        aValue = a.total_spent;
        bValue = b.total_spent;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading Customers...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header with Quick Actions */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <h1 style={{ margin: 0, color: '#2c3e50' }}>👥 Customer Management</h1>
        
        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setShowAddModal(true)}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            ➕ Add Customer
          </button>
          
          <button 
            onClick={fetchCustomers}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            ⟲ Refresh All Data
          </button>
          
          <button 
            onClick={() => setShowReportsModal(true)}
            style={{
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            ◉ View Reports
          </button>
          
          <button 
            onClick={() => setShowExportModal(true)}
            style={{
              background: '#6f42c1',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            ⬇ Export Data
          </button>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6c757d', fontWeight: 'bold' }}>👥 Total Customers</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#007bff' }}>{stats.totalCustomers}</p>
          <p style={{ fontSize: '12px', color: '#6c757d', margin: '5px 0 0 0' }}>
            {customerAnalytics.newCustomers} new this month
          </p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6c757d', fontWeight: 'bold' }}>$ Total Revenue</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#28a745' }}>₹{stats.totalRevenue.toFixed(0)}</p>
          <p style={{ fontSize: '12px', color: '#6c757d', margin: '5px 0 0 0' }}>
            From {stats.totalCustomers} customers
          </p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6c757d', fontWeight: 'bold' }}>◉ Avg Spending</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#ffc107' }}>₹{stats.averageSpending.toFixed(0)}</p>
          <p style={{ fontSize: '12px', color: '#6c757d', margin: '5px 0 0 0' }}>
            Per customer
          </p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6c757d', fontWeight: 'bold' }}>★ High Value</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#dc3545' }}>{customerAnalytics.highValueCustomers}</p>
            <p style={{ fontSize: '12px', color: '#6c757d', margin: '5px 0 0 0' }}>
              Customers &gt; ₹500
            </p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6c757d', fontWeight: 'bold' }}>⟲ Returning</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#17a2b8' }}>{customerAnalytics.returningCustomers}</p>
          <p style={{ fontSize: '12px', color: '#6c757d', margin: '5px 0 0 0' }}>
            Repeat customers
          </p>
        </div>
      </div>

      {/* Top Customers */}
      {stats.topCustomers.length > 0 && (
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Top Customers</h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {stats.topCustomers.map((customer, index) => (
              <div key={customer.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    background: '#3b82f6',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    #{index + 1}
                  </span>
                  <div>
                    <div style={{ fontWeight: '600' }}>{customer.name}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{customer.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  <span>{customer.visit_count} visits</span>
                  <span style={{ fontWeight: '600', color: '#059669' }}>₹{customer.total_spent}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Search and Filter Controls */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          {/* Search */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>🔍 Search</label>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>📂 Filter</label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="all">All Customers</option>
              <option value="high-value">High Value (&gt;₹500)</option>
              <option value="new">New Customers (30 days)</option>
              <option value="frequent">Frequent Visitors (3+ visits)</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>◉ Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="total_spent">Total Spent</option>
              <option value="name">Name</option>
              <option value="visit_count">Visit Count</option>
              <option value="last_visit">Last Visit</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>⟲ Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
        
        <div style={{ marginTop: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '6px', fontSize: '14px', color: '#6c757d' }}>
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Name</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Contact</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Total Spent</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Visits</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Avg Order</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Last Visit</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '1rem', fontWeight: '600' }}>{customer.name}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.875rem' }}>
                    <div>{customer.email}</div>
                    {customer.phone && (
                      <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>{customer.phone}</div>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem', fontWeight: '600', color: '#059669' }}>₹{customer.total_spent}</td>
                <td style={{ padding: '1rem' }}>{customer.visit_count}</td>
                <td style={{ padding: '1rem', color: '#6b7280' }}>
                  ₹{customer.visit_count > 0 ? (customer.total_spent / customer.visit_count).toFixed(0) : 0}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '0',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0 }}>Add New Customer</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Full Name</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                  placeholder="Enter customer name"
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                  placeholder="customer@email.com"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Phone Number</label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>
            <div style={{
              padding: '1.5rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={addNewCustomer}
                style={{
                  background: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Add Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '10px',
            padding: '20px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>⬇ Export Customer Data</h3>
            <p style={{ margin: '0 0 20px 0', color: '#6c757d' }}>
              Choose format to export {filteredCustomers.length} customers
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => { exportData('csv'); setShowExportModal(false); }}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Export CSV
              </button>
              <button
                onClick={() => { exportData('json'); setShowExportModal(false); }}
                style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Export JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {showReportsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '10px',
            padding: '20px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>◉ Customer Analytics Report</h3>
            
            {/* Customer Growth Chart */}
            <div style={{ marginBottom: '20px' }}>
              <h4>▲ Customer Growth (Last 7 Days)</h4>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'end', height: '100px', marginTop: '10px' }}>
                {customerAnalytics.customerGrowth.map((day, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{
                      background: '#007bff',
                      height: `${Math.max(day.count * 10, 5)}px`,
                      width: '100%',
                      borderRadius: '4px 4px 0 0',
                      marginBottom: '5px'
                    }}></div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>{day.date}</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{day.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>{stats.totalCustomers}</div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>Total Customers</div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>₹{stats.totalRevenue.toFixed(0)}</div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>Total Revenue</div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>{customerAnalytics.highValueCustomers}</div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>High Value</div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>{customerAnalytics.returningCustomers}</div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>Returning</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowReportsModal(false)}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={() => { generateCustomerReport(); setShowReportsModal(false); }}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Download Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManager;