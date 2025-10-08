from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ShopSession(BaseModel):
    start_time: datetime
    end_time: Optional[datetime] = None
    is_active: bool = True
    total_sales: float = 0.0
    total_transactions: int = 0
    duration_minutes: Optional[float] = None

class ShopSessionInDB(ShopSession):
    id: str

class ShopSessionUpdate(BaseModel):
    end_time: Optional[datetime] = None
    is_active: Optional[bool] = None
    total_sales: Optional[float] = None
    total_transactions: Optional[int] = None
    duration_minutes: Optional[float] = None