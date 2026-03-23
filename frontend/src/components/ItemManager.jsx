import React, { useState, useEffect } from 'react';
import { itemsAPI } from '../services/api';

const ItemManager = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    stock: ''
  });

  const categories = [
    'Beverages', 'Snacks', 'Dairy', 'Tea', 'Coffee', 'Mocktails', 
    'Herbal Tea', 'Food', 'Desserts', 'Other'
  ];

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getAll();
      setItems(response.data.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching items:', error);
      setError('Failed to load items');
      // Fallback data
      setItems([
        { id: 1, name: "Tea", price: 20.0, category: "Beverage", stock: 50 },
        { id: 2, name: "Samosa", price: 15.0, category: "Snack", stock: 45 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const itemData = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock)
      };

      if (editingItem) {
        // Update existing item
        await itemsAPI.update(editingItem.id, itemData);
        setEditingItem(null);
      } else {
        // Create new item
        await itemsAPI.create(itemData);
      }

      // Reset form
      setFormData({ name: '', price: '', category: '', stock: '' });
      setShowAddForm(false);
      
      // Refresh items list
      await fetchItems();
      
    } catch (error) {
      console.error('Error saving item:', error);
      setError('Failed to save item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      stock: item.stock.toString()
    });
    setShowAddForm(true);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await itemsAPI.delete(itemId);
        await fetchItems();
      } catch (error) {
        console.error('Error deleting item:', error);
        setError('Failed to delete item');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', category: '', stock: '' });
    setEditingItem(null);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading Items...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, color: '#2c3e50' }}>📦 Items Management</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowAddForm(true)}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ➕ Add New Item
          </button>
          <button 
            onClick={fetchItems}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ⟲ Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          padding: '15px',
          borderRadius: '8px',
          color: '#dc2626',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>
            {editingItem ? '✏ Edit Item' : '+ Add New Item'}
          </h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Item Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                placeholder="Enter item name"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Price (₹)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                placeholder="Enter price"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Stock Quantity</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                required
                min="0"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                placeholder="Enter stock quantity"
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items Table */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e9ecef' }}>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>■ Items List ({items.length} items)</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Name</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Price</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Category</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Stock</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Status</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{item.name}</td>
                  <td style={{ padding: '15px', color: '#28a745', fontWeight: 'bold' }}>₹{item.price}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{
                      background: '#e3f2fd',
                      color: '#1976d2',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {item.category}
                    </span>
                  </td>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{item.stock}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{
                      background: item.stock > 10 ? '#d4edda' : '#f8d7da',
                      color: item.stock > 10 ? '#155724' : '#721c24',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {item.stock > 10 ? 'In Stock' : 'Low Stock'}
                    </span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleEdit(item)}
                        style={{
                          background: '#ffc107',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        ✏ Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        × Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ItemManager;