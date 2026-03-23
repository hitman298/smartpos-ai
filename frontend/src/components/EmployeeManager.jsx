import React, { useState, useEffect } from 'react';
import { employeesAPI } from '../services/api';

const EmployeeManager = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Cashier',
    status: 'active'
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeesAPI.getAll();
      setEmployees(response.data?.data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      setError('Failed to load employees. Please try again.');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const response = await employeesAPI.create(formData);
      if (response.data?.success) {
        alert('Employee saved successfully!');
        setShowModal(false);
        resetForm();
        loadEmployees();
      } else {
        throw new Error('Failed to save employee');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      setError(error.response?.data?.detail || 'Error saving employee. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }
    try {
      setError(null);
      // TODO: Implement delete API when available
      alert('Employee deletion feature coming soon!');
      loadEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      setError('Error deleting employee. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Cashier',
      status: 'active'
    });
    setEditingEmployee(null);
  };

  const openModal = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        role: employee.role || 'Cashier',
        status: employee.status || 'active'
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem auto', width: '2rem', height: '2rem' }}></div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Loading Employees...</h2>
        </div>
      </div>
    );
  }

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
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              Employee Management
            </h1>
            <p style={{ 
              color: 'var(--text-secondary)', 
              margin: '0',
              fontSize: '1rem',
              fontWeight: '500'
            }}>
              Manage your team members and their roles
            </p>
          </div>
          <button 
            onClick={() => openModal()}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem'
            }}
          >
            <span style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>+</span>
            Add Employee
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card" style={{ 
          marginBottom: '2rem',
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: 'var(--error-color)'
          }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>⚠</span>
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              style={{ 
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                color: 'var(--error-color)'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Employees List */}
      <div className="card">
        <div style={{ padding: '1.5rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {employees.map((employee) => (
              <div 
                key={employee.id} 
                className="card elevated"
                style={{
                  padding: '1.5rem',
                  border: '1px solid var(--gray-200)',
                  transition: 'all var(--transition-normal)'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h3 style={{ 
                      margin: '0 0 0.5rem 0', 
                      fontSize: '1.125rem', 
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}>
                      {employee.name}
                    </h3>
                    <div className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
                      {employee.role}
                    </div>
                    <div style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: employee.status === 'active' 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : 'rgba(239, 68, 68, 0.1)',
                      color: employee.status === 'active' 
                        ? 'var(--success-color)' 
                        : 'var(--error-color)',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: employee.status === 'active' 
                          ? 'var(--success-color)' 
                          : 'var(--error-color)'
                      }}></span>
                      {employee.status === 'active' ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
                
                {employee.email && (
                  <p style={{ 
                    margin: '0.5rem 0', 
                    fontSize: '0.875rem', 
                    color: 'var(--text-secondary)' 
                  }}>
                    📧 {employee.email}
                  </p>
                )}
                
                {employee.phone && (
                  <p style={{ 
                    margin: '0.5rem 0', 
                    fontSize: '0.875rem', 
                    color: 'var(--text-secondary)' 
                  }}>
                    📞 {employee.phone}
                  </p>
                )}
                
                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--gray-200)'
                }}>
                  <button
                    onClick={() => openModal(employee)}
                    className="btn-secondary"
                    style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(employee.id)}
                    className="btn-error"
                    style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            
            {employees.length === 0 && (
              <div style={{ 
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '3rem',
                color: 'var(--text-tertiary)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>
                  No Employees Found
                </h3>
                <p style={{ margin: '0 0 1.5rem 0' }}>
                  Add your first employee to get started
                </p>
                <button 
                  onClick={() => openModal()}
                  className="btn-primary"
                >
                  Add Employee
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h3>
              <button 
                className="modal-close"
                onClick={() => { setShowModal(false); resetForm(); }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Employee name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="employee@example.com"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+1234567890"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    required
                  >
                    <option value="Cashier">Cashier</option>
                    <option value="Manager">Manager</option>
                    <option value="Server">Server</option>
                    <option value="Chef">Chef</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 1 }}
                  >
                    {editingEmployee ? 'Update Employee' : 'Add Employee'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManager;

