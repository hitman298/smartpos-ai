from fastapi import APIRouter
from app.core.database import get_transactions_collection
from datetime import datetime, timedelta

router = APIRouter(prefix="/real-time", tags=["real-time"])

@router.get("/dashboard")
async def get_real_time_data(hours: int = 24):
    """Get real-time dashboard data"""
    collection = get_transactions_collection()
    
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=hours)
    
    # Current hour sales
    current_hour_start = datetime.now().replace(minute=0, second=0, microsecond=0)
    current_hour_end = current_hour_start + timedelta(hours=1)
    
    pipeline = [
        {
            "$match": {
                "timestamp": {
                    "$gte": start_time,
                    "$lte": end_time
                }
            }
        },
        {
            "$facet": {
                "today_sales": [
                    {"$match": {"timestamp": {"$gte": current_hour_start}}},
                    {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
                ],
                "current_hour_sales": [
                    {"$match": {"timestamp": {"$gte": current_hour_start, "$lte": current_hour_end}}},
                    {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
                ],
                "popular_items": [
                    {"$unwind": "$items"},
                    {"$group": {
                        "_id": "$items.item_name",
                        "count": {"$sum": "$items.quantity"}
                    }},
                    {"$sort": {"count": -1}},
                    {"$limit": 5}
                ],
                "total_transactions": [
                    {"$count": "count"}
                ]
            }
        }
    ]
    
    results = list(collection.aggregate(pipeline))
    
    if results:
        data = results[0]
        return {
            "current_hour_sales": data["current_hour_sales"][0]["total"] if data["current_hour_sales"] else 0,
            "today_sales": data["today_sales"][0]["total"] if data["today_sales"] else 0,
            "total_transactions": data["total_transactions"][0]["count"] if data["total_transactions"] else 0,
            "popular_items": [{"name": item["_id"], "count": item["count"]} for item in data["popular_items"]],
            "last_updated": datetime.now().isoformat()
        }
    
    return {
        "current_hour_sales": 0,
        "today_sales": 0,
        "total_transactions": 0,
        "popular_items": [],
        "last_updated": datetime.now().isoformat()
    }