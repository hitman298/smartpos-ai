from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId

# Assume get_items_collection() is defined elsewhere to return the collection
# For example:
def get_items_collection():
    client = MongoClient("mongodb://localhost:27017/") # Replace with your MongoDB URI
    db = client["mydatabase"]
    return db["items"]

router = APIRouter()

# Pydantic Models
class Item(BaseModel):
    name: str
    price: float
    category: Optional[str] = None
    is_active: bool = True
    created_at: datetime = datetime.now()

class ItemInDB(Item):
    id: str

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None

# API Endpoint
@router.post("/", response_model=ItemInDB)
async def create_item(item: Item):
    collection = get_items_collection()
    
    # Check if item already exists
    if collection.find_one({"name": item.name, "is_active": True}):
        raise HTTPException(status_code=400, detail="Item already exists")
    
    # Convert to dict and insert
    item_dict = item.dict()
    result = collection.insert_one(item_dict)
    
    # Return the created item
    new_item = collection.find_one({"_id": result.inserted_id})
    if not new_item:
        raise HTTPException(status_code=500, detail="Failed to retrieve created item")
        
    new_item["id"] = str(new_item.pop("_id"))
    return new_item