from fastapi import APIRouter, HTTPException
from app.models.inventory import InventoryItem, InventoryItemResponse, InventoryUpdate, InventoryAlert
from app.core.database import get_inventory_collection, get_items_collection
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/inventory", tags=["inventory"])

@router.get("/", response_model=list[InventoryItemResponse])
async def get_inventory():
    collection = get_inventory_collection()
    items_collection = get_items_collection()
    
    inventory = list(collection.find())
    result = []
    
    for item in inventory:
        # Get item details
        item_details = items_collection.find_one({"_id": ObjectId(item["item_id"])})
        if item_details:
            result.append({
                "id": str(item["_id"]),
                "item_id": item["item_id"],
                "item_name": item_details["name"],
                "price": item_details["price"],
                "category": item_details.get("category", "General"),
                "current_stock": item.get("current_stock", 0),
                "minimum_stock": item.get("minimum_stock", 5),
                "maximum_stock": item.get("maximum_stock"),
                "cost_price": item.get("cost_price"),
                "supplier": item.get("supplier"),
                "last_restocked": item.get("last_restocked"),
                "alert_enabled": item.get("alert_enabled", True)
            })
        else:
            # Item might have been deleted, but inventory record exists
            result.append({
                "id": str(item["_id"]),
                "item_id": item["item_id"],
                "item_name": "Unknown Item",
                "price": 0,
                "category": "Unknown",
                "current_stock": item.get("current_stock", 0),
                "minimum_stock": item.get("minimum_stock", 5),
                "maximum_stock": item.get("maximum_stock"),
                "cost_price": item.get("cost_price"),
                "supplier": item.get("supplier"),
                "last_restocked": item.get("last_restocked"),
                "alert_enabled": item.get("alert_enabled", True)
            })
    
    return result

@router.post("/{item_id}")
async def update_inventory(item_id: str, update: InventoryUpdate):
    inventory_collection = get_inventory_collection()
    items_collection = get_items_collection()
    
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID")
    
    # Check if item exists
    item = items_collection.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Update or create inventory record
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["last_restocked"] = datetime.now()
    
    result = inventory_collection.update_one(
        {"item_id": item_id},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Inventory updated successfully", "item_id": item_id}

@router.get("/alerts", response_model=list[InventoryAlert])
async def get_inventory_alerts():
    inventory_collection = get_inventory_collection()
    items_collection = get_items_collection()
    
    alerts = []
    inventory_items = list(inventory_collection.find())
    
    for item in inventory_items:
        item_details = items_collection.find_one({"_id": ObjectId(item["item_id"])})
        if not item_details:
            continue
            
        current_stock = item.get("current_stock", 0)
        min_stock = item.get("minimum_stock", 5)
        item_name = item_details["name"]
        
        if current_stock <= 0:
            alerts.append({
                "item_id": item["item_id"],
                "item_name": item_name,
                "current_stock": current_stock,
                "minimum_stock": min_stock,
                "alert_type": "out_of_stock",
                "message": f"{item_name} is out of stock!"
            })
        elif current_stock <= min_stock:
            alerts.append({
                "item_id": item["item_id"],
                "item_name": item_name,
                "current_stock": current_stock,
                "minimum_stock": min_stock,
                "alert_type": "low_stock",
                "message": f"{item_name} is low on stock ({current_stock} left)"
            })
    
    return alerts