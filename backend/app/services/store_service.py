from datetime import datetime
from app.core.database import db
from app.models.store_models import StoreStatus, Session

class StoreService:
    @staticmethod
    async def get_store_status():
        collection = db.store_status
        status = await collection.find_one()
        if not status:
            # Create default
            default_status = StoreStatus()
            await collection.insert_one(default_status.dict())
            status = await collection.find_one()
        return status

    @staticmethod
    async def update_store_status(new_status: str):
        collection = db.store_status
        await collection.update_one(
            {},
            {"$set": {
                "status": new_status,
                "last_updated": datetime.utcnow(),
                "updated_by": "user"
            }},
            upsert=True
        )
        return await collection.find_one()

    @staticmethod
    async def create_session():
        collection = db.sessions
        session_id = f"session_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        session = Session(session_id=session_id)
        await collection.insert_one(session.dict())
        return await collection.find_one({"session_id": session_id})

    @staticmethod
    async def get_current_session():
        collection = db.sessions
        return await collection.find_one({"status": "active"})

    @staticmethod
    async def close_current_session():
        collection = db.sessions
        await collection.update_one(
            {"status": "active"},
            {"$set": {"status": "closed", "closed_at": datetime.utcnow()}}
        )

store_service = StoreService()