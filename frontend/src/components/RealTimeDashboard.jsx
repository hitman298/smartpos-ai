import React, { useState, useEffect } from 'react';
import { transactionsAPI, sessionsAPI } from '../services/api';

const RealTimeDashboard = () => {
  const [realTimeData, setRealTimeData] = useState({
    currentHourSales: 0,
    todaySales: 0,
    popularItems: [],
    transactionRate: 0
  });

  useEffect(() => {
    fetchRealTimeData();
    const interval = setInterval(fetchRealTimeData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchRealTimeData = async () => {
    try {
      const [transactions, session] = await Promise.all([
        transactionsAPI.getAll(),
        sessionsAPI.getCurrent()
      ]);

      const now = new Date();
      const currentHour = now.getHours();
      const todayTransactions = transactions.data.filter(t => 
        new Date(t.timestamp).toDateString() === now.toDateString()
      );

      const hourSales = todayTransactions
        .filter(t => new Date(t.timestamp).getHours() === currentHour)
        .reduce((sum, t) => sum + t.total_amount, 0);

      const todaySales = todayTransactions.reduce((sum, t) => sum + t.total_amount, 0);

      // Calculate popular items
      const itemCounts = {};
      todayTransactions.forEach(t => {
        t.items.forEach(item => {
          itemCounts[item.item_name] = (itemCounts[item.item_name] || 0) + item.quantity;
        });
      });

      const popularItems = Object.entries(itemCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      setRealTimeData({
        currentHourSales: hourSales,
        todaySales,
        popularItems,
        transactionRate: todayTransactions.length / (now.getHours() || 1)
      });
    } catch (error) {
      console.error('Real-time data error:', error);
    }
  };

  return (
    <div className="card">
      <h3>⏰ Real-time Dashboard</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Current Hour Sales</h4>
          <p className="stat-number">₹{realTimeData.currentHourSales}</p>
          <span className="text-sm">This hour</span>
        </div>
        
        <div className="stat-card">
          <h4>Today's Total</h4>
          <p className="stat-number">₹{realTimeData.todaySales}</p>
          <span className="text-sm">So far today</span>
        </div>
        
        <div className="stat-card">
          <h4>Transaction Rate</h4>
          <p className="stat-number">{realTimeData.transactionRate.toFixed(1)}</p>
          <span className="text-sm">Orders/hour</span>
        </div>
      </div>

      <div className="mt-4">
        <h4>★ Popular Items Right Now</h4>
        <div className="popular-items">
          {realTimeData.popularItems.map((item, index) => (
            <div key={index} className="popular-item">
              <span className="item-rank">#{index + 1}</span>
              <span className="item-name">{item.name}</span>
              <span className="item-count">{item.count} sold</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RealTimeDashboard;