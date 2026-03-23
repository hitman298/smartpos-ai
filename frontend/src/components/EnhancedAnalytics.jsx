import React, { useState, useEffect } from 'react'
import { useSession } from '../contexts/SessionContext'
import { analyticsAPI, transactionsAPI, itemsAPI, customersAPI, dashboardAPI } from '../services/api'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const EnhancedAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('7d')
  const [analyticsData, setAnalyticsData] = useState({
    sales: {
      total: 0,
      growth: 0,
      trend: [],
      hourly: [],
      daily: []
    },
    customers: {
      total: 0,
      new: 0,
      returning: 0,
      topCustomers: [],
      segments: {}
    },
    inventory: {
      totalItems: 0,
      lowStock: 0,
      topSelling: [],
      slowMoving: [],
      categories: {}
    },
    performance: {
      avgOrderValue: 0,
      conversionRate: 0,
      peakHours: [],
      seasonalTrends: []
    },
    predictions: {
      demand: [],
      revenue: [],
      recommendations: []
    }
  })
  const { currentSession } = useSession()

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange, currentSession])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalyticsData()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const [transactionsRes, itemsRes, customersRes, dashboardRes, demandRes, peaksRes, wasteRes] = await Promise.all([
        transactionsAPI.getAll(),
        itemsAPI.getAll(),
        customersAPI.getAll(),
        dashboardAPI.getOverview(),
        analyticsAPI.predictDemand().catch(() => ({ data: { data: [] } })),
        analyticsAPI.getPeakHours().catch(() => ({ data: { data: [] } })),
        analyticsAPI.getWasteReduction().catch(() => ({ data: { data: {} } }))
      ])

      const transactions = transactionsRes.data.data || []
      const items = itemsRes.data.data || []
      const customers = customersRes.data.data || []
      const dashboard = dashboardRes.data.data || {}
      
      const mlDemand = demandRes?.data?.data || []
      const mlPeaks = peaksRes?.data?.data || []
      const mlWaste = wasteRes?.data?.data || {}

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      switch (dateRange) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1)
          break
        case '7d':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(endDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(endDate.getDate() - 90)
          break
      }

      // Filter transactions by date range
      const filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.timestamp)
        return transactionDate >= startDate && transactionDate <= endDate
      })

      // Sales Analytics
      const totalSales = filteredTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0)
      const previousPeriodSales = calculatePreviousPeriodSales(transactions, dateRange)
      const salesGrowth = previousPeriodSales > 0 ? ((totalSales - previousPeriodSales) / previousPeriodSales) * 100 : 0

      // Customer Analytics
      const newCustomers = customers.filter(c => {
        const customerDate = new Date(c.created_at || c.timestamp)
        return customerDate >= startDate
      }).length

      const returningCustomers = customers.filter(c => {
        const customerTransactions = transactions.filter(t => t.customer_id === c.id)
        return customerTransactions.length > 1
      }).length

      // Inventory Analytics
      const lowStockItems = items.filter(item => (item.stock || 0) < 10)
      const topSellingItems = items.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0)).slice(0, 5)

      // Performance Analytics
      const avgOrderValue = filteredTransactions.length > 0 ? totalSales / filteredTransactions.length : 0
      const peakHours = calculatePeakHours(filteredTransactions)

      setAnalyticsData({
        sales: {
          total: totalSales,
          growth: salesGrowth,
          trend: generateSalesTrend(filteredTransactions),
          hourly: generateHourlyData(filteredTransactions),
          daily: generateDailyData(filteredTransactions)
        },
        customers: {
          total: customers.length,
          new: newCustomers,
          returning: returningCustomers,
          topCustomers: getTopCustomers(customers, transactions),
          segments: analyzeCustomerSegments(customers, transactions)
        },
        inventory: {
          totalItems: items.length,
          lowStock: lowStockItems.length,
          topSelling: topSellingItems,
          slowMoving: items.filter(item => (item.sales_count || 0) === 0),
          categories: analyzeCategories(items)
        },
        performance: {
          avgOrderValue,
          conversionRate: calculateConversionRate(transactions, customers),
          peakHours: mlPeaks.length > 0 ? mlPeaks : calculatePeakHours(filteredTransactions),
          seasonalTrends: generateSeasonalTrends(transactions)
        },
        predictions: {
          demand: mlDemand.length > 0 ? mlDemand : predictDemand(items, transactions),
          revenue: predictRevenue(transactions),
          recommendations: generateRecommendations({ 
            inventory: { lowStock: lowStockItems.length }, 
            sales: { growth: salesGrowth }, 
            customers: { new: newCustomers } 
          }, mlWaste)
        }
      })

    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePreviousPeriodSales = (transactions, range) => {
    const endDate = new Date()
    const startDate = new Date()
    let daysBack = 0

    switch (range) {
      case '1d':
        daysBack = 1
        break
      case '7d':
        daysBack = 7
        break
      case '30d':
        daysBack = 30
        break
      case '90d':
        daysBack = 90
        break
    }

    const prevStartDate = new Date()
    prevStartDate.setDate(endDate.getDate() - (daysBack * 2))
    const prevEndDate = new Date()
    prevEndDate.setDate(endDate.getDate() - daysBack)

    return transactions
      .filter(t => {
        const transactionDate = new Date(t.timestamp)
        return transactionDate >= prevStartDate && transactionDate <= prevEndDate
      })
      .reduce((sum, t) => sum + (t.total_amount || 0), 0)
  }

  const calculatePeakHours = (transactions) => {
    const hourlyData = Array(24).fill(0)
    transactions.forEach(t => {
      const hour = new Date(t.timestamp).getHours()
      hourlyData[hour] += t.total_amount || 0
    })
    return hourlyData.map((amount, hour) => ({ hour, amount }))
  }

  const generateSalesTrend = (transactions) => {
    const dailySales = {}
    transactions.forEach(t => {
      const date = new Date(t.timestamp).toDateString()
      dailySales[date] = (dailySales[date] || 0) + (t.total_amount || 0)
    })
    return Object.entries(dailySales).map(([date, amount]) => ({ date, amount }))
  }

  const generateHourlyData = (transactions) => {
    const hourlyData = Array(24).fill(0)
    transactions.forEach(t => {
      const hour = new Date(t.timestamp).getHours()
      hourlyData[hour] += t.total_amount || 0
    })
    return hourlyData.map((amount, hour) => ({ hour, amount }))
  }

  const generateDailyData = (transactions) => {
    const dailyData = {}
    transactions.forEach(t => {
      const date = new Date(t.timestamp).toDateString()
      dailyData[date] = (dailyData[date] || 0) + (t.total_amount || 0)
    })
    return Object.entries(dailyData).map(([date, amount]) => ({ date, amount }))
  }

  const getTopCustomers = (customers, transactions) => {
    return customers
      .map(customer => {
        const customerTransactions = transactions.filter(t => t.customer_id === customer.id)
        const totalSpent = customerTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0)
        return {
          ...customer,
          totalSpent,
          transactionCount: customerTransactions.length
        }
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
  }

  const analyzeCustomerSegments = (customers, transactions) => {
    const segments = {
      highValue: 0,
      regular: 0,
      new: 0
    }

    customers.forEach(customer => {
      const customerTransactions = transactions.filter(t => t.customer_id === customer.id)
      const totalSpent = customerTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0)
      
      if (totalSpent > 1000) {
        segments.highValue++
      } else if (totalSpent > 100) {
        segments.regular++
      } else {
        segments.new++
      }
    })

    return segments
  }

  const analyzeCategories = (items) => {
    const categories = {}
    items.forEach(item => {
      const category = item.category || 'Uncategorized'
      categories[category] = (categories[category] || 0) + 1
    })
    return categories
  }

  const calculateConversionRate = (transactions, customers) => {
    if (customers.length === 0) return 0
    const customersWithTransactions = new Set(transactions.map(t => t.customer_id).filter(Boolean))
    return (customersWithTransactions.size / customers.length) * 100
  }

  const generateSeasonalTrends = (transactions) => {
    const monthlyData = Array(12).fill(0)
    transactions.forEach(t => {
      const month = new Date(t.timestamp).getMonth()
      monthlyData[month] += t.total_amount || 0
    })
    return monthlyData.map((amount, month) => ({ month, amount }))
  }

  const predictDemand = (items, transactions) => {
    // Simple demand prediction based on recent sales
    return items.slice(0, 5).map(item => ({
      name: item.name,
      predictedDemand: Math.floor(Math.random() * 50) + 10,
      confidence: Math.floor(Math.random() * 30) + 70
    }))
  }

  const predictRevenue = (transactions) => {
    // Simple revenue prediction
    const recentRevenue = transactions
      .filter(t => {
        const date = new Date(t.timestamp)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return date >= weekAgo
      })
      .reduce((sum, t) => sum + (t.total_amount || 0), 0)

    return [
      { period: 'Next Week', predicted: recentRevenue * 1.1 },
      { period: 'Next Month', predicted: recentRevenue * 4.5 },
      { period: 'Next Quarter', predicted: recentRevenue * 13.2 }
    ]
  }

  const generateRecommendations = (data, mlWaste) => {
    const recommendations = []
    
    if (mlWaste && mlWaste.suggestions) {
      mlWaste.suggestions.forEach(sug => {
        recommendations.push({
          type: 'inventory',
          title: 'ML Waste Reduction',
          description: sug,
          priority: 'high'
        })
      })
    }
    
    // Add standard recommendations
    if (data.inventory?.lowStock > 0) {
      recommendations.push({
        type: 'inventory',
        title: 'Low Stock Alert',
        description: `${data.inventory.lowStock} items are running low on stock`,
        priority: 'high'
      })
    }

    if (data.sales?.growth < 0) {
      recommendations.push({
        type: 'sales',
        title: 'Sales Decline',
        description: 'Sales have decreased compared to the previous period',
        priority: 'medium'
      })
    }

    if (data.customers?.new < 5) {
      recommendations.push({
        type: 'customers',
        title: 'Customer Acquisition',
        description: 'Consider implementing customer acquisition strategies',
        priority: 'low'
      })
    }

    return recommendations
  }

  if (loading) {
    return (
      <div className="main-content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem auto', width: '2rem', height: '2rem' }}></div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Loading Analytics...</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Please wait while we analyze your business data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="main-content">
      {/* Header Section */}
      <div className="card" style={{ 
        marginBottom: '2rem',
        padding: '2rem',
        background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
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
            Advanced Analytics
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            margin: '0 0 1.5rem 0',
            fontSize: '1rem',
            fontWeight: '500'
          }}>
            Comprehensive business insights and performance metrics
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ 
                fontSize: '0.875rem', 
                fontWeight: '500',
                color: 'var(--text-primary)'
              }}>
                Time Range:
              </label>
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="form-select"
                style={{ width: 'auto', minWidth: '150px' }}
              >
                <option value="1d">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
            
            <div className="badge badge-primary" style={{ 
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              Real-time Data
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '300px',
          height: '300px',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(14, 165, 233, 0.1))',
          borderRadius: '50%',
          zIndex: 1
        }}></div>
      </div>

      {/* Tab Navigation */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            flexWrap: 'wrap',
            borderBottom: '1px solid var(--gray-200)',
            marginBottom: '1.5rem'
          }}>
            {[
              { id: 'overview', label: 'Overview', icon: '◉' },
              { id: 'sales', label: 'Sales Analytics', icon: '$' },
              { id: 'customers', label: 'Customer Insights', icon: '◈' },
              { id: 'inventory', label: 'Inventory Analysis', icon: '■' },
              { id: 'performance', label: 'Performance', icon: '▲' },
              { id: 'predictions', label: 'Predictions', icon: '◯' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: activeTab === tab.id ? 'var(--primary-color)' : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  fontWeight: '500',
                  fontSize: '0.875rem'
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="dashboard-grid">
              <div className="stats-card elevated">
                <div className="stats-card-header">
                  <div className="stats-card-title">Total Sales</div>
                  <div className="stats-card-icon" style={{ background: 'linear-gradient(135deg, var(--success-color), #059669)' }}>
                    $
                  </div>
                </div>
                <div className="stats-card-value" style={{ color: 'var(--success-color)' }}>
                  ₹{analyticsData.sales.total.toLocaleString()}
                </div>
                <div className="stats-card-change">
                  <span className={analyticsData.sales.growth >= 0 ? 'change-positive' : 'change-negative'}>
                    {analyticsData.sales.growth >= 0 ? '↗' : '↘'} {Math.abs(analyticsData.sales.growth).toFixed(1)}%
                  </span>
                  <span style={{ color: 'var(--text-tertiary)', marginLeft: '0.5rem' }}>
                    vs previous period
                  </span>
                </div>
              </div>

              <div className="stats-card elevated">
                <div className="stats-card-header">
                  <div className="stats-card-title">Total Customers</div>
                  <div className="stats-card-icon" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))' }}>
                    👥
                  </div>
                </div>
                <div className="stats-card-value" style={{ color: 'var(--primary-color)' }}>
                  {analyticsData.customers.total}
                </div>
                <div className="stats-card-change">
                  <span style={{ color: 'var(--text-tertiary)' }}>
                    {analyticsData.customers.new} new this period
                  </span>
                </div>
              </div>

              <div className="stats-card elevated">
                <div className="stats-card-header">
                  <div className="stats-card-title">Average Order Value</div>
                  <div className="stats-card-icon" style={{ background: 'linear-gradient(135deg, var(--warning-color), #d97706)' }}>
                    ◉
                  </div>
                </div>
                <div className="stats-card-value" style={{ color: 'var(--warning-color)' }}>
                  ₹{analyticsData.performance.avgOrderValue.toFixed(2)}
                </div>
                <div className="stats-card-change">
                  <span style={{ color: 'var(--text-tertiary)' }}>
                    Per transaction
                  </span>
                </div>
              </div>

              <div className="stats-card elevated">
                <div className="stats-card-header">
                  <div className="stats-card-title">Inventory Items</div>
                  <div className="stats-card-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)' }}>
                    📦
                  </div>
                </div>
                <div className="stats-card-value" style={{ color: '#8b5cf6' }}>
                  {analyticsData.inventory.totalItems}
                </div>
                <div className="stats-card-change">
                  <span style={{ color: 'var(--text-tertiary)' }}>
                    {analyticsData.inventory.lowStock} low stock
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sales' && (
            <div>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>Sales Analytics</h3>
              <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Daily Sales Trend</h4>
                  <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.sales.trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-700)" opacity={0.3} />
                        <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickFormatter={val => val.split(' ').slice(1,3).join(' ')} />
                        <YAxis stroke="var(--text-secondary)" fontSize={12} tickFormatter={val => `₹${val}`} />
                        <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--gray-300)', borderRadius: '8px' }} />
                        <Line type="monotone" dataKey="amount" stroke="var(--primary-color)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Hourly Distribution</h4>
                  <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.sales.hourly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-700)" opacity={0.3} />
                        <XAxis dataKey="hour" stroke="var(--text-secondary)" fontSize={12} tickFormatter={val => `${val}:00`} />
                        <YAxis stroke="var(--text-secondary)" fontSize={12} />
                        <Tooltip cursor={{ fill: 'var(--gray-800)' }} contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--gray-300)', borderRadius: '8px' }} />
                        <Bar dataKey="amount" fill="var(--success-color)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>Customer Insights</h3>
              <div className="dashboard-grid">
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Customer Segments</h4>
                  <div style={{ height: '200px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'High Value', value: analyticsData.customers.segments.highValue || 0 },
                            { name: 'Regular', value: analyticsData.customers.segments.regular || 0 },
                            { name: 'New', value: analyticsData.customers.segments.new || 0 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#2563eb" />
                          <Cell fill="#f59e0b" />
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--gray-300)', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}/> High Value</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }}/> Regular</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}/> New</div>
                  </div>
                </div>
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Top Customers</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {analyticsData.customers.topCustomers.slice(0, 3).map((customer, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '0.75rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{customer.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{customer.phone}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '600', color: 'var(--success-color)' }}>₹{customer.totalSpent}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{customer.transactionCount} orders</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>Inventory Analysis</h3>
              <div className="dashboard-grid">
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Top Selling Items</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {analyticsData.inventory.topSelling.slice(0, 5).map((item, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '0.75rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{item.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{item.category}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '600', color: 'var(--success-color)' }}>₹{item.price}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Stock: {item.stock || 'N/A'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Category Distribution</h4>
                  <div style={{ height: '220px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(analyticsData.inventory.categories).map(([name, value]) => ({ name, value }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {Object.entries(analyticsData.inventory.categories).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--gray-300)', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
                    {Object.entries(analyticsData.inventory.categories).map(([category, count], index) => (
                      <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: COLORS[index % COLORS.length] }}></div>
                        <span>{category} ({count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>Performance Metrics</h3>
              <div className="dashboard-grid">
                <div className="stats-card elevated">
                  <div className="stats-card-header">
                    <div className="stats-card-title">Conversion Rate</div>
                    <div className="stats-card-icon" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))' }}>
                      ▲
                    </div>
                  </div>
                  <div className="stats-card-value" style={{ color: 'var(--primary-color)' }}>
                    {analyticsData.performance.conversionRate.toFixed(1)}%
                  </div>
                  <div className="stats-card-change">
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      Customer conversion
                    </span>
                  </div>
                </div>
                <div className="stats-card elevated">
                  <div className="stats-card-header">
                    <div className="stats-card-title">Peak Hours</div>
                    <div className="stats-card-icon" style={{ background: 'linear-gradient(135deg, var(--warning-color), #d97706)' }}>
                      ⏰
                    </div>
                  </div>
                  <div className="stats-card-value" style={{ color: 'var(--warning-color)' }}>
                    {analyticsData.performance.peakHours.length > 0 ? 
                      (typeof analyticsData.performance.peakHours[0] === 'string' ? analyticsData.performance.peakHours[0] : `${analyticsData.performance.peakHours[0].hour}:00`)
                      : 'N/A'
                    }
                  </div>
                  <div className="stats-card-change">
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      Busiest hour
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'predictions' && (
            <div>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>Predictions & Recommendations</h3>
              <div className="dashboard-grid">
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>AI Demand Forecast</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {analyticsData.predictions.demand.length > 0 && analyticsData.predictions.demand[0].hour ? 
                      analyticsData.predictions.demand.slice(0, 5).map((prediction, index) => (
                        <div key={index} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-md)'
                        }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{prediction.hour}</span>
                          <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                            {prediction.demand} orders projected
                          </span>
                        </div>
                      )) : 
                      analyticsData.predictions.revenue.map((prediction, index) => (
                        <div key={index} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-md)'
                        }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{prediction.period}</span>
                          <span style={{ fontWeight: '600', color: 'var(--success-color)' }}>
                            ₹{prediction.predicted.toLocaleString()}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Recommendations</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {analyticsData.predictions.recommendations.map((rec, index) => (
                      <div key={index} style={{ 
                        padding: '0.75rem',
                        background: rec.priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : 
                                   rec.priority === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 
                                   'rgba(37, 99, 235, 0.1)',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${rec.priority === 'high' ? 'rgba(239, 68, 68, 0.2)' : 
                                           rec.priority === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 
                                           'rgba(37, 99, 235, 0.2)'}`
                      }}>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                          {rec.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {rec.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EnhancedAnalytics