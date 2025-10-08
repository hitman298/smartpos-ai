from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class Customer(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    join_date: datetime = datetime.now()
    total_spent: float = 0.0
    visit_count: int = 0
    loyalty_points: int = 0
    preferences: List[str] = []
    notes: Optional[str] = None

class CustomerInDB(Customer):
    id: str

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    preferences: Optional[List[str]] = None
    notes: Optional[str] = None