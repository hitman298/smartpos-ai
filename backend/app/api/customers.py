from fastapi import APIRouter, HTTPException
from app.models.customer import Customer, CustomerInDB, CustomerUpdate
from app.core.database import get_customers_collection
from bson import ObjectId

router = APIRouter(prefix="/customers", tags=["customers"])

@router.post("/", response_model=CustomerInDB)
async def create_customer(customer: Customer):
    collection = get_customers_collection()
    
    # Check if customer already exists
    existing = collection.find_one({"phone": customer.phone})
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this phone already exists")
    
    result = collection.insert_one(customer.dict())
    created_customer = collection.find_one({"_id": result.inserted_id})
    
    return {**created_customer, "id": str(created_customer["_id"])}

@router.get("/", response_model=list[CustomerInDB])
async def get_all_customers():
    collection = get_customers_collection()
    customers = list(collection.find().sort("join_date", -1))
    
    return [{**customer, "id": str(customer["_id"])} for customer in customers]

@router.get("/{customer_id}", response_model=CustomerInDB)
async def get_customer(customer_id: str):
    collection = get_customers_collection()
    
    if not ObjectId.is_valid(customer_id):
        raise HTTPException(status_code=400, detail="Invalid customer ID")
    
    customer = collection.find_one({"_id": ObjectId(customer_id)})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return {**customer, "id": str(customer["_id"])}

@router.put("/{customer_id}", response_model=CustomerInDB)
async def update_customer(customer_id: str, update: CustomerUpdate):
    collection = get_customers_collection()
    
    if not ObjectId.is_valid(customer_id):
        raise HTTPException(status_code=400, detail="Invalid customer ID")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    
    result = collection.update_one(
        {"_id": ObjectId(customer_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    updated_customer = collection.find_one({"_id": ObjectId(customer_id)})
    return {**updated_customer, "id": str(updated_customer["_id"])}