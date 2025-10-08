from fastapi import APIRouter, HTTPException
from app.models.item import Item, ItemInDB, ItemUpdate
from app.core.database import get_items_collection
from bson import ObjectId

router = APIRouter(prefix="/items", tags=["items"])

@router.post("/", response_model=ItemInDB)
async def create_item(item: Item):
    collection = get_items_collection()
    
    # Check if item already exists
    if collection.find_one({"name": item.name}):
        raise HTTPException(status_code=400, detail="Item already exists")
    
    result = collection.insert_one(item.dict())
    new_item = collection.find_one({"_id": result.inserted_id})
    
    return {**new_item, "id": str(new_item["_id"])}

@router.get("/", response_model=list[ItemInDB])
async def get_all_items():
    collection = get_items_collection()
    items = list(collection.find({"is_active": True}))
    
    return [{**item, "id": str(item["_id"])} for item in items]

@router.get("/{item_id}", response_model=ItemInDB)
async def get_item(item_id: str):
    collection = get_items_collection()
    
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID")
    
    item = collection.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {**item, "id": str(item["_id"])}

@router.put("/{item_id}", response_model=ItemInDB)
async def update_item(item_id: str, item_update: ItemUpdate):
    collection = get_items_collection()
    
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID")
    
    update_data = {k: v for k, v in item_update.dict().items() if v is not None}
    
    result = collection.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    updated_item = collection.find_one({"_id": ObjectId(item_id)})
    return {**updated_item, "id": str(updated_item["_id"])}

@router.delete("/{item_id}")
async def delete_item(item_id: str):
    collection = get_items_collection()
    
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID")
    
    result = collection.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": {"is_active": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {"message": "Item deleted successfully"}