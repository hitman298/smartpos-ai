import React, { useState, useEffect } from 'react'
import { SessionProvider, useSession } from './contexts/SessionContext'
import { ToastProvider } from './contexts/ToastContext'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import Dashboard from './components/Dashboard'
import ItemManager from './components/ItemManager'
import Billing from './components/Billing'
import Analytics from './components/EnhancedAnalytics'
import SessionManager from './components/SessionManager'
import InventoryManager from './components/InventoryManager'
import CustomerManager from './components/CustomerManager'
import EmployeeManager from './components/EmployeeManager'
import TableManager from './components/TableManager'
import KitchenDisplay from './components/KitchenDisplay'
import ShiftManager from './components/ShiftManager'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Package, Receipt, LineChart, Clock, Boxes, Users, UserCircle, Store, LayoutGrid, ChefHat, CalendarClock, LogOut } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import './App.css'

const AppContent = () => {
  const [currentView, setCurrentView] = useState('dashboard')
  const { user, logout } = useAuth()
  const { isShopOpen, currentSession, openSession, closeSession, loading } = useSession()
  
  // Keyboard shortcuts
  useKeyboardShortcuts(currentView, setCurrentView);

  const allViews = {
    dashboard: { label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    billing: { label: 'Billing', icon: <Receipt size={18} /> },
    tables: { label: 'Tables', icon: <LayoutGrid size={18} /> },
    kitchen: { label: 'Kitchen', icon: <ChefHat size={18} /> },
    items: { label: 'Items', icon: <Package size={18} /> },
    inventory: { label: 'Inventory', icon: <Boxes size={18} /> },
    analytics: { label: 'Analytics', icon: <LineChart size={18} /> },
    customers: { label: 'Customers', icon: <Users size={18} /> },
    employees: { label: 'Employees', icon: <UserCircle size={18} /> },
    shifts: { label: 'Shifts', icon: <CalendarClock size={18} /> },
    sessions: { label: 'Sessions', icon: <Clock size={18} /> }
  }

  const getRoleViews = () => {
    if (!user) return {}
    if (user.role === 'admin') return allViews
    if (user.role === 'cashier') return { 
      dashboard: allViews.dashboard, 
      billing: allViews.billing, 
      tables: allViews.tables, 
      customers: allViews.customers, 
      shifts: allViews.shifts 
    }
    if (user.role === 'kitchen') return { 
      kitchen: allViews.kitchen 
    }
    return {}
  }

  const views = getRoleViews()

  // Ensure current view is valid for role
  useEffect(() => {
    if (user && views && Object.keys(views).length > 0 && !views[currentView]) {
      setCurrentView(Object.keys(views)[0])
    }
  }, [user, currentView, views])

  const handleShopToggle = async () => {
    if (isShopOpen) {
      const result = await closeSession()
      if (result.success) {
        console.log('Shop closed successfully')
      }
    } else {
      const result = await openSession()
      if (result.success) {
        console.log('Shop opened successfully')
        if (result.fallback) {
          console.log('Using fallback session (backend not available)')
        }
      }
    }
  }

  const renderComponent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      case 'billing':
        return <Billing />
      case 'tables':
        return <TableManager />
      case 'kitchen':
        return <KitchenDisplay />
      case 'items':
        return <ItemManager />
      case 'inventory': 
        return <InventoryManager />
      case 'analytics':
        return <Analytics />
      case 'customers': 
        return <CustomerManager />
      case 'employees': 
        return <EmployeeManager />
      case 'shifts':
        return <ShiftManager />
      case 'sessions':
        return <SessionManager />
      default:
        return <Dashboard />
    }
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <a href="#" className="logo">
            <div className="logo-icon"><Store size={24} /></div>
            <span>SmartPOS <span style={{ color: 'var(--primary-color)' }}>Pro</span></span>
          </a>
          <div className="shop-control" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: '1.2' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>{user.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{user.role}</span>
                </div>
                <button onClick={logout} style={{ padding: '0.5rem', background: 'transparent', color: 'var(--error-color)', border: '1px solid rgba(209, 107, 107, 0.2)', boxShadow: 'none' }} title="Logout">
                  <LogOut size={16} />
                </button>
              </div>
            )}
            <button 
              className={`shop-toggle ${isShopOpen ? 'open' : 'closed'}`}
              onClick={handleShopToggle}
              disabled={loading}
              style={{
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" style={{ width: '1rem', height: '1rem', borderTopColor: 'white' }}></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span className={`status-indicator ${isShopOpen ? 'active' : 'inactive'}`}></span>
                  <span>{isShopOpen ? 'Close Shop' : 'Open Shop'}</span>
                </>
              )}
            </button>
            <div className="shop-status">
              <span className={`status-indicator ${isShopOpen ? 'active' : 'inactive'}`}></span>
              {isShopOpen ? 'OPEN' : 'CLOSED'}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav">
        <div className="nav-content">
          {Object.entries(views).map(([key, { label, icon }]) => {
            return (
              <button
                key={key}
                className={`nav-item ${currentView === key ? 'active' : ''}`}
                onClick={() => setCurrentView(key)}
              >
                {icon}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ width: '100%', height: '100%' }}
          >
            {renderComponent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SessionProvider>
          <AppContent />
        </SessionProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App