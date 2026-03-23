import React, { useState } from 'react';
import { analyticsAPI } from '../services/api';

const MenuOptimizer = () => {
  const [optimizationSuggestions, setOptimizationSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const analyzeMenu = async () => {
    setLoading(true);
    try {
      const response = await analyticsAPI.getWasteTips();
      const predictions = await analyticsAPI.predictDemand();
      
      const suggestions = predictions.predictions?.map(prediction => {
        const wasteData = response.alerts?.find(alert => alert.item === prediction.item);
        
        return {
          item: prediction.item,
          predictedDemand: prediction.predicted_quantity,
          currentPerformance: wasteData?.weekly_sales || 'No data',
          suggestion: wasteData?.suggestion || 'Maintain current levels',
          confidence: prediction.confidence
        };
      }) || [];

      setOptimizationSuggestions(suggestions);
    } catch (error) {
      console.error('Menu analysis error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="card">
      <h3>🤖 AI Menu Optimizer</h3>
      <p className="text-sm text-secondary mb-4">
        Get AI-powered suggestions to optimize your menu and reduce waste
      </p>

      <button onClick={analyzeMenu} className="btn btn-primary" disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Menu Performance'}
      </button>

      {optimizationSuggestions.length > 0 && (
        <div className="mt-4">
          <h4>Optimization Suggestions</h4>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Predicted Demand</th>
                  <th>Current Performance</th>
                  <th>Confidence</th>
                  <th>Suggestions</th>
                </tr>
              </thead>
              <tbody>
                {optimizationSuggestions.map((item, index) => (
                  <tr key={index}>
                    <td><strong>{item.item}</strong></td>
                    <td>{item.predictedDemand} units</td>
                    <td>{item.currentPerformance} units/week</td>
                    <td>
                      <span className={`confidence ${item.confidence}`}>
                        {item.confidence}
                      </span>
                    </td>
                    <td>{item.suggestion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuOptimizer;