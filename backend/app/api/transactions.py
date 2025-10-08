from fastapi import APIRouter, HTTPException
from app.models.transaction import Transaction, TransactionResponse, TransactionItem
from app.core.database import get_transactions_collection, get_sessions_collection, get_items_collection
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.post("/", response_model=TransactionResponse)
async def create_transaction(transaction: Transaction):
    transactions_collection = get_transactions_collection()
    sessions_collection = get_sessions_collection()
    items_collection = get_items_collection()
    
    # Validate session exists and is active
    if not ObjectId.is_valid(transaction.session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID")
    
    session = sessions_collection.find_one({"_id": ObjectId(transaction.session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.get("is_active", False):
        raise HTTPException(status_code=400, detail="Session is not active")
    
    # Validate items and get item names
    validated_items = []
    for item in transaction.items:
        if not ObjectId.is_valid(item.item_id):
            raise HTTPException(status_code=400, detail=f"Invalid item ID: {item.item_id}")
        
        db_item = items_collection.find_one({"_id": ObjectId(item.item_id)})
        if not db_item:
            raise HTTPException(status_code=404, detail=f"Item not found: {item.item_id}")
        if not db_item.get("is_active", True):
            raise HTTPException(status_code=400, detail=f"Item is not active: {db_item['name']}")
        
        # Calculate item total
        item_total = item.quantity * item.price
        
        validated_items.append({
            "item_id": item.item_id,
            "item_name": db_item["name"],
            "quantity": item.quantity,
            "price": item.price,
            "total": item_total
        })
    
    # Create transaction document
    transaction_data = {
        "session_id": transaction.session_id,
        "items": validated_items,
        "total_amount": transaction.total_amount,
        "payment_mode": transaction.payment_mode,
        "timestamp": datetime.now()
    }
    
    # Insert transaction
    result = transactions_collection.insert_one(transaction_data)
    created_transaction = transactions_collection.find_one({"_id": result.inserted_id})
    
    # Update session totals
    sessions_collection.update_one(
        {"_id": ObjectId(transaction.session_id)},
        {
            "$inc": {
                "total_sales": transaction.total_amount,
                "total_transactions": 1
            }
        }
    )
    
    # Prepare response
    response = {**created_transaction, "id": str(created_transaction["_id"])}
    
    # Calculate change if payment mode is cash
    if transaction.payment_mode == "cash" and transaction.total_amount > 0:
        # For now, we'll just return 0 change, but you can add cash handling logic
        response["change_given"] = 0.0
    
    return response

@router.get("/", response_model=list[TransactionResponse])
async def get_all_transactions():
    collection = get_transactions_collection()
    transactions = list(collection.find().sort("timestamp", -1))
    
    return [{**txn, "id": str(txn["_id"])} for txn in transactions]

@router.get("/session/{session_id}", response_model=list[TransactionResponse])
async def get_session_transactions(session_id: str):
    if not ObjectId.is_valid(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID")
    
    collection = get_transactions_collection()
    transactions = list(collection.find({"session_id": session_id}).sort("timestamp", -1))
    
    return [{**txn, "id": str(txn["_id"])} for txn in transactions]

@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(transaction_id: str):
    if not ObjectId.is_valid(transaction_id):
        raise HTTPException(status_code=400, detail="Invalid transaction ID")
    
    collection = get_transactions_collection()
    transaction = collection.find_one({"_id": ObjectId(transaction_id)})
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return {**transaction, "id": str(transaction["_id"])}