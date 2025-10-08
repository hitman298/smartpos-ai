import pandas as pd
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
import numpy as np
from app.core.database import get_transactions_collection

class DemandPredictor:
    def __init__(self):
        self.transactions_collection = get_transactions_collection()
    
    def prepare_training_data(self, days_back=30):
        """Prepare historical data for training"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        # Get historical sales data
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
                        "item_name": "$items.item_name"
                    },
                    "total_quantity": {"$sum": "$items.quantity"},
                    "day_of_week": {"$first": {"$dayOfWeek": "$timestamp"}}
                }
            }
        ]
        
        results = list(self.transactions_collection.aggregate(pipeline))
        
        # Convert to DataFrame
        data = []
        for result in results:
            data.append({
                "date": result["_id"]["date"],
                "item_name": result["_id"]["item_name"],
                "quantity": result["total_quantity"],
                "day_of_week": result["day_of_week"]
            })
        
        return pd.DataFrame(data)
    
    def predict_demand(self, item_name, days_ahead=1):
        """Predict demand for a specific item"""
        df = self.prepare_training_data()
        
        if df.empty:
            return {"predicted_quantity": 0, "confidence": "low"}
        
        # Filter for specific item
        item_data = df[df['item_name'] == item_name]
        
        if len(item_data) < 7:  # Not enough data
            return {"predicted_quantity": 0, "confidence": "low"}
        
        # Simple linear regression based on day of week
        X = item_data[['day_of_week']]
        y = item_data['quantity']
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Predict for tomorrow (next day of week)
        tomorrow_dow = (datetime.now() + timedelta(days=days_ahead)).isoweekday()
        predicted_quantity = max(0, round(model.predict([[tomorrow_dow]])[0]))
        
        # Simple confidence calculation
        confidence = "high" if len(item_data) > 14 else "medium"
        
        return {
            "predicted_quantity": predicted_quantity,
            "confidence": confidence,
            "training_data_points": len(item_data)
        }
    
    def predict_all_items(self, days_ahead=1):
        """Predict demand for all items"""
        df = self.prepare_training_data()
        predictions = {}
        
        for item_name in df['item_name'].unique():
            predictions[item_name] = self.predict_demand(item_name, days_ahead)
        
        return predictions