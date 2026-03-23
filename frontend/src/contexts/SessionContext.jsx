import React, { createContext, useContext, useState, useEffect } from 'react';
import { sessionsAPI } from '../services/api';

const SessionContext = createContext();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }) => {
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Load initial session data
  useEffect(() => {
    loadSessionData();
    
    // Load session from localStorage on page refresh
    const savedSession = localStorage.getItem('smartpos_current_session');
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        if (sessionData && sessionData.is_active) {
          setCurrentSession(sessionData);
          console.log('Session restored from localStorage:', sessionData);
        }
      } catch (error) {
        console.error('Error parsing saved session:', error);
        localStorage.removeItem('smartpos_current_session');
      }
    }
  }, []);

  // Auto-refresh session data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSession();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadSessionData = async () => {
    try {
      const [currentResponse, historyResponse] = await Promise.all([
        sessionsAPI.getCurrent(),
        sessionsAPI.getAll()
      ]);

      const currentSessionData = currentResponse.data.data;
      setCurrentSession(currentSessionData);
      setSessionHistory(historyResponse.data.data || []);
      setLastUpdated(new Date());
      
      console.log('Session data loaded:', currentSessionData);
    } catch (error) {
      console.error('Error loading session data:', error);
      // Don't clear session on error, keep current state
    }
  };

  const openSession = async () => {
    setLoading(true);
    try {
      const response = await sessionsAPI.open();
      console.log('Session opened:', response.data);
      
      // Update local state immediately for better UX
      if (response.data && response.data.data) {
        setCurrentSession(response.data.data);
        localStorage.setItem('smartpos_current_session', JSON.stringify(response.data.data));
        console.log('Session state updated:', response.data.data);
      }
      
      // Don't reload session data immediately to avoid clearing the session
      return { success: true };
    } catch (error) {
      console.error('Error opening session:', error);
      // Even if API fails, create a local session for fallback
      const fallbackSession = {
        id: Date.now().toString(),
        start_time: new Date().toISOString(),
        is_active: true,
        total_sales: 0,
        transaction_count: 0
      };
      setCurrentSession(fallbackSession);
      localStorage.setItem('smartpos_current_session', JSON.stringify(fallbackSession));
      console.log('Using fallback session:', fallbackSession);
      return { success: true, fallback: true };
    } finally {
      setLoading(false);
    }
  };

  const closeSession = async () => {
    setLoading(true);
    try {
      await sessionsAPI.close();
      console.log('Session closed via API');
    } catch (error) {
      console.error('Error closing session:', error);
    } finally {
      // Always clear local session when closing
      setCurrentSession(null);
      localStorage.removeItem('smartpos_current_session');
      console.log('Session cleared locally and from localStorage');
      setLoading(false);
      return { success: true };
    }
  };

  const refreshSession = async () => {
    try {
      // Always refresh to get updated session data
      const currentResponse = await sessionsAPI.getCurrent();
      const currentSessionData = currentResponse.data.data;
      
      if (currentSessionData) {
        setCurrentSession(currentSessionData);
        localStorage.setItem('smartpos_current_session', JSON.stringify(currentSessionData));
        console.log('Session refreshed:', currentSessionData);
      }
      
      // Also refresh session history
      const historyResponse = await sessionsAPI.getAll();
      setSessionHistory(historyResponse.data.data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  const value = {
    currentSession,
    sessionHistory,
    loading,
    lastUpdated,
    openSession,
    closeSession,
    refreshSession,
    isShopOpen: currentSession && currentSession.is_active
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

