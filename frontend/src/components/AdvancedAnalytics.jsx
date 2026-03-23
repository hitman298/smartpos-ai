import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, PieChart, Line, Bar, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { transactionsAPI, analyticsAPI } from '../services/api';

const AdvancedAnalytics = () => {
  const [salesData, setSalesData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [timeRange, setTimeRange] = useState('7'); // 7 days default

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      const transactions = await transactionsAPI.getAll();
      processChartData(transactions.data);
    } catch (error) {
      console.error('Analytics error:', error);
    }
  };

  const processChartData = (transactions) => {
    // Process daily sales data
    const dailySales = {};
    const hourlySales = Array(24).fill(0).map((_, hour) => ({ hour, sales: 0 }));
    const categorySales = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.timestamp).toLocaleDateString();
      const hour = new Date(transaction.timestamp).getHours();
      
      // Daily sales
      dailySales[date] = (dailySales[date] || 0) + transaction.total_amount;
      
      // Hourly sales
      hourlySales[hour].sales += transaction.total_amount;
      
      // Category sales
      transaction.items.forEach(item => {
        categorySales[item.category] = (categorySales[item.category] || 0) + item.total;
      });
    });

    setSalesData(Object.entries(dailySales).map(([date, sales]) => ({ date, sales })));
    setHourlyData(hourlySales);
    setCategoryData(Object.entries(categorySales).map(([name, value]) => ({ name, value })));
  };

  const exportAnalytics = () => {
    const data = {
      salesData,
      hourlyData,
      categoryData,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smartpos-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div>
      <div className="card-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2>◉ Advanced Analytics</h2>
        <button onClick={exportAnalytics} className="btn btn-primary">
          ⬇ Export Analytics
        </button>
      </div>

      <div className="stats-grid">
        <div className="card">
          <h3>Daily Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Hourly Sales Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3>Sales by Category</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, value }) => `${name}: ₹${value}`}
            />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;