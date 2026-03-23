import axios from 'axios';

// API Base URL
const API_BASE_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Only log errors, don't automatically use mock data
    console.error('API Error:', error.message);
    if (error.response) {
      // Server responded with error status
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received. Backend may be down.');
    }
    // Let the error propagate so components can handle it
    return Promise.reject(error);
  }
);

// Mock data fallback
const getMockResponse = (config) => {
  const url = config.url;
  const method = config.method?.toLowerCase();

  if (url?.includes('/items') && method === 'get') {
    return {
      success: true,
      data: [
        { id: '1', name: 'Masala Chai', price: 15, category: 'Beverages', stock: 50 },
        { id: '2', name: 'Filter Coffee', price: 20, category: 'Beverages', stock: 30 },
        { id: '3', name: 'Cold Coffee', price: 60, category: 'Beverages', stock: 25 },
        { id: '4', name: 'Samosa', price: 12, category: 'Snacks', stock: 40 },
        { id: '5', name: 'Sandwich', price: 45, category: 'Snacks', stock: 20 },
        { id: '6', name: 'Milk 1L', price: 60, category: 'Dairy', stock: 30 },
      ]
    };
  }

  if (url?.includes('/sessions/current')) {
    return {
      success: true,
      data: null,
      is_active: false
    };
  }

  if (url?.includes('/sessions/open')) {
    return {
      success: true,
      data: {
        id: Date.now().toString(),
        start_time: new Date().toISOString(),
        is_active: true,
        total_sales: 0,
        transaction_count: 0
      },
      message: "Session opened successfully"
    };
  }

  if (url?.includes('/sessions/close')) {
    return {
      success: true,
      data: null,
      message: "Session closed successfully"
    };
  }

  if (url?.includes('/dashboard/overview')) {
    return {
      success: true,
      data: {
        today_sales: 0,
        total_transactions: 0,
        active_items: 6,
        total_customers: 0,
        shop_status: 'closed'
      }
    };
  }

  return { success: true, data: {} };
};

// API Services
export const itemsAPI = {
  getAll: () => api.get('/items/'),
  create: (item) => api.post('/items/', item),
  update: (id, item) => api.put(`/items/${id}`, item),
  delete: (id) => api.delete(`/items/${id}`)
};

export const sessionsAPI = {
  getCurrent: () => api.get('/sessions/current'),
  getAll: () => api.get('/sessions/'),
  open: () => api.post('/sessions/open'),
  close: () => api.post('/sessions/close')
};

export const transactionsAPI = {
  getAll: () => api.get('/transactions/'),
  create: (transaction) => api.post('/transactions/', transaction),
  getBySession: (sessionId) => api.get(`/transactions/session/${sessionId}`),
  getById: (transactionId) => api.get(`/transactions/${transactionId}`)
};

export const inventoryAPI = {
  getAll: () => api.get('/inventory/'),
  getAlerts: () => api.get('/inventory/alerts')
};

export const customersAPI = {
  getAll: () => api.get('/customers/'),
  create: (customer) => api.post('/customers/', customer)
};

export const analyticsAPI = {
  predictDemand: () => api.get('/analytics/ml/predict-demand'),
  getPeakHours: () => api.get('/analytics/ml/peak-hours'),
  getWasteReduction: () => api.get('/analytics/ml/waste-reduction'),
  getSalesTrend: () => api.get('/analytics/sales-trend'),
  getCustomerSegments: () => api.get('/analytics/customer-segments'),
  getInventoryPerformance: () => api.get('/analytics/inventory-performance')
};

export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview')
};

export const healthAPI = {
  check: () => api.get('/health')
};

export const employeesAPI = {
  getAll: () => api.get('/employees/'),
  create: (employee) => api.post('/employees/', employee),
  update: (id, employee) => api.put(`/employees/${id}`, employee),
  delete: (id) => api.delete(`/employees/${id}`)
};

export const reportsAPI = {
  getSalesReport: () => api.get('/reports/sales'),
  getInventoryReport: () => api.get('/reports/inventory')
};

export default api;