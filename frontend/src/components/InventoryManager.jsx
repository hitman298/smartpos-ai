import React, { useState, useEffect } from 'react';
import { inventoryAPI, itemsAPI, transactionsAPI } from '../services/api';

const InventoryManager = () => {
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    price: 0,
    category: 'General',
    stock: 0,
    min_stock: 10
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [inventoryRes, alertsRes, itemsRes] = await Promise.all([
        inventoryAPI.getAll(),
        inventoryAPI.getAlerts(),
        itemsAPI.getAll()
      ]);

      const inventoryData = inventoryRes.data.data || [];
      const alertsData = alertsRes.data.data || [];
      const itemsData = itemsRes.data.data || [];

      setInventory(inventoryData);
      setAlerts(alertsData);

      // Calculate statistics
      const totalItems = itemsData.length;
      const lowStockItems = inventoryData.filter(item => item.stock <= (item.min_stock || 10) && item.stock > 0).length;
      const outOfStockItems = inventoryData.filter(item => item.stock === 0).length;
      const totalValue = itemsData.reduce((sum, item) => sum + (item.price * item.stock), 0);

      setStats({
        totalItems,
        lowStockItems,
        outOfStockItems,
        totalValue
      });

    } catch (error) {
      console.error('Error fetching inventory:', error);
      // Fallback data
      const fallbackInventory = [
        { id: 1, name: "Tea", stock: 50, min_stock: 10, category: "Beverages", price: 15 },
        { id: 2, name: "Samosa", stock: 45, min_stock: 10, category: "Snacks", price: 12 },
        { id: 3, name: "Coffee", stock: 5, min_stock: 10, category: "Beverages", price: 20 }
      ];
      setInventory(fallbackInventory);
      setAlerts(fallbackInventory.filter(item => item.stock <= item.min_stock));
      setStats({
        totalItems: fallbackInventory.length,
        lowStockItems: 1,
        outOfStockItems: 0,
        totalValue: fallbackInventory.reduce((sum, item) => sum + (item.price * item.stock), 0)
      });
    } finally {
      setLoading(false);
    }
  };

  const addNewItem = async () => {
    try {
      await itemsAPI.create(newItem);
      setNewItem({ name: '', price: 0, category: 'General', stock: 0, min_stock: 10 });
      setShowAddModal(false);
      fetchInventory();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const updateStock = async (itemId, newStock) => {
    try {
      await itemsAPI.update(itemId, { stock: newStock });
      fetchInventory();
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading Inventory...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Inventory Management</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setShowAddModal(true)}
            style={{
              background: '#059669',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Add Item
          </button>
          <button 
            onClick={fetchInventory}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#6b7280' }}>Total Items</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: '#3b82f6' }}>{stats.totalItems}</p>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#6b7280' }}>Low Stock</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: '#f59e0b' }}>{stats.lowStockItems}</p>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#6b7280' }}>Out of Stock</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: '#dc2626' }}>{stats.outOfStockItems}</p>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#6b7280' }}>Total Value</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: '#059669' }}>₹{stats.totalValue.toFixed(0)}</p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {alerts.length > 0 && (
        <div style={{
          background: '#fef2f2',
          border: '2px solid #fecaca',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#dc2626' }}>Low Stock Alerts</h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {alerts.map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: 'white',
                borderRadius: '6px',
                border: '1px solid #fecaca'
              }}>
                <div>
                  <span style={{ fontWeight: '600' }}>{item.name}</span>
                  <span style={{ marginLeft: '1rem', color: '#6b7280' }}>
                    {item.stock} left (min: {item.min_stock || 10})
                  </span>
                </div>
                <button 
                  onClick={() => updateStock(item.id, (item.min_stock || 10) + 20)}
                  style={{
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Item</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Category</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Price</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Current Stock</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Min Stock</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '1rem', fontWeight: '600' }}>{item.name}</td>
                <td style={{ padding: '1rem' }}>{item.category || 'General'}</td>
                <td style={{ padding: '1rem' }}>₹{item.price || 0}</td>
                <td style={{ padding: '1rem' }}>
                  <input
                    type="number"
                    value={item.stock}
                    onChange={(e) => updateStock(item.id, parseInt(e.target.value))}
                    style={{
                      width: '80px',
                      padding: '0.25rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}
                  />
                </td>
                <td style={{ padding: '1rem' }}>{item.min_stock || 10}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    background: item.stock === 0 ? '#fee2e2' : item.stock <= (item.min_stock || 10) ? '#fef3c7' : '#dcfce7',
                    color: item.stock === 0 ? '#dc2626' : item.stock <= (item.min_stock || 10) ? '#92400e' : '#166534',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    {item.stock === 0 ? 'Out of Stock' : item.stock <= (item.min_stock || 10) ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <button 
                    onClick={() => updateStock(item.id, (item.min_stock || 10) + 20)}
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Restock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Item Modal */}
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
              <h3 style={{ margin: 0 }}>Add New Item</h3>
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Item Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                  placeholder="Enter item name"
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Price</label>
                <input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                  placeholder="0.00"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Category</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                >
                  <option value="General">General</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Food">Food</option>
                  <option value="Dairy">Dairy</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Initial Stock</label>
                <input
                  type="number"
                  value={newItem.stock}
                  onChange={(e) => setNewItem({...newItem, stock: parseInt(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                  placeholder="0"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Minimum Stock</label>
                <input
                  type="number"
                  value={newItem.min_stock}
                  onChange={(e) => setNewItem({...newItem, min_stock: parseInt(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                  placeholder="10"
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
                onClick={addNewItem}
                style={{
                  background: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;