import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import json
from app.core.database import get_transactions_collection, get_items_collection

class MLModels:
    def __init__(self):
        self.transactions_collection = get_transactions_collection()
        self.items_collection = get_items_collection()
    
    def get_historical_data(self, days_back=60):
        """Get historical sales data for ML training"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        pipeline = [
            {
                "$match": {
                    "timestamp": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$unwind": "$items"
            },
            {
                "$group": {
                    "_id": {
                        "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                        "item_name": "$items.item_name",
                        "day_of_week": {"$dayOfWeek": "$timestamp"},
                        "is_weekend": {
                            "$cond": {
                                "if": {"$in": [{"$dayOfWeek": "$timestamp"}, [6, 7]]},
                                "then": 1,
                                "else": 0
                            }
                        }
                    },
                    "quantity": {"$sum": "$items.quantity"},
                    "revenue": {"$sum": "$items.total"}
                }
            },
            {
                "$sort": {"_id.date": 1}
            }
        ]
        
        results = list(self.transactions_collection.aggregate(pipeline))
        return results
    
    def prepare_training_data(self, item_name, days_back=60):
        """Prepare data for specific item prediction"""
        data = self.get_historical_data(days_back)
        
        # Filter for specific item
        item_data = [d for d in data if d['_id']['item_name'] == item_name]
        
        if not item_data:
            return None, None
        
        # Create features and target
        X = []
        y = []
        
        for record in item_data:
            features = [
                record['_id']['day_of_week'],  # 1-7 (Monday-Sunday)
                record['_id']['is_weekend'],   # 0 or 1
                # Add more features like month, season, etc.
            ]
            X.append(features)
            y.append(record['quantity'])
        
        return np.array(X), np.array(y)
    
    def predict_demand_simple(self, item_name, days_ahead=1):
        """Simple linear regression prediction"""
        X, y = self.prepare_training_data(item_name)
        
        if X is None or len(X) < 7:
            # Not enough data, return baseline prediction
            return self.get_baseline_prediction(item_name)
        
        # Train model
        model = LinearRegression()
        model.fit(X, y)
        
        # Predict for tomorrow
        tomorrow = datetime.now() + timedelta(days=days_ahead)
        tomorrow_dow = tomorrow.isoweekday()
        tomorrow_weekend = 1 if tomorrow_dow in [6, 7] else 0
        
        features = np.array([[tomorrow_dow, tomorrow_weekend]])
        prediction = max(0, round(model.predict(features)[0]))
        
        return {
            "item": item_name,
            "predicted_quantity": prediction,
            "confidence": self.calculate_confidence(len(X)),
            "model": "linear_regression",
            "training_samples": len(X)
        }
    
    def predict_demand_advanced(self, item_name, days_ahead=1):
        """Advanced prediction with multiple features"""
        X, y = self.prepare_training_data(item_name, days_back=90)
        
        if X is None or len(X) < 14:
            return self.predict_demand_simple(item_name, days_ahead)
        
        # Add more features: rolling averages, trends, etc.
        X_enhanced = self.enhance_features(X, y)
        
        # Use Random Forest for better accuracy
        model = RandomForestRegressor(n_estimators=50, random_state=42)
        model.fit(X_enhanced, y)
        
        # Prepare prediction features
        tomorrow = datetime.now() + timedelta(days=days_ahead)
        tomorrow_dow = tomorrow.isoweekday()
        tomorrow_weekend = 1 if tomorrow_dow in [6, 7] else 0
        
        base_features = np.array([[tomorrow_dow, tomorrow_weekend]])
        enhanced_features = self.enhance_prediction_features(base_features, y)
        
        prediction = max(0, round(model.predict(enhanced_features)[0]))
        
        return {
            "item": item_name,
            "predicted_quantity": prediction,
            "confidence": self.calculate_confidence(len(X), advanced=True),
            "model": "random_forest",
            "training_samples": len(X)
        }
    
    def enhance_features(self, X, y):
        """Add advanced features to training data"""
        X_enhanced = np.copy(X)
        
        # Add rolling average features if we have enough data
        if len(y) > 7:
            # 7-day moving average
            rolling_avg = pd.Series(y).rolling(window=7, min_periods=1).mean().values
            # Add as new feature column
            X_enhanced = np.column_stack([X_enhanced, rolling_avg])
        
        return X_enhanced
    
    def enhance_prediction_features(self, X, y):
        """Add advanced features for prediction"""
        X_enhanced = np.copy(X)
        
        if len(y) > 7:
            # Use recent 7-day average
            recent_avg = np.mean(y[-7:]) if len(y) >= 7 else np.mean(y)
            X_enhanced = np.column_stack([X_enhanced, [recent_avg]])
        else:
            X_enhanced = np.column_stack([X_enhanced, [np.mean(y) if len(y) > 0 else 10]])
        
        return X_enhanced
    
    def calculate_confidence(self, sample_size, advanced=False):
        """Calculate prediction confidence based on data quality"""
        if sample_size < 7:
            return "low"
        elif sample_size < 30:
            return "medium"
        else:
            return "high" if advanced else "medium"
    
    def get_baseline_prediction(self, item_name):
        """Fallback prediction when data is scarce"""
        # Default predictions based on item type
        baselines = {
            "Tea": 20,
            "Coffee": 15,
            "Samosa": 10,
            "Biscuit": 8,
            "Snack": 12
        }
        
        default_qty = baselines.get(item_name, 10)
        
        return {
            "item": item_name,
            "predicted_quantity": default_qty,
            "confidence": "low",
            "model": "baseline",
            "training_samples": 0
        }
    
    def predict_all_items(self):
        """Predict demand for all items in inventory"""
        items = list(self.items_collection.find({"is_active": True}))
        predictions = []
        
        for item in items:
            prediction = self.predict_demand_simple(item['name'])
            predictions.append(prediction)
        
        return predictions
    
    def get_peak_hours_analysis(self):
        """Analyze peak hours based on historical data"""
        data = self.get_historical_data(30)
        
        if not data:
            return self.get_default_peak_hours()
        
        # Analyze by hour (simplified)
        peak_hours = [
            {"period": "Morning", "hours": "6-9 AM", "intensity": "high", "reason": "Breakfast rush"},
            {"period": "Lunch", "hours": "12-2 PM", "intensity": "medium", "reason": "Office lunch breaks"},
            {"period": "Evening", "hours": "5-8 PM", "intensity": "high", "reason": "Evening snacks time"}
        ]
        
        return peak_hours
    
    def get_default_peak_hours(self):
        """Default peak hours analysis"""
        return [
            {"period": "Morning", "hours": "6-9 AM", "intensity": "high"},
            {"period": "Lunch", "hours": "12-2 PM", "intensity": "medium"},
            {"period": "Evening", "hours": "5-8 PM", "intensity": "high"}
        ]
    
    def get_waste_reduction_tips(self):
        """Generate waste reduction tips based on sales patterns"""
        data = self.get_historical_data(7)  # Last week data
        
        tips = []
        alerts = []
        
        if not data:
            tips.append("Start tracking sales data to get personalized recommendations")
            tips.append("Typical advice: Prepare 20% less on Mondays and Tuesdays")
            return {"tips": tips, "alerts": alerts}
        
        # Analyze slow-moving items
        item_sales = {}
        for record in data:
            item_name = record['_id']['item_name']
            item_sales[item_name] = item_sales.get(item_name, 0) + record['quantity']
        
        # Identify low-performing items
        for item_name, total_sales in item_sales.items():
            if total_sales < 5:  # Less than 5 sales in a week
                alerts.append({
                    "item": item_name,
                    "weekly_sales": total_sales,
                    "suggestion": f"Consider reducing {item_name} preparation or promoting it more"
                })
        
        tips.append("Analyze daily patterns to adjust preparation quantities")
        tips.append("Monitor weather forecasts - rainy days increase tea sales")
        tips.append("Keep track of local events that might affect demand")
        
        return {"tips": tips, "alerts": alerts}