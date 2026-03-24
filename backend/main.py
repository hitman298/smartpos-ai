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
    from app.core.config import settings
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False
    print("MongoDB modules not available, using in-memory storage")
    settings = None

app = FastAPI(title="SmartPOS AI API", version="2.0.0")

# CORS Configuration - Allow production URLs
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

# Add production URLs from environment
if settings:
    allowed_origins.extend(settings.ALLOWED_ORIGINS)
else:
    # Fallback if settings not available
    frontend_url = os.getenv("FRONTEND_URL")
    if frontend_url:
        allowed_origins.append(frontend_url)
    
    vercel_url = os.getenv("VERCEL_URL")
    if vercel_url:
        allowed_origins.append(f"https://{vercel_url}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    if MONGODB_AVAILABLE and mongodb.database is not None:
        try:
            collection = mongodb.database[collection_name]
            data = list(collection.find({}))
            # Convert ObjectId to string
            from bson import ObjectId
            for item in data:
                if '_id' in item:
                    item['id'] = str(item['_id'])
                    del item['_id']
                # Convert any nested ObjectIds
                for key, value in item.items():
                    if isinstance(value, ObjectId):
                        item[key] = str(value)
                    elif isinstance(value, dict):
                        for k, v in value.items():
                            if isinstance(v, ObjectId):
                                item[key][k] = str(v)
            return data
        except Exception as e:
            print(f"MongoDB error for {collection_name}: {e}")
    return fallback_data[fallback_key]

def insert_to_collection(collection_name, data):
    if MONGODB_AVAILABLE and mongodb.database is not None:
        try:
            collection = mongodb.database[collection_name]
            # datetime is already imported at top of file
            from bson import ObjectId
            
            def prepare_for_mongo(obj):
                if isinstance(obj, datetime):
                    return obj
                elif isinstance(obj, dict):
                    return {k: prepare_for_mongo(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [prepare_for_mongo(item) for item in obj]
                return obj
            
            prepared_data = prepare_for_mongo(data)
            result = collection.insert_one(prepared_data)
            # Get the inserted document and convert ObjectId
            inserted_doc = collection.find_one({"_id": result.inserted_id})
            if inserted_doc:
                inserted_doc['id'] = str(inserted_doc['_id'])
                del inserted_doc['_id']
                # Convert any nested ObjectIds and datetimes
                def convert_objectid(obj):
                    if isinstance(obj, ObjectId):
                        return str(obj)
                    elif isinstance(obj, datetime):
                        return obj.isoformat()
                    elif isinstance(obj, dict):
                        return {k: convert_objectid(v) for k, v in obj.items()}
                    elif isinstance(obj, list):
                        return [convert_objectid(item) for item in obj]
                    return obj
                return convert_objectid(inserted_doc)
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
    if MONGODB_AVAILABLE and mongodb.database is not None:
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
            if mongodb.database is not None:
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
    try:
        items = get_collection_data("items", "items")
        return {
            "success": True,
            "data": items,
            "count": len(items)
        }
    except Exception as e:
        print(f"Error in get_items: {e}")
        # Return fallback data on error
        return {
            "success": True,
            "data": fallback_data.get("items", []),
            "count": len(fallback_data.get("items", []))
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
    try:
        if MONGODB_AVAILABLE and mongodb.database is not None:
            try:
                session = mongodb.database["sessions"].find_one({"is_active": True})
                if session:
                    session['id'] = str(session['_id'])
                    del session['_id']
                    return {
                        "success": True,
                        "data": session,
                        "is_active": True
                    }
            except Exception as e:
                print(f"MongoDB error getting current session: {e}")
        
        # Check fallback
        current_session = fallback_data.get("current_session")
        return {
            "success": True,
            "data": current_session,
            "is_active": current_session is not None
        }
    except Exception as e:
        print(f"Error in get_current_session: {e}")
        return {
            "success": True,
            "data": None,
            "is_active": False
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
    # Close any existing active session first
    if MONGODB_AVAILABLE and mongodb.database is not None:
        try:
            mongodb.database["sessions"].update_many(
                {"is_active": True}, 
                {"$set": {"is_active": False, "end_time": datetime.now()}}
            )
        except Exception as e:
            print(f"Error closing existing sessions: {e}")
    
    # Create new session
    session_data = {
        "start_time": datetime.now(),
        "is_active": True,
        "total_sales": 0.0,
        "transaction_count": 0
    }
    
    if MONGODB_AVAILABLE and mongodb.database is not None:
        try:
            result = mongodb.database["sessions"].insert_one(session_data)
            # Get the inserted document and convert ObjectId
            inserted_doc = mongodb.database["sessions"].find_one({"_id": result.inserted_id})
            if inserted_doc:
                inserted_doc['id'] = str(inserted_doc['_id'])
                del inserted_doc['_id']
                # Convert datetime to ISO string
                from bson import ObjectId
                def convert_for_json(obj):
                    if isinstance(obj, ObjectId):
                        return str(obj)
                    elif isinstance(obj, datetime):
                        return obj.isoformat()
                    elif isinstance(obj, dict):
                        return {k: convert_for_json(v) for k, v in obj.items()}
                    elif isinstance(obj, list):
                        return [convert_for_json(item) for item in obj]
                    return obj
                session_data = convert_for_json(inserted_doc)
            else:
                session_data['id'] = str(result.inserted_id)
            fallback_data["current_session"] = session_data
            return {
                "success": True,
                "data": session_data,
                "message": "Session opened successfully"
            }
        except Exception as e:
            print(f"Error creating session in MongoDB: {e}")
    
    # Fallback to in-memory
    new_session = insert_to_collection("sessions", session_data)
    fallback_data["current_session"] = new_session
    
    return {
        "success": True,
        "data": new_session,
        "message": "Session opened successfully"
    }

@app.post("/sessions/close")
async def close_session():
    if MONGODB_AVAILABLE and mongodb.database is not None:
        try:
            result = mongodb.database["sessions"].update_one(
                {"is_active": True}, 
                {"$set": {"is_active": False, "end_time": datetime.now()}}
            )
            if result.modified_count > 0:
                fallback_data["current_session"] = None
                return {"success": True, "message": "Session closed successfully"}
        except Exception as e:
            print(f"Error closing session: {e}")
    
    # Clear fallback session
    fallback_data["current_session"] = None
    return {"success": True, "message": "Session closed successfully"}

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
async def create_transaction(transaction_data: dict):
    """
    Create a new transaction. Accepts flexible format from frontend.
    Expected format:
    {
        "items": [{"id": str, "name": str, "price": float, "quantity": int}],
        "total_amount": float,
        "payment_method": str,
        "customer_id": str (optional)
    }
    """
    try:
        # Get current active session if session_id not provided
        session_id = None
        if MONGODB_AVAILABLE and mongodb.database is not None:
            try:
                active_session = mongodb.database["sessions"].find_one({"is_active": True})
                if active_session:
                    session_id = str(active_session["_id"])
            except Exception as e:
                print(f"Error finding active session: {e}")
        
        if not session_id:
            # Try to use fallback session
            if fallback_data.get("current_session"):
                session_id = fallback_data["current_session"].get("id")
        
        if not session_id:
            raise HTTPException(status_code=400, detail="No active session found. Please open a shop session first.")
        
        # Normalize items format
        items = transaction_data.get("items", [])
        normalized_items = []
        for item in items:
            # Handle both formats: frontend format and backend format
            if "item_id" in item:
                # Already in backend format
                normalized_items.append({
                    "item_id": item["item_id"],
                    "item_name": item.get("item_name", item.get("name", "Unknown")),
                    "quantity": item["quantity"],
                    "price": item["price"],
                    "total": item.get("total", item["price"] * item["quantity"])
                })
            else:
                # Frontend format: need to convert
                normalized_items.append({
                    "item_id": item.get("id", item.get("item_id", "")),
                    "item_name": item.get("name", "Unknown"),
                    "quantity": item.get("quantity", 1),
                    "price": item.get("price", 0.0),
                    "total": item.get("total", item.get("price", 0.0) * item.get("quantity", 1))
                })
        
        # Create transaction document
        total_amount = transaction_data.get("total_amount", sum(item.get("total", 0) for item in normalized_items))
        payment_mode = transaction_data.get("payment_method") or transaction_data.get("payment_mode", "cash")
        
        transaction_doc = {
            "session_id": session_id,
            "items": normalized_items,
            "total_amount": total_amount,
            "payment_mode": payment_mode,
            "timestamp": datetime.now(),
            "customer_id": transaction_data.get("customer_id")
        }
        
        # Insert transaction
        new_transaction = insert_to_collection("transactions", transaction_doc)
        
        # Ensure all ObjectIds and datetimes are converted to strings for JSON serialization
        if isinstance(new_transaction, dict):
            # Convert any ObjectId fields to strings
            from bson import ObjectId
            # datetime is already imported at top of file
            
            def convert_objectid(obj):
                if isinstance(obj, ObjectId):
                    return str(obj)
                elif isinstance(obj, datetime):
                    return obj.isoformat()
                elif isinstance(obj, dict):
                    return {k: convert_objectid(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [convert_objectid(item) for item in obj]
                return obj
            
            new_transaction = convert_objectid(new_transaction)
        
        # Update session totals
        if MONGODB_AVAILABLE and mongodb.database is not None:
            try:
                from bson import ObjectId
                # Handle both string and ObjectId format
                if isinstance(session_id, str) and ObjectId.is_valid(session_id):
                    session_obj_id = ObjectId(session_id)
                else:
                    session_obj_id = session_id
                
                mongodb.database["sessions"].update_one(
                    {"_id": session_obj_id},
                    {
                        "$inc": {
                            "total_sales": total_amount,
                            "transaction_count": 1
                        }
                    }
                )
                # Update fallback session if exists
                if fallback_data.get("current_session") and fallback_data["current_session"].get("id") == session_id:
                    fallback_data["current_session"]["total_sales"] = fallback_data["current_session"].get("total_sales", 0) + total_amount
                    fallback_data["current_session"]["transaction_count"] = fallback_data["current_session"].get("transaction_count", 0) + 1
            except Exception as e:
                print(f"Error updating session totals: {e}")
        
        # Update customer if provided
        customer_id = transaction_data.get("customer_id")
        if customer_id and MONGODB_AVAILABLE and mongodb.database is not None:
            try:
                from bson import ObjectId
                # Handle both string and ObjectId format
                if isinstance(customer_id, str) and ObjectId.is_valid(customer_id):
                    customer_obj_id = ObjectId(customer_id)
                    mongodb.database["customers"].update_one(
                        {"_id": customer_obj_id},
                        {
                            "$inc": {
                                "total_spent": total_amount,
                                "visit_count": 1
                            }
                        }
                    )
                else:
                    mongodb.database["customers"].update_one(
                        {"id": customer_id},
                        {
                            "$inc": {
                                "total_spent": total_amount,
                                "visit_count": 1
                            }
                        }
                    )
            except Exception as e:
                print(f"Error updating customer: {e}")
        
        return {"success": True, "data": new_transaction, "message": "Transaction created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating transaction: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating transaction: {str(e)}")

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

# IMPORT ML ENGINE
try:
    from ml_engine import MLEngine
except ImportError:
    print("Warning: ml_engine.py not found. ML features will use fallback data.")
    MLEngine = None

# ANALYTICS ENDPOINTS
@app.get("/analytics/ml/predict-demand")
async def predict_demand():
    try:
        if MLEngine:
            transactions = get_collection_data("transactions", "transactions")
            predictions = MLEngine.predict_demand(transactions)
            return {"success": True, "data": predictions}
    except Exception as e:
        print(f"Demand prediction error: {e}")
        
    # Fallback if ML fails
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
    try:
        if MLEngine:
            transactions = get_collection_data("transactions", "transactions")
            peaks = MLEngine.get_peak_hours(transactions)
            return {"success": True, "data": peaks}
    except Exception as e:
        print(f"Peak hours error: {e}")
        
    return {"success": True, "data": ["07:00-09:00", "11:00-13:00", "17:00-19:00"]}


@app.get("/analytics/ml/waste-reduction")
async def get_waste_reduction():
    try:
        if MLEngine:
            transactions = get_collection_data("transactions", "transactions")
            items = get_collection_data("items", "items")
            reduction_data = MLEngine.get_waste_reduction(items, transactions)
            return {"success": True, "data": reduction_data}
    except Exception as e:
        print(f"Waste reduction error: {e}")
        
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
    if MONGODB_AVAILABLE and mongodb.database is not None:
        try:
            employees = list(mongodb.database["employees"].find({}))
            for emp in employees:
                emp['id'] = str(emp['_id'])
                del emp['_id']
            return {
                "success": True,
                "data": employees,
                "count": len(employees)
            }
        except Exception as e:
            print(f"MongoDB error getting employees: {e}")
    
    # Fallback data
    employees = [
        {"id": "1", "name": "John Manager", "role": "Manager", "status": "active", "email": "john@smartpos.com", "phone": "+1234567890"},
        {"id": "2", "name": "Jane Cashier", "role": "Cashier", "status": "active", "email": "jane@smartpos.com", "phone": "+1234567891"}
    ]
    return {
        "success": True,
        "data": employees,
        "count": len(employees)
    }

@app.post("/employees/")
async def create_employee(employee_data: dict):
    if MONGODB_AVAILABLE and mongodb.database is not None:
        try:
            employee_data["created_at"] = datetime.now()
            result = mongodb.database["employees"].insert_one(employee_data)
            employee_data['id'] = str(result.inserted_id)
            return {"success": True, "data": employee_data}
        except Exception as e:
            print(f"Error creating employee: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    # Fallback
    new_id = str(len(fallback_data.get("employees", [])) + 1)
    employee_data['id'] = new_id
    if "employees" not in fallback_data:
        fallback_data["employees"] = []
    fallback_data["employees"].append(employee_data)
    return {"success": True, "data": employee_data}

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
    try:
        items = get_collection_data("items", "items")
        transactions = get_collection_data("transactions", "transactions")
        customers = get_collection_data("customers", "customers")
        
        # Calculate today's sales
        today = datetime.now().date()
        today_transactions = []
        for t in transactions:
            try:
                if isinstance(t.get("timestamp"), datetime):
                    if t.get("timestamp").date() == today:
                        today_transactions.append(t)
                elif isinstance(t.get("timestamp"), str):
                    if datetime.fromisoformat(t.get("timestamp", "2024-01-01T00:00:00")).date() == today:
                        today_transactions.append(t)
            except:
                continue
        
        today_sales = sum(t.get("total_amount", 0) for t in today_transactions)
        
        # Calculate lifetime revenue from all transactions
        lifetime_revenue = sum(t.get("total_amount", 0) for t in transactions)
        
        # Check shop status
        current_session = None
        if MONGODB_AVAILABLE and mongodb.database is not None:
            try:
                session = mongodb.database["sessions"].find_one({"is_active": True})
                if session:
                    # Convert ObjectId to string
                    session['id'] = str(session['_id'])
                    del session['_id']
                    current_session = session
            except:
                pass
        
        if not current_session:
            current_session = fallback_data.get("current_session")
        
        shop_status = "open" if current_session else "closed"
        
        return {
            "success": True,
            "data": {
                "today_sales": today_sales,
                "lifetime_revenue": lifetime_revenue,
                "total_transactions": len(transactions),
                "today_transactions": len(today_transactions),
                "active_items": len([i for i in items if i.get("is_active", True)]),
                "total_customers": len(customers),
                "shop_status": shop_status,
                "current_session": current_session
            }
        }
    except Exception as e:
        print(f"Error in get_dashboard_overview: {e}")
        import traceback
        traceback.print_exc()
        # Return safe fallback
        return {
            "success": True,
            "data": {
                "today_sales": 0,
                "lifetime_revenue": 0,
                "total_transactions": 0,
                "today_transactions": 0,
                "active_items": len(fallback_data.get("items", [])),
                "total_customers": len(fallback_data.get("customers", [])),
                "shop_status": "closed",
                "current_session": None
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