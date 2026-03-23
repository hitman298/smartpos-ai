import React, { useState } from 'react';
import { bulkImportAPI } from '../services/api';

const BulkImport = () => {
  const [importText, setImportText] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const exampleFormats = [
    {
      name: "Simple Format",
      example: `Tea - 20\nCoffee - 30\nSamosa - 15`,
      description: "Item Name - Price"
    },
    {
      name: "Standard Format", 
      example: `Tea - 20 - Beverage\nCoffee - 30 - Beverage\nSamosa - 15 - Snack`,
      description: "Item Name - Price - Category"
    }
  ];

  const [selectedFormat, setSelectedFormat] = useState(0);

  const handleImport = async () => {
    if (!importText.trim()) {
      alert('Please enter some items to import');
      return;
    }

    setLoading(true);
    try {
      const response = await bulkImportAPI.importItems(importText);
      setResults(response.data);
      
      if (response.data.imported > 0) {
        alert(`✅ Successfully imported ${response.data.imported} items!`);
      }
      if (response.data.errors > 0) {
        alert(`! ${response.data.errors} items had issues. Check errors below.`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('❌ Failed to import items. Please check the format.');
    }
    setLoading(false);
  };

  const loadFormatExample = (index) => {
    setSelectedFormat(index);
    setImportText(exampleFormats[index].example);
  };

  return (
    <div>
      <h2>⬇ Bulk Item Import</h2>

      {/* Format Selection */}
      <div className="card mb-4">
        <h3>■ Choose Import Format</h3>
        <div className="format-buttons">
          {exampleFormats.map((format, index) => (
            <button
              key={index}
              className={`btn ${selectedFormat === index ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => loadFormatExample(index)}
            >
              {format.name}
            </button>
          ))}
        </div>
        <p className="text-sm text-secondary mt-2">
          {exampleFormats[selectedFormat].description}
        </p>
      </div>

      {/* Import Area */}
      <div className="card mb-4">
        <h3>⬆ Import Items</h3>
        
        <div className="form-group">
          <label className="form-label">
            Enter items (one per line):
          </label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste your items here..."
            rows="10"
            className="form-input"
            style={{ fontFamily: 'monospace', fontSize: '14px' }}
          />
        </div>

        <div className="form-group">
          <button 
            onClick={handleImport} 
            className="btn btn-success"
            disabled={loading || !importText.trim()}
          >
            {loading ? '⏳ Importing...' : '🚀 Import Items'}
          </button>
          
          <button 
            onClick={() => setImportText('')}
            className="btn btn-danger ml-2"
          >
            × Clear
          </button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="card">
          <h3>◉ Import Results</h3>
          
          <div className="results-summary">
            <div className="result-stat success">
              <strong>✅ Imported:</strong> {results.imported} items
            </div>
            <div className="result-stat warning">
              <strong>! Errors:</strong> {results.errors} items
            </div>
          </div>

          {results.items && results.items.length > 0 && (
            <div className="mt-4">
              <h4>📦 Successfully Processed Items:</h4>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Category</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>₹{item.price}</td>
                        <td>{item.category}</td>
                        <td>
                          <span className={`badge ${item.action === 'created' ? 'badge-success' : 'badge-info'}`}>
                            {item.action}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {results.error_details && results.error_details.length > 0 && (
            <div className="mt-4">
              <h4>❌ Import Errors:</h4>
              <div className="error-list">
                {results.error_details.map((error, index) => (
                  <div key={index} className="error-item">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkImport;