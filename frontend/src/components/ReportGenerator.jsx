import React, { useState } from 'react';
import { reportsAPI, itemsAPI, transactionsAPI, sessionsAPI } from '../services/api';

const ReportGenerator = () => {
  const [reportType, setReportType] = useState('daily');
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const response = await reportsAPI.generateReport(30);
      exportReport(response.data);
    } catch (error) {
      console.error('Report generation error:', error);
      alert('❌ Failed to generate report');
    }
    setGenerating(false);
  };

  const exportReport = (data) => {
    try {
      // Create a formatted report
      const report = {
        metadata: {
          title: "SmartPOS AI Business Report",
          generatedAt: new Date().toLocaleString(),
          reportPeriod: "Last 30 Days"
        },
        summary: {
          totalSales: data.summary?.total_sales || 0,
          totalTransactions: data.summary?.total_transactions || 0,
          averageTransaction: data.summary?.avg_transaction_value || 0,
          popularItems: data.items_analysis?.popular_items || []
        },
        detailedData: data
      };

      // Create JSON file
      const blob = new Blob([JSON.stringify(report, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `smartpos-report-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      alert('✅ Report exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Failed to export report');
    }
  };

  const exportItemsCSV = async () => {
    try {
      const response = await itemsAPI.getAll();
      const items = response.data;
      
      const csvHeaders = 'Name,Price,Category,Status\n';
      const csvData = items.map(item => 
        `"${item.name}",${item.price},"${item.category || 'General'}","${item.is_active ? 'Active' : 'Inactive'}"`
      ).join('\n');
      
      const csvContent = csvHeaders + csvData;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `smartpos-items-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      alert('✅ Items exported to CSV!');
    } catch (error) {
      console.error('CSV export error:', error);
      alert('❌ Failed to export items');
    }
  };

  return (
    <div className="card">
      <h2>◉ Report Generator</h2>
      
      <div className="export-options">
        <div className="export-option">
          <h3>▲ Business Reports</h3>
          <p>Generate comprehensive business analytics</p>
          <button 
            onClick={generateReport} 
            className="btn btn-primary"
            disabled={generating}
          >
            {generating ? '⏳ Generating...' : '■ Generate Full Report'}
          </button>
        </div>

        <div className="export-option">
          <h3>■ Data Export</h3>
          <p>Export your data in various formats</p>
          <div className="export-buttons">
            <button onClick={exportItemsCSV} className="btn btn-success">
              ⬇ Export Items (CSV)
            </button>
          </div>
        </div>
      </div>

      <div className="report-info mt-4">
        <h4>■ What's Included in Reports:</h4>
        <ul>
          <li>$ Sales summary and revenue analytics</li>
          <li>◉ Transaction history and patterns</li>
          <li>🏪 Shop performance metrics</li>
          <li>■ Inventory status and alerts</li>
          <li>▲ Customer behavior insights</li>
          <li>🤖 AI-powered recommendations</li>
        </ul>
      </div>
    </div>
  );
};

export default ReportGenerator;