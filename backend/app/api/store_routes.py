from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
from app.core.database import db

store_router = APIRouter(prefix="/api/store", tags=["Store Management"])

class StatusUpdate(BaseModel):
    status: str

# Simple in-memory storage (we'll add MongoDB later)
current_status = "CLOSED"
current_session = None

@store_router.get("/status")
async def get_store_status():
    return {
        "success": True,
        "status": current_status,
        "lastUpdated": datetime.utcnow().isoformat(),
        "session": current_session
    }

@store_router.post("/status")
async def update_store_status(status_data: StatusUpdate):
    global current_status, current_session
    
    new_status = status_data.status.upper()
    if new_status not in ["OPEN", "CLOSED", "BREAK"]:
        return {"success": False, "error": "Invalid status"}
    
    current_status = new_status
    
    # If opening, create a session
    if new_status == "OPEN" and not current_session:
        current_session = {
            "id": f"session_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            "opened_at": datetime.utcnow().isoformat(),
            "status": "active"
        }
    
    # If closing, clear session
    if new_status == "CLOSED":
        current_session = None
    
    return {
        "success": True,
        "status": current_status,
        "message": f"Store status updated to {new_status}"
    }

@store_router.post("/sessions/open")
async def open_session():
    global current_status, current_session
    
    current_status = "OPEN"
    current_session = {
        "id": f"session_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
        "opened_at": datetime.utcnow().isoformat(),
        "status": "active"
    }
    
    return {
        "success": True,
        "session": current_session,
        "status": current_status,
        "message": "Session opened successfully"
    }

@store_router.get("/sessions/current")
async def get_current_session():
    return {
        "success": True,
        "session": current_session
    }

# Mock endpoints to prevent frontend errors
@store_router.get("/items")
async def get_items():
    return {"success": True, "items": []}

@store_router.get("/transactions")
async def get_transactions():
    return {"success": True, "transactions": []}

@store_router.get("/inventory")
async def get_inventory():
    return {"success": True, "inventory": []}

@store_router.get("/inventory/alerts")
async def get_inventory_alerts():
    return {"success": True, "alerts": []}