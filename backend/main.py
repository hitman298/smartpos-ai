from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import MongoDB connection
try:
    from app.core.database import connect_to_mongo, close_mongo_connection, mongodb
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False
    print("MongoDB modules not available, using in-memory storage")

app = FastAPI(title="SmartPOS AI API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class Item(BaseModel):
    name: str
    price: float
    category: str = "General"
    stock: int = 0

class ItemCreate(BaseModel):
    name: str
    price: float
    category: str = "General"
    stock: int = 0

class Session(BaseModel):
    start_time: datetime
    is_active: bool = True
    total_sales: float = 0.0
    transaction_count: int = 0

class TransactionItem(BaseModel):
    item_id: str
    item_name: str
    quantity: int
    price: float
    total: float

class Transaction(BaseModel):
    session_id: str
    items: List[TransactionItem]
    total_amount: float
    payment_mode: str
    timestamp: datetime = datetime.now()

class Customer(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    total_spent: float = 0.0
    visit_count: int = 0

# In-memory fallback data
fallback_data = {
    "items": [
        {"id": "1", "name": "Tea", "price": 20.0, "category": "Beverage", "stock": 50},
        {"id": "2", "name": "Samosa", "price": 15.0, "category": "Snack", "stock": 45},
        {"id": "3", "name": "Mojito", "price": 50.0, "category": "Mocktail", "stock": 30},
        {"id": "4", "name": "Lemon Tea", "price": 20.0, "category": "Herbal Tea", "stock": 40},
        {"id": "5", "name": "Allam Tea", "price": 25.0, "category": "Tea", "stock": 35},
        {"id": "6", "name": "Egg Puff", "price": 35.0, "category": "Snacks", "stock": 25}
    ],
    "sessions": [],
    "transactions": [],
    "customers": [
        {"id": "1", "name": "John Doe", "email": "john@email.com", "total_spent": 235.0, "visit_count": 5},
        {"id": "2", "name": "Jane Smith", "email": "jane@email.com", "total_spent": 150.0, "visit_count": 3}
    ],
    "current_session": None
}

# Database helper functions
def get_collection_data(collection_name, fallback_key):
    if MONGODB_AVAILABLE and mongodb.database:
        try:
            collection = mongodb.database[collection_name]
            data = list(collection.find({}))
            # Convert ObjectId to string
            for item in data:
                if '_id' in item:
                    item['id'] = str(item['_id'])
                    del item['_id']
            return data
        except Exception as e:
            print(f"MongoDB error for {collection_name}: {e}")
    return fallback_data[fallback_key]

def insert_to_collection(collection_name, data):
    if MONGODB_AVAILABLE and mongodb.database:
        try:
            collection = mongodb.database[collection_name]
            result = collection.insert_one(data)
            data['id'] = str(result.inserted_id)
            return data
        except Exception as e:
            print(f"MongoDB insert error for {collection_name}: {e}")
    
    # Fallback to in-memory
    new_id = str(len(fallback_data.get(collection_name, [])) + 1)
    data['id'] = new_id
    if collection_name not in fallback_data:
        fallback_data[collection_name] = []
    fallback_data[collection_name].append(data)
    return data

def update_collection_item(collection_name, item_id, update_data):
    if MONGODB_AVAILABLE and mongodb.database:
        try:
            from bson import ObjectId
            collection = mongodb.database[collection_name]
            collection.update_one({"_id": ObjectId(item_id)}, {"$set": update_data})
            return True
        except Exception as e:
            print(f"MongoDB update error for {collection_name}: {e}")
    
    # Fallback to in-memory
    items = fallback_data.get(collection_name, [])
    for item in items:
        if item.get('id') == item_id:
            item.update(update_data)
            return True
    return False

# Startup event
@app.on_event("startup")
async def startup_event():
    if MONGODB_AVAILABLE:
        connect_to_mongo()
        # Initialize with sample data if collections are empty
        try:
            if mongodb.database:
                items_count = mongodb.database["items"].count_documents({})
                if items_count == 0:
                    # Insert sample items
                    for item in fallback_data["items"]:
                        item_copy = item.copy()
                        if 'id' in item_copy:
                            del item_copy['id']
                        mongodb.database["items"].insert_one(item_copy)
                    print("Inserted sample items to MongoDB")
                
                customers_count = mongodb.database["customers"].count_documents({})
                if customers_count == 0:
                    # Insert sample customers
                    for customer in fallback_data["customers"]:
                        customer_copy = customer.copy()
                        if 'id' in customer_copy:
                            del customer_copy['id']
                        mongodb.database["customers"].insert_one(customer_copy)
                    print("Inserted sample customers to MongoDB")
        except Exception as e:
            print(f"Error initializing sample data: {e}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    if MONGODB_AVAILABLE:
        close_mongo_connection()

# ITEMS ENDPOINTS
@app.get("/items/")
async def get_items():
    items = get_collection_data("items", "items")
    return {
        "success": True,
        "data": items,
        "count": len(items)
    }

@app.post("/items/")
async def create_item(item: ItemCreate):
    item_data = item.dict()
    item_data["created_at"] = datetime.now()
    new_item = insert_to_collection("items", item_data)
    return {"success": True, "data": new_item}

@app.put("/items/{item_id}")
async def update_item(item_id: str, item: ItemCreate):
    success = update_collection_item("items", item_id, item.dict())
    if success:
        return {"success": True, "message": "Item updated successfully"}
    raise HTTPException(status_code=404, detail="Item not found")

@app.delete("/items/{item_id}")
async def delete_item(item_id: str):
    success = update_collection_item("items", item_id, {"is_active": False})
    if success:
        return {"success": True, "message": "Item deleted successfully"}
    raise HTTPException(status_code=404, detail="Item not found")

# SESSIONS ENDPOINTS
@app.get("/sessions/current")
async def get_current_session():
    if MONGODB_AVAILABLE and mongodb.database:
        try:
            session = mongodb.database["sessions"].find_one({"is_active": True})
            if session:
                session['id'] = str(session['_id'])
                del session['_id']
            return {
                "success": True,
                "data": session,
                "is_active": session is not None
            }
        except Exception as e:
            print(f"MongoDB error getting current session: {e}")
    
    return {
        "success": True,
        "data": fallback_data["current_session"],
        "is_active": fallback_data["current_session"] is not None
    }

@app.get("/sessions/")
async def get_sessions():
    sessions = get_collection_data("sessions", "sessions")
    return {
        "success": True,
        "data": sessions,
        "count": len(sessions)
    }

@app.post("/sessions/open")
async def open_session():
    # Close any existing active session
    if MONGODB_AVAILABLE and mongodb.database:
        try:
            mongodb.database["sessions"].update_many(
                {"is_active": True}, 
                {"$set": {"is_active": False, "end_time": datetime.now()}}
            )
        except Exception as e:
            print(f"Error closing existing sessions: {e}")
    
    session_data = {
        "start_time": datetime.now(),
        "is_active": True,
        "total_sales": 0.0,
        "transaction_count": 0
    }
    
    new_session = insert_to_collection("sessions", session_data)
    fallback_data["current_session"] = new_session
    
    return {
        "success": True,
        "data": new_session,
        "message": "Session opened successfully"
    }

@app.post("/sessions/close")
async def close_session():
    if MONGODB_AVAILABLE and mongodb.database:
        try:
            result = mongodb.database["sessions"].update_one(
                {"is_active": True}, 
                {"$set": {"is_active": False, "end_time": datetime.now()}}
            )
            if result.modified_count > 0:
                fallback_data["current_session"] = None
                return {"success": True, "message": "Session closed"}
        except Exception as e:
            print(f"Error closing session: {e}")
    
    fallback_data["current_session"] = None
    return {"success": True, "message": "Session closed"}

# TRANSACTIONS ENDPOINTS
@app.get("/transactions/")
async def get_transactions():
    transactions = get_collection_data("transactions", "transactions")
    return {
        "success": True,
        "data": transactions,
        "count": len(transactions)
    }

@app.post("/transactions/")
async def create_transaction(transaction: Transaction):
    transaction_data = transaction.dict()
    new_transaction = insert_to_collection("transactions", transaction_data)
    
    # Update session totals
    if MONGODB_AVAILABLE and mongodb.database:
        try:
            from bson import ObjectId
            mongodb.database["sessions"].update_one(
                {"_id": ObjectId(transaction.session_id)},
                {
                    "$inc": {
                        "total_sales": transaction.total_amount,
                        "transaction_count": 1
                    }
                }
            )
        except Exception as e:
            print(f"Error updating session totals: {e}")
    
    return {"success": True, "data": new_transaction}

# INVENTORY ENDPOINTS
@app.get("/inventory/")
async def get_inventory():
    items = get_collection_data("items", "items")
    inventory = [
        {
            "id": item["id"], 
            "name": item["name"], 
            "stock": item.get("stock", 0), 
            "min_stock": 10,
            "category": item.get("category", "General")
        } 
        for item in items
    ]
    return {
        "success": True,
        "data": inventory,
        "count": len(inventory)
    }

@app.get("/inventory/alerts")
async def get_inventory_alerts():
    items = get_collection_data("items", "items")
    alerts = [item for item in items if item.get("stock", 0) < 15]
    return {
        "success": True,
        "data": alerts,
        "count": len(alerts)
    }

# CUSTOMERS ENDPOINTS
@app.get("/customers/")
async def get_customers():
    customers = get_collection_data("customers", "customers")
    return {
        "success": True,
        "data": customers,
        "count": len(customers)
    }

@app.post("/customers/")
async def create_customer(customer: Customer):
    customer_data = customer.dict()
    customer_data["created_at"] = datetime.now()
    new_customer = insert_to_collection("customers", customer_data)
    return {"success": True, "data": new_customer}

# ANALYTICS ENDPOINTS
@app.get("/analytics/ml/predict-demand")
async def predict_demand():
    predictions = [
        {"hour": "08:00", "demand": 15},
        {"hour": "10:00", "demand": 25},
        {"hour": "12:00", "demand": 45},
        {"hour": "14:00", "demand": 30},
        {"hour": "16:00", "demand": 35},
        {"hour": "18:00", "demand": 20}
    ]
    return {"success": True, "data": predictions}

@app.get("/analytics/ml/peak-hours")
async def get_peak_hours():
    return {"success": True, "data": ["07:00-09:00", "11:00-13:00", "17:00-19:00"]}

@app.get("/analytics/ml/waste-reduction")
async def get_waste_reduction():
    return {
        "success": True, 
        "data": {
            "waste_reduction": "23%",
            "suggestions": ["Reduce stock of slow-moving items", "Optimize portion sizes"]
        }
    }

# EMPLOYEES ENDPOINTS
@app.get("/employees/")
async def get_employees():
    employees = [
        {"id": "1", "name": "John Manager", "role": "Manager", "status": "active"},
        {"id": "2", "name": "Jane Cashier", "role": "Cashier", "status": "active"}
    ]
    return {
        "success": True,
        "data": employees,
        "count": len(employees)
    }

# REPORTS ENDPOINTS
@app.get("/reports/sales")
async def get_sales_report():
    return {
        "success": True,
        "data": {
            "today_sales": 1250.50,
            "weekly_sales": 8750.25,
            "monthly_sales": 35000.00,
            "top_items": [
                {"name": "Tea", "quantity": 45, "revenue": 900.00},
                {"name": "Samosa", "quantity": 32, "revenue": 480.00}
            ]
        }
    }

@app.get("/reports/inventory")
async def get_inventory_report():
    return {
        "success": True,
        "data": {
            "total_items": 25,
            "low_stock_items": 3,
            "out_of_stock": 1,
            "total_value": 5000.00
        }
    }

# DASHBOARD ENDPOINT
@app.get("/dashboard/overview")
async def get_dashboard_overview():
    items = get_collection_data("items", "items")
    transactions = get_collection_data("transactions", "transactions")
    customers = get_collection_data("customers", "customers")
    
    # Calculate today's sales
    today = datetime.now().date()
    today_sales = sum(
        t.get("total_amount", 0) 
        for t in transactions 
        if datetime.fromisoformat(t.get("timestamp", "2024-01-01T00:00:00")).date() == today
    )
    
    return {
        "success": True,
        "data": {
            "today_sales": today_sales,
            "total_transactions": len(transactions),
            "active_items": len([i for i in items if i.get("is_active", True)]),
            "total_customers": len(customers),
            "shop_status": "open" if fallback_data["current_session"] else "closed"
        }
    }

# HEALTH CHECK
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "mongodb_connected": MONGODB_AVAILABLE and mongodb.database is not None
    }

@app.get("/")
async def root():
    return {"message": "SmartPOS AI API is running!", "mongodb_available": MONGODB_AVAILABLE}

if __name__ == "__main__":
    print("Starting SmartPOS AI Backend on http://localhost:5000")
    print("All endpoints available with MongoDB integration")
    uvicorn.run(app, host="0.0.0.0", port=5000)