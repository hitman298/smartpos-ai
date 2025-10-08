from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class StoreStatus(BaseModel):
    status: str = "CLOSED"  # OPEN, CLOSED, BREAK
    auto_mode: bool = False
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    updated_by: str = "system"

class Session(BaseModel):
    session_id: str
    opened_at: datetime = Field(default_factory=datetime.utcnow)
    closed_at: Optional[datetime] = None
    status: str = "active"  # active, closed
    total_sales: float = 0.0
    transaction_count: int = 0