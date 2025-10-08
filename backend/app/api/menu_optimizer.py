from fastapi import APIRouter
from app.core.database import get_transactions_collection, get_items_collection
from datetime import datetime, timedelta

router = APIRouter(prefix="/menu-optimizer", tags=["menu-optimizer"])

@router.get("/analysis")
async def analyze_menu_performance(days: int = 7):
    """Analyze menu performance and provide optimization suggestions"""
    transactions_collection = get_transactions_collection()
    items_collection = get_items_collection()
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Get sales data
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
                "_id": "$items.item_name",
                "total_quantity": {"$sum": "$items.quantity"},
                "total_revenue": {"$sum": "$items.total"},
                "transaction_count": {"$sum": 1}
            }
        }
    ]
    
    sales_data = list(transactions_collection.aggregate(pipeline))
    
    # Get all items
    items = list(items_collection.find({"is_active": True}))
    
    # Generate suggestions
    suggestions = []
    for item in items:
        item_sales = next((s for s in sales_data if s["_id"] == item["name"]), None)
        
        if item_sales:
            performance = "good" if item_sales["total_quantity"] > 10 else "average" if item_sales["total_quantity"] > 5 else "poor"
            
            suggestion = {
                "item": item["name"],
                "quantity_sold": item_sales["total_quantity"],
                "revenue": item_sales["total_revenue"],
                "performance": performance,
                "suggestion": generate_suggestion(item["name"], item_sales["total_quantity"], performance)
            }
        else:
            suggestion = {
                "item": item["name"],
                "quantity_sold": 0,
                "revenue": 0,
                "performance": "poor",
                "suggestion": "This item hasn't sold recently. Consider promoting it or removing from menu."
            }
        
        suggestions.append(suggestion)
    
    return {
        "analysis_period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": days
        },
        "suggestions": suggestions,
        "summary": {
            "total_items": len(items),
            "items_sold": len([s for s in suggestions if s["quantity_sold"] > 0]),
            "total_revenue": sum(s["revenue"] for s in suggestions)
        }
    }

def generate_suggestion(item_name, quantity, performance):
    if performance == "good":
        return f"✅ {item_name} is selling well. Maintain current stock levels."
    elif performance == "average":
        return f"⚠️ {item_name} has moderate sales. Consider slight adjustments to preparation quantities."
    else:
        return f"❌ {item_name} has low sales. Consider promotions, price adjustments, or removing from menu."