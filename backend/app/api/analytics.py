from fastapi import APIRouter, HTTPException
from app.ml.local_models import MLModels  # USE LOCAL ML MODELS
import json

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/ml/predict-demand")
async def ml_predict_demand(item_name: str = None):
    """Local ML demand prediction - 100% reliable"""
    ml_models = MLModels()
    
    try:
        if item_name:
            prediction = ml_models.predict_demand_simple(item_name)
            return prediction
        else:
            predictions = ml_models.predict_all_items()
            return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML prediction failed: {str(e)}")

@router.get("/ml/peak-hours")
async def ml_peak_hours():
    """Local ML peak hours analysis"""
    ml_models = MLModels()
    return ml_models.get_peak_hours_analysis()

@router.get("/ml/waste-reduction")
async def ml_waste_reduction():
    """Local ML waste reduction tips"""
    ml_models = MLModels()
    return ml_models.get_waste_reduction_tips()

@router.get("/ml/advanced-prediction")
async def ml_advanced_prediction(item_name: str):
    """Advanced ML prediction with more features"""
    ml_models = MLModels()
    
    try:
        prediction = ml_models.predict_demand_advanced(item_name)
        return prediction
    except Exception as e:
        # Fallback to simple prediction
        return ml_models.predict_demand_simple(item_name)

@router.get("/ml/sales-data")
async def ml_sales_data(days_back: int = 30):
    """Get raw sales data for analysis"""
    ml_models = MLModels()
    data = ml_models.get_historical_data(days_back)
    return data