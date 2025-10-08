from datetime import datetime, timedelta
import pandas as pd
from app.core.database import get_transactions_collection, get_items_collection

class SalesAnalytics:
    def __init__(self):
        self.transactions_collection = get_transactions_collection()
        self.items_collection = get_items_collection()
    
    def get_hourly_sales(self, days_back=7):
        """Get hourly sales data for the past N days"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        # Aggregate hourly sales data
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
                        "hour": {"$hour": "$timestamp"},
                        "item_name": "$items.item_name"
                    },
                    "total_quantity": {"$sum": "$items.quantity"},
                    "total_revenue": {"$sum": "$items.total"}
                }
            },
            {
                "$sort": {"_id.hour": 1, "total_quantity": -1}
            }
        ]
        
        results = list(self.transactions_collection.aggregate(pipeline))
        
        # Format results
        hourly_data = {}
        for result in results:
            hour = result["_id"]["hour"]
            item_name = result["_id"]["item_name"]
            
            if hour not in hourly_data:
                hourly_data[hour] = {}
            
            hourly_data[hour][item_name] = {
                "quantity": result["total_quantity"],
                "revenue": result["total_revenue"]
            }
        
        return hourly_data
    
    def get_peak_hours(self, item_name=None, days_back=7):
        """Identify peak selling hours for items"""
        hourly_data = self.get_hourly_sales(days_back)
        
        peak_hours = {}
        for hour, items_data in hourly_data.items():
            for item, data in items_data.items():
                if item_name and item != item_name:
                    continue
                
                if item not in peak_hours:
                    peak_hours[item] = []
                
                peak_hours[item].append({
                    "hour": hour,
                    "quantity": data["quantity"],
                    "revenue": data["revenue"]
                })
        
        # Sort by quantity for each item
        for item in peak_hours:
            peak_hours[item].sort(key=lambda x: x["quantity"], reverse=True)
        
        return peak_hours
    
    def get_daily_trends(self, item_name=None):
        """Get daily sales trends (day of week patterns)"""
        pipeline = [
            {
                "$unwind": "$items"
            },
            {
                "$group": {
                    "_id": {
                        "day_of_week": {"$dayOfWeek": "$timestamp"},
                        "item_name": "$items.item_name"
                    },
                    "total_quantity": {"$sum": "$items.quantity"},
                    "total_revenue": {"$sum": "$items.total"}
                }
            },
            {
                "$sort": {"_id.day_of_week": 1, "total_quantity": -1}
            }
        ]
        
        if item_name:
            pipeline.insert(0, {
                "$match": {"items.item_name": item_name}
            })
        
        results = list(self.transactions_collection.aggregate(pipeline))
        
        # Map day numbers to names
        day_names = {
            1: "Sunday", 2: "Monday", 3: "Tuesday", 
            4: "Wednesday", 5: "Thursday", 6: "Friday", 7: "Saturday"
        }
        
        trends = {}
        for result in results:
            day_num = result["_id"]["day_of_week"]
            item = result["_id"]["item_name"]
            day_name = day_names.get(day_num, f"Day {day_num}")
            
            if item not in trends:
                trends[item] = {}
            
            trends[item][day_name] = {
                "quantity": result["total_quantity"],
                "revenue": result["total_revenue"]
            }
        
        return trends