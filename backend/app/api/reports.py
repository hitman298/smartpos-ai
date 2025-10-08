from fastapi import APIRouter
from app.core.database import get_transactions_collection, get_sessions_collection, get_items_collection
from datetime import datetime, timedelta

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/generate")
async def generate_comprehensive_report(days: int = 30):
    """Generate a comprehensive business report"""
    transactions_collection = get_transactions_collection()
    sessions_collection = get_sessions_collection()
    items_collection = get_items_collection()
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Get all data
    transactions = list(transactions_collection.find({
        "timestamp": {"$gte": start_date, "$lte": end_date}
    }))
    
    sessions = list(sessions_collection.find({
        "start_time": {"$gte": start_date}
    }))
    
    items = list(items_collection.find({"is_active": True}))
    
    # Calculate metrics
    total_sales = sum(t["total_amount"] for t in transactions)
    total_transactions = len(transactions)
    avg_transaction_value = total_sales / total_transactions if total_transactions else 0
    
    # Popular items
    item_sales = {}
    for transaction in transactions:
        for item in transaction["items"]:
            item_sales[item["item_name"]] = item_sales.get(item["item_name"], 0) + item["quantity"]
    
    popular_items = sorted(item_sales.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Session analysis
    closed_sessions = [s for s in sessions if not s.get("is_active", True)]
    total_operating_hours = sum(s.get("duration_minutes", 0) for s in closed_sessions) / 60
    
    return {
        "report_metadata": {
            "generated_at": datetime.now().isoformat(),
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": days
            }
        },
        "summary": {
            "total_sales": total_sales,
            "total_transactions": total_transactions,
            "avg_transaction_value": avg_transaction_value,
            "total_operating_hours": total_operating_hours,
            "sales_per_hour": total_sales / total_operating_hours if total_operating_hours else 0
        },
        "items_analysis": {
            "total_items": len(items),
            "active_items": len([i for i in items if i.get("is_active", True)]),
            "popular_items": [{"name": name, "quantity_sold": qty} for name, qty in popular_items]
        },
        "sessions_analysis": {
            "total_sessions": len(sessions),
            "active_sessions": len([s for s in sessions if s.get("is_active", True)]),
            "closed_sessions": len(closed_sessions)
        },
        "raw_data_counts": {
            "transactions": len(transactions),
            "sessions": len(sessions),
            "items": len(items)
        }
    }