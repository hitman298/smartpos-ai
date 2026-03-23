import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Clock, User, CheckCircle, LogOut } from 'lucide-react';
import { employeesAPI } from '../services/api';

const MOCK_SHIFTS = [
  { id: '1', employee: 'John Manager', role: 'Manager', status: 'active', timeIn: '08:00 AM', sales: 4500.50 },
  { id: '2', employee: 'Jane Cashier', role: 'Cashier', status: 'active', timeIn: '09:30 AM', sales: 2150.00 },
  { id: '3', employee: 'Mike Chef', role: 'Chef', status: 'completed', timeIn: '06:00 AM', timeOut: '14:00 PM', sales: 0 },
];

const ShiftManager = () => {
  const [shifts, setShifts] = useState(MOCK_SHIFTS);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [employeesList, setEmployeesList] = useState([]);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState('Cashier');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    loadEmployees();
    return () => clearInterval(timer);
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await employeesAPI.getAll();
      const list = response.data?.data || [];
      if (list.length > 0) {
        setEmployeesList(list);
        setNewEmployeeName(list[0].name);
        setNewEmployeeRole(list[0].role);
      } else {
        const mockList = [
          { name: 'John Manager', role: 'Manager' },
          { name: 'Jane Cashier', role: 'Cashier' },
          { name: 'Mike Chef', role: 'Chef' },
          { name: 'Sarah Server', role: 'Server' }
        ];
        setEmployeesList(mockList);
        setNewEmployeeName(mockList[0].name);
        setNewEmployeeRole(mockList[0].role);
      }
    } catch (error) {
      console.error('Failed to load employees for clock in:', error);
      const mockList = [
        { name: 'John Manager', role: 'Manager' },
        { name: 'Jane Cashier', role: 'Cashier' },
        { name: 'Mike Chef', role: 'Chef' },
        { name: 'Sarah Server', role: 'Server' }
      ];
      setEmployeesList(mockList);
      setNewEmployeeName(mockList[0].name);
      setNewEmployeeRole(mockList[0].role);
    }
  };

  const handleClockOut = (id) => {
    setShifts(shifts.map(shift => 
      shift.id === id 
        ? { ...shift, status: 'completed', timeOut: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        : shift
    ));
  };

  const handleClockIn = (e) => {
    e.preventDefault();
    if (!newEmployeeName.trim()) return;

    const newShift = {
      id: Math.random().toString(36).substr(2, 9),
      employee: newEmployeeName,
      role: newEmployeeRole,
      status: 'active',
      timeIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sales: 0
    };

    setShifts([...shifts, newShift]);
    setNewEmployeeName('');
    setShowModal(false);
  };

  const activeShifts = shifts.filter(s => s.status === 'active');
  const pastShifts = shifts.filter(s => s.status === 'completed');

  return (
    <div className="main-content">
      <div className="card" style={{ 
        marginBottom: '2rem',
        padding: '2rem',
        background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
              Shift Management
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: '0', fontSize: '1rem' }}>
              Track employee hours and shift performance
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: '2rem', color: 'var(--primary-color)', fontFamily: 'monospace' }}>
              {currentTime.toLocaleTimeString()}
            </h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Active Shifts */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Clock size={24} className="text-success" />
            Active Shifts ({activeShifts.length})
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeShifts.map((shift, i) => (
              <motion.div 
                key={shift.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{ 
                  padding: '1.25rem', 
                  border: '1px solid var(--success-color)', 
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(16, 185, 129, 0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem', color: 'var(--text-primary)' }}>{shift.employee}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <span className="badge badge-primary">{shift.role}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={14} /> In: {shift.timeIn}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>₹{shift.sales.toFixed(2)}</span>
                  <button 
                    onClick={() => handleClockOut(shift.id)}
                    className="btn-error" 
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <LogOut size={14} /> Clock Out
                  </button>
                </div>
              </motion.div>
            ))}
            
            {activeShifts.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                No active shifts
              </div>
            )}
            
            <button 
              onClick={() => setShowModal(true)}
              className="btn-primary" 
              style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', width: '100%' }}
            >
              <User size={18} /> Clock In Employee
            </button>
          </div>
        </div>

        {/* Completed Shifts */}
        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <CheckCircle size={24} />
            Completed Today ({pastShifts.length})
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pastShifts.map((shift, i) => (
              <motion.div 
                key={shift.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                  padding: '1rem', 
                  border: '1px solid var(--gray-300)', 
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-primary)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{shift.employee}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>#{shift.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                  <span>{shift.timeIn} - {shift.timeOut}</span>
                  <span>Sales: ₹{shift.sales.toFixed(2)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Clock In Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Clock In Employee</h2>
            <form onSubmit={handleClockIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Select Employee</label>
                <select 
                  value={newEmployeeName}
                  onChange={(e) => {
                    const name = e.target.value;
                    setNewEmployeeName(name);
                    const emp = employeesList.find(emp => emp.name === name);
                    if (emp) setNewEmployeeRole(emp.role);
                  }}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-300)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  {employeesList.map((emp, idx) => (
                    <option key={idx} value={emp.name}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Clock In</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftManager;
