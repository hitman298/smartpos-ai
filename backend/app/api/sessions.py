from fastapi import APIRouter, HTTPException
from app.models.session import ShopSession, ShopSessionInDB, ShopSessionUpdate
from app.core.database import get_sessions_collection
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.post("/open", response_model=ShopSessionInDB)
async def open_shop():
    collection = get_sessions_collection()
    
    # Check if there's already an active session
    active_session = collection.find_one({"is_active": True})
    if active_session:
        raise HTTPException(status_code=400, detail="Shop is already open")
    
    # Create new session
    new_session = {
        "start_time": datetime.now(),
        "is_active": True,
        "total_sales": 0.0,
        "total_transactions": 0
    }
    
    result = collection.insert_one(new_session)
    created_session = collection.find_one({"_id": result.inserted_id})
    
    return {**created_session, "id": str(created_session["_id"])}

@router.post("/close", response_model=ShopSessionInDB)
async def close_shop():
    collection = get_sessions_collection()
    
    # Find active session
    active_session = collection.find_one({"is_active": True})
    if not active_session:
        raise HTTPException(status_code=400, detail="No active shop session found")
    
    # Calculate duration
    end_time = datetime.now()
    start_time = active_session["start_time"]
    duration_minutes = (end_time - start_time).total_seconds() / 60
    
    # Update session
    updates = {
        "end_time": end_time,
        "is_active": False,
        "duration_minutes": round(duration_minutes, 2)
    }
    
    result = collection.update_one(
        {"_id": active_session["_id"]},
        {"$set": updates}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to close session")
    
    updated_session = collection.find_one({"_id": active_session["_id"]})
    return {**updated_session, "id": str(updated_session["_id"])}

@router.get("/current", response_model=ShopSessionInDB)
async def get_current_session():
    collection = get_sessions_collection()
    
    active_session = collection.find_one({"is_active": True})
    if not active_session:
        raise HTTPException(status_code=404, detail="No active shop session")
    
    return {**active_session, "id": str(active_session["_id"])}

@router.get("/", response_model=list[ShopSessionInDB])
async def get_all_sessions():
    collection = get_sessions_collection()
    sessions = list(collection.find().sort("start_time", -1))
    
    return [{**session, "id": str(session["_id"])} for session in sessions]