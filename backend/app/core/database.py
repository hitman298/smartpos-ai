import pymongo
from app.core.config import settings

class MongoDB:
    client = None
    database = None
    items = None
    sessions = None
    transactions = None  # Collection that needs a getter
    inventory = None
    customers = None
    employees = None

mongodb = MongoDB()

def connect_to_mongo():
    try:
        mongodb.client = pymongo.MongoClient(settings.MONGODB_URL)
        mongodb.database = mongodb.client[settings.MONGODB_DB_NAME]
        
        # Initialize all collections
        mongodb.items = mongodb.database["items"]
        mongodb.sessions = mongodb.database["sessions"]
        mongodb.transactions = mongodb.database["transactions"]
        mongodb.inventory = mongodb.database["inventory"]
        mongodb.customers = mongodb.database["customers"]
        mongodb.employees = mongodb.database["employees"]
        
        # Create indexes
        mongodb.items.create_index("name", unique=True)
        mongodb.sessions.create_index("is_active")
        mongodb.customers.create_index("phone", unique=True)
        mongodb.inventory.create_index("item_id", unique=True)
        
        print("Connected to MongoDB successfully!")
        return True
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        return False

def close_mongo_connection():
    if mongodb.client:
        mongodb.client.close()
        print("MongoDB connection closed.")

# --------------------------------------------------------------------
# FINAL FIX: Add the missing 'get_transactions_collection' function
# --------------------------------------------------------------------
def get_transactions_collection():
    return mongodb.transactions

# All other collection getters previously fixed
def get_sessions_collection():
    return mongodb.sessions

def get_items_collection():
    return mongodb.items

def get_inventory_collection():
    return mongodb.inventory

def get_customers_collection():
    return mongodb.customers

def get_employees_collection():
    return mongodb.employees