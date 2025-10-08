from fastapi import APIRouter, HTTPException
from app.core.database import get_items_collection
from bson import ObjectId
import re

router = APIRouter(prefix="/bulk-import", tags=["bulk-import"])

@router.post("/items")
async def bulk_import_items(items_data: str):
    """
    Import multiple items from text format:
    "Item Name - Price - Category" per line
    """
    collection = get_items_collection()
    
    lines = items_data.strip().split('\n')
    imported_items = []
    errors = []
    
    for i, line in enumerate(lines, 1):
        if not line.strip():
            continue
            
        try:
            # Support multiple formats: "Name - Price - Category" or "Name, Price, Category"
            parts = re.split(r'[-,]', line.strip())
            parts = [part.strip() for part in parts if part.strip()]
            
            if len(parts) < 2:
                errors.append(f"Line {i}: Invalid format - '{line}'")
                continue
                
            item_data = {
                "name": parts[0],
                "price": float(parts[1]),
                "category": parts[2] if len(parts) > 2 else "General",
                "is_active": True
            }
            
            # Check if item already exists
            existing = collection.find_one({"name": item_data["name"]})
            if existing:
                result = collection.update_one(
                    {"_id": existing["_id"]},
                    {"$set": item_data}
                )
                action = "updated"
            else:
                result = collection.insert_one(item_data)
                action = "created"
                
            imported_items.append({
                "name": item_data["name"],
                "price": item_data["price"],
                "category": item_data["category"],
                "action": action
            })
            
        except ValueError:
            errors.append(f"Line {i}: Invalid price format - '{line}'")
        except Exception as e:
            errors.append(f"Line {i}: Error - {str(e)}")
    
    return {
        "imported": len(imported_items),
        "errors": len(errors),
        "items": imported_items,
        "error_details": errors
    }