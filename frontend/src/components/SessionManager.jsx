import React, { useState, useEffect } from 'react'
import { useSession } from '../contexts/SessionContext'
import { sessionsAPI, transactionsAPI } from '../services/api'

const SessionManager = () => {
  const [sessions, setSessions] = useState([])
  const [sessionStats, setSessionStats] = useState({
    totalSessions: 0,
    totalRevenue: 0,
    averageSessionValue: 0,
    longestSession: 0
  })
  const [loading, setLoading] = useState(true)
  const { currentSession, isShopOpen, sessionHistory, openSession, closeSession, refreshSession } = useSession()

  useEffect(() => {
    fetchSessionData()
  }, [sessionHistory])

  const fetchSessionData = async () => {
    try {
      setLoading(true)
      const [sessionsRes, transactionsRes] = await Promise.all([
        sessionsAPI.getAll(),
        transactionsAPI.getAll()
      ])

      const sessionsData = sessionsRes.data.data || []
      const transactionsData = transactionsRes.data.data || []

      setSessions(sessionsData)

      // Calculate session statistics
      const totalSessions = sessionsData.length
      const totalRevenue = sessionsData.reduce((sum, session) => sum + (session.total_sales || 0), 0)
      const averageSessionValue = totalSessions > 0 ? totalRevenue / totalSessions : 0
      
      // Calculate longest session duration
      let longestSession = 0
      sessionsData.forEach(session => {
        if (session.start_time && session.end_time) {
          const duration = new Date(session.end_time) - new Date(session.start_time)
          if (duration > longestSession) {
            longestSession = duration
          }
        }
      })

      setSessionStats({
        totalSessions,
        totalRevenue,
        averageSessionValue,
        longestSession
      })

    } catch (error) {
      console.log('Error fetching session data:', error)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading Sessions...</h2>
        <p>Please wait while we load your session data</p>
      </div>
    )
  }

  const formatDuration = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Shop Session Management</h2>
        <button 
          onClick={() => {
            fetchSessionData()
            refreshSession()
          }}
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

      {/* Session Statistics */}
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
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#6b7280' }}>Total Sessions</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: '#3b82f6' }}>{sessionStats.totalSessions}</p>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#6b7280' }}>Total Revenue</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: '#059669' }}>₹{sessionStats.totalRevenue.toFixed(0)}</p>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#6b7280' }}>Avg Session Value</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: '#f59e0b' }}>₹{sessionStats.averageSessionValue.toFixed(0)}</p>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#6b7280' }}>Longest Session</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: '#8b5cf6' }}>{formatDuration(sessionStats.longestSession)}</p>
        </div>
      </div>

      {/* Current Session Status */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '1rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Current Status</h3>
        {isShopOpen ? (
          <div style={{
            background: '#dcfce7',
            border: '2px solid #22c55e',
            padding: '1rem',
            borderRadius: '6px'
          }}>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              <strong>Status:</strong> <span style={{ color: '#166534', fontWeight: 'bold' }}>OPEN</span>
            </p>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              <strong>Session ID:</strong> #{currentSession?.id}
            </p>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              <strong>Started:</strong> {currentSession?.start_time ? new Date(currentSession.start_time).toLocaleString() : 'Unknown'}
            </p>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              <strong>Duration:</strong> {currentSession?.start_time ? formatDuration(Date.now() - new Date(currentSession.start_time)) : 'Unknown'}
            </p>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              <strong>Total Sales:</strong> ₹{currentSession?.total_sales || 0}
            </p>
            <p style={{ margin: '0 0 1rem 0' }}>
              <strong>Transactions:</strong> {currentSession?.transaction_count || 0}
            </p>
            <button 
              onClick={closeSession}
              disabled={loading}
              style={{
                background: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Closing...' : 'Close Shop'}
            </button>
          </div>
        ) : (
          <div style={{
            background: '#fef2f2',
            border: '2px solid #ef4444',
            padding: '1rem',
            borderRadius: '6px'
          }}>
            <p style={{ margin: '0 0 1rem 0' }}>
              Shop is currently <span style={{ color: '#dc2626', fontWeight: 'bold' }}>CLOSED</span>
            </p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
              Use the shop control in the navigation to open the shop.
            </p>
          </div>
        )}
      </div>

      {/* Session History */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Session History</h3>
        {sessions.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Session ID</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Start Time</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>End Time</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Duration</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Sales</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Transactions</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 10).map((session) => {
                  const startTime = new Date(session.start_time)
                  const endTime = session.end_time ? new Date(session.end_time) : new Date()
                  const duration = endTime - startTime
                  
                  return (
                    <tr key={session.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '600' }}>#{session.id}</td>
                      <td style={{ padding: '0.75rem' }}>{startTime.toLocaleString()}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {session.end_time ? new Date(session.end_time).toLocaleString() : 'Active'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{formatDuration(duration)}</td>
                      <td style={{ padding: '0.75rem', fontWeight: '600', color: '#059669' }}>
                        ₹{session.total_sales || 0}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{session.transaction_count || 0}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          background: session.is_active ? '#dcfce7' : '#fee2e2',
                          color: session.is_active ? '#166534' : '#dc2626',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {session.is_active ? 'ACTIVE' : 'CLOSED'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            No session history available
          </p>
        )}
      </div>
    </div>
  )
}

export default SessionManager