from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class TransactionItem(BaseModel):
    item_id: str
    item_name: str
    quantity: int
    price: float
    total: float

class Transaction(BaseModel):
    session_id: str
    items: List[TransactionItem]
    total_amount: float
    payment_mode: str  # "cash" or "upi"
    timestamp: datetime = datetime.now()

class TransactionInDB(Transaction):
    id: str

class TransactionResponse(BaseModel):
    id: str
    session_id: str
    items: List[TransactionItem]
    total_amount: float
    payment_mode: str
    timestamp: datetime
    change_given: Optional[float] = None