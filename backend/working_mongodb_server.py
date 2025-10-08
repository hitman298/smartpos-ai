from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
import motor.motor_asyncio
import os
from bson import ObjectId

# Initialize FastAPI app
app = FastAPI(title="SmartPOS AI MongoDB Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = None
db = None

@app.on_event("startup")
async def startup_event():
    global client, db
    try:
        client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
        db = client.smartpos_ai
        print("Connected to MongoDB successfully!")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        db = None

@app.on_event("shutdown")
async def shutdown_event():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")

# Helper function to convert ObjectId to string
def convert_objectid_to_str(obj):
    if isinstance(obj, dict):
        for key, value in obj.items():
            if isinstance(value, ObjectId):
                obj[key] = str(value)
            elif isinstance(value, dict):
                convert_objectid_to_str(value)
            elif isinstance(value, list):
                for item in value:
                    convert_objectid_to_str(item)
    elif isinstance(obj, list):
        for item in obj:
            convert_objectid_to_str(item)
    return obj

# Pydantic models
class Item(BaseModel):
    id: str
    name: str
    price: float
    category: str
    stock: int

class Transaction(BaseModel):
    items: List[dict]
    total_amount: float
    payment_method: str
    customer_id: Optional[str] = None

class Customer(BaseModel):
    name: str
    email: str
    phone: str

# Health check
@app.get("/health")
async def health_check():
    return {
        "message": "SmartPOS AI API is running!",
        "mongodb_available": db is not None
    }

# Item endpoints
@app.get("/items/")
async def get_items():
    try:
        if db is not None:
            items = await db.items.find().to_list(length=1000)
            items = convert_objectid_to_str(items)
            return {"success": True, "data": items, "count": len(items)}
        else:
            return {"success": True, "data": [], "count": 0}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/items/")
async def create_item(item: Item):
    try:
        item_dict = item.dict()
        if db is not None:
            await db.items.insert_one(item_dict)
        return {"success": True, "data": item_dict, "message": "Item created successfully"}
    except Exception as e:
        return {"success": False, "error": str(e)}

# Session endpoints
@app.get("/sessions/")
async def get_sessions():
    try:
        if db is not None:
            sessions = await db.sessions.find().to_list(length=100)
            sessions = convert_objectid_to_str(sessions)
            return {"success": True, "data": sessions, "count": len(sessions)}
        else:
            return {"success": True, "data": [], "count": 0}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/sessions/current")
async def get_current_session():
    try:
        if db is not None:
            session = await db.sessions.find_one({"is_active": True})
            if session:
                session = convert_objectid_to_str(session)
                return {"success": True, "data": session, "is_active": True}
            else:
                return {"success": True, "data": None, "is_active": False}
        else:
            return {"success": True, "data": None, "is_active": False}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/sessions/open")
async def open_session():
    try:
        # Close any existing active session
        if db is not None:
            await db.sessions.update_many({"is_active": True}, {"$set": {"is_active": False, "end_time": datetime.now().isoformat()}})
        
        # Create new session
        session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        now = datetime.now().isoformat()
        new_session = {
            "id": session_id,
            "start_time": now,
            "end_time": None,
            "is_active": True,
            "total_sales": 0.0,
            "transaction_count": 0
        }
        
        if db is not None:
            result = await db.sessions.insert_one(new_session)
            new_session["_id"] = str(result.inserted_id)
        
        return {"success": True, "data": new_session, "message": "Session opened successfully"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/sessions/close")
async def close_session():
    try:
        if db is not None:
            result = await db.sessions.update_many(
                {"is_active": True}, 
                {"$set": {"is_active": False, "end_time": datetime.now().isoformat()}}
            )
            return {"success": True, "message": "Session closed successfully", "updated_count": result.modified_count}
        else:
            return {"success": True, "message": "Session closed successfully"}
    except Exception as e:
        return {"success": False, "error": str(e)}

# Transaction endpoints
@app.get("/transactions/")
async def get_transactions():
    try:
        if db is not None:
            transactions = await db.transactions.find().to_list(length=1000)
            transactions = convert_objectid_to_str(transactions)
            return {"success": True, "data": transactions, "count": len(transactions)}
        else:
            return {"success": True, "data": [], "count": 0}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/transactions/")
async def create_transaction(transaction: Transaction):
    try:
        transaction_dict = transaction.dict()
        transaction_dict["id"] = f"txn_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        transaction_dict["timestamp"] = datetime.now().isoformat()
        
        if db is not None:
            # Save transaction
            result = await db.transactions.insert_one(transaction_dict)
            transaction_dict["_id"] = str(result.inserted_id)
            
            # Update current session
            await db.sessions.update_one(
                {"is_active": True},
                {
                    "$inc": {
                        "total_sales": transaction.total_amount,
                        "transaction_count": 1
                    }
                }
            )
            
            # Update customer if provided
            if transaction.customer_id:
                await db.customers.update_one(
                    {"id": transaction.customer_id},
                    {
                        "$inc": {
                            "total_spent": transaction.total_amount,
                            "visit_count": 1
                        }
                    }
                )
        
        return {"success": True, "data": transaction_dict, "message": "Transaction created successfully"}
    except Exception as e:
        return {"success": False, "error": str(e)}

# Customer endpoints
@app.get("/customers/")
async def get_customers():
    try:
        if db is not None:
            customers = await db.customers.find().to_list(length=1000)
            if not customers:
                # Initialize with sample data
                sample_customers = [
                    {"id": "1", "name": "John Doe", "email": "john@email.com", "phone": "+91 9876543210", "total_spent": 235.0, "visit_count": 5, "created_at": datetime.now().isoformat()},
                    {"id": "2", "name": "Jane Smith", "email": "jane@email.com", "phone": "+91 9876543211", "total_spent": 150.0, "visit_count": 3, "created_at": datetime.now().isoformat()},
                    {"id": "3", "name": "Bob Wilson", "email": "bob@email.com", "phone": "+91 9876543212", "total_spent": 320.0, "visit_count": 7, "created_at": datetime.now().isoformat()}
                ]
                await db.customers.insert_many(sample_customers)
                customers = sample_customers
            
            customers = convert_objectid_to_str(customers)
            return {"success": True, "data": customers, "count": len(customers)}
        else:
            return {"success": True, "data": [], "count": 0}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/customers/")
async def create_customer(customer: Customer):
    try:
        customer_dict = customer.dict()
        customer_dict["id"] = str(uuid.uuid4())
        customer_dict["total_spent"] = 0.0
        customer_dict["visit_count"] = 0
        customer_dict["created_at"] = datetime.now().isoformat()
        
        if db is not None:
            result = await db.customers.insert_one(customer_dict)
            customer_dict["_id"] = str(result.inserted_id)
        
        return {"success": True, "data": customer_dict, "message": "Customer created successfully"}
    except Exception as e:
        return {"success": False, "error": str(e)}

# Dashboard endpoints
@app.get("/dashboard/overview")
async def get_dashboard_overview():
    try:
        if db is not None:
            # Get current session
            current_session = await db.sessions.find_one({"is_active": True})
            if current_session:
                current_session = convert_objectid_to_str(current_session)
            
            # Get all transactions
            transactions = await db.transactions.find().to_list(length=1000)
            transactions = convert_objectid_to_str(transactions)
            
            # Calculate totals
            total_sales = sum(t.get("total_amount", 0) for t in transactions)
            total_transactions = len(transactions)
            
            # Get today's sales
            today = datetime.now().date()
            today_transactions = []
            for t in transactions:
                timestamp = t.get("timestamp", "")
                if timestamp and isinstance(timestamp, str):
                    try:
                        if datetime.fromisoformat(timestamp).date() == today:
                            today_transactions.append(t)
                    except:
                        pass
            today_sales = sum(t.get("total_amount", 0) for t in today_transactions)
            
            return {
                "success": True,
                "data": {
                    "total_sales": total_sales,
                    "total_transactions": total_transactions,
                    "today_sales": today_sales,
                    "current_session": current_session,
                    "current_session_sales": current_session.get("total_sales", 0) if current_session else 0,
                    "current_session_id": current_session.get("id") if current_session else None
                }
            }
        else:
            return {
                "success": True,
                "data": {
                    "total_sales": 0,
                    "total_transactions": 0,
                    "today_sales": 0,
                    "current_session": None,
                    "current_session_sales": 0,
                    "current_session_id": None
                }
            }
    except Exception as e:
        return {"success": False, "error": str(e)}

# Analytics endpoints
# Inventory endpoints
@app.get("/inventory/")
async def get_inventory():
    try:
        if db is not None:
            items = await db.items.find().to_list(length=1000)
            items = convert_objectid_to_str(items)
            
            # Calculate inventory summary
            total_items = len(items)
            low_stock_items = [i for i in items if i.get("stock", 0) < 10]
            out_of_stock_items = [i for i in items if i.get("stock", 0) == 0]
            
            return {
                "success": True,
                "data": {
                    "total_items": total_items,
                    "low_stock_count": len(low_stock_items),
                    "out_of_stock_count": len(out_of_stock_items),
                    "low_stock_items": low_stock_items,
                    "out_of_stock_items": out_of_stock_items,
                    "all_items": items
                }
            }
        else:
            return {"success": True, "data": {"total_items": 0, "low_stock_count": 0, "out_of_stock_count": 0, "low_stock_items": [], "out_of_stock_items": [], "all_items": []}}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/inventory/alerts")
async def get_inventory_alerts():
    try:
        if db is not None:
            items = await db.items.find().to_list(length=1000)
            items = convert_objectid_to_str(items)
            
            # Get low stock and out of stock alerts
            alerts = []
            for item in items:
                stock = item.get("stock", 0)
                if stock == 0:
                    alerts.append({
                        "type": "out_of_stock",
                        "item": item,
                        "message": f"{item.get('name', 'Unknown')} is out of stock"
                    })
                elif stock < 10:
                    alerts.append({
                        "type": "low_stock",
                        "item": item,
                        "message": f"{item.get('name', 'Unknown')} is running low (only {stock} left)"
                    })
            
            return {
                "success": True,
                "data": {
                    "alerts": alerts,
                    "alert_count": len(alerts),
                    "critical_alerts": len([a for a in alerts if a["type"] == "out_of_stock"])
                }
            }
        else:
            return {"success": True, "data": {"alerts": [], "alert_count": 0, "critical_alerts": 0}}
    except Exception as e:
        return {"success": False, "error": str(e)}

# Analytics endpoints
@app.get("/analytics/sales-trend")
async def get_sales_trend():
    try:
        if db is not None:
            from datetime import timedelta
            end_date = datetime.now()
            start_date = end_date - timedelta(days=7)
            
            # Get transactions from last 7 days
            transactions = await db.transactions.find({
                "timestamp": {
                    "$gte": start_date.isoformat(),
                    "$lte": end_date.isoformat()
                }
            }).to_list(length=1000)
            
            # Group by date
            daily_sales = {}
            for transaction in transactions:
                date = datetime.fromisoformat(transaction["timestamp"]).date()
                if date not in daily_sales:
                    daily_sales[date] = 0
                daily_sales[date] += transaction.get("total_amount", 0)
            
            # Create trend data
            trend_data = []
            for i in range(7):
                date = (end_date - timedelta(days=i)).date()
                trend_data.append({
                    "date": date.isoformat(),
                    "sales": daily_sales.get(date, 0)
                })
            
            trend_data.reverse()
            return {"success": True, "data": trend_data}
        else:
            return {"success": True, "data": []}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/analytics/customer-segments")
async def get_customer_segments():
    try:
        if db is not None:
            customers = await db.customers.find().to_list(length=1000)
            customers = convert_objectid_to_str(customers)
            
            # Segment customers
            segments = {
                "high_value": len([c for c in customers if c.get("total_spent", 0) > 500]),
                "medium_value": len([c for c in customers if 100 <= c.get("total_spent", 0) <= 500]),
                "low_value": len([c for c in customers if c.get("total_spent", 0) < 100])
            }
            
            return {"success": True, "data": segments}
        else:
            return {"success": True, "data": {"high_value": 0, "medium_value": 0, "low_value": 0}}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/analytics/inventory-performance")
async def get_inventory_performance():
    try:
        if db is not None:
            items = await db.items.find().to_list(length=1000)
            items = convert_objectid_to_str(items)
            
            # Analyze inventory
            total_items = len(items)
            low_stock = len([i for i in items if i.get("stock", 0) < 10])
            out_of_stock = len([i for i in items if i.get("stock", 0) == 0])
            
            return {
                "success": True,
                "data": {
                    "total_items": total_items,
                    "low_stock": low_stock,
                    "out_of_stock": out_of_stock,
                    "items": items[:10]  # Top 10 items
                }
            }
        else:
            return {"success": True, "data": {"total_items": 0, "low_stock": 0, "out_of_stock": 0, "items": []}}
    except Exception as e:
        return {"success": False, "error": str(e)}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "SmartPOS AI API is running!",
        "mongodb_available": db is not None,
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "items": "/items/",
            "sessions": "/sessions/",
            "transactions": "/transactions/",
            "customers": "/customers/",
            "dashboard": "/dashboard/overview"
        }
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting SmartPOS AI MongoDB Backend on http://localhost:5000")
    print("All data will be stored in MongoDB for persistence")
    uvicorn.run(app, host="0.0.0.0", port=5000)
