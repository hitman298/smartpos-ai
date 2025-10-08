from fastapi import APIRouter
from app.core.database import get_transactions_collection
from datetime import datetime, timedelta

router = APIRouter(prefix="/advanced-analytics", tags=["advanced-analytics"])

@router.get("/sales-data")
async def get_sales_analytics(days: int = 7):
    """Get sales data for charts and analytics"""
    collection = get_transactions_collection()
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    pipeline = [
        {
            "$match": {
                "timestamp": {"$gte": start_date, "$lte": end_date}
            }
        },
        {
            "$group": {
                "_id": {
                    "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                    "hour": {"$hour": "$timestamp"}
                },
                "total_sales": {"$sum": "$total_amount"},
                "transaction_count": {"$sum": 1}
            }
        },
        {
            "$sort": {"_id.date": 1, "_id.hour": 1}
        }
    ]
    
    results = list(collection.aggregate(pipeline))
    
    # Process for charts
    daily_data = {}
    hourly_data = [{"hour": i, "sales": 0} for i in range(24)]
    
    for result in results:
        date = result["_id"]["date"]
        hour = result["_id"]["hour"]
        sales = result["total_sales"]
        
        # Daily data
        daily_data[date] = daily_data.get(date, 0) + sales
        
        # Hourly data
        if 0 <= hour < 24:
            hourly_data[hour]["sales"] += sales
    
    return {
        "daily_sales": [{"date": k, "sales": v} for k, v in daily_data.items()],
        "hourly_sales": hourly_data,
        "time_period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": days
        }
    }