from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class InventoryItem(BaseModel):
    item_id: str
    current_stock: int = 0
    minimum_stock: int = 5
    maximum_stock: Optional[int] = None
    cost_price: Optional[float] = None
    supplier: Optional[str] = None
    last_restocked: Optional[datetime] = None
    alert_enabled: bool = True

class InventoryItemResponse(InventoryItem):
    id: str
    item_name: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None

class InventoryUpdate(BaseModel):
    current_stock: Optional[int] = None
    minimum_stock: Optional[int] = None
    maximum_stock: Optional[int] = None
    cost_price: Optional[float] = None
    supplier: Optional[str] = None

class InventoryAlert(BaseModel):
    item_id: str
    item_name: str
    current_stock: int
    minimum_stock: int
    alert_type: str  # "low_stock", "out_of_stock", "over_stock"
    message: str