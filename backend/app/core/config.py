import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "SmartPOS AI"
    PROJECT_VERSION: str = "1.0.0"
    
    # MongoDB Configuration
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "smartpos_ai")
    
    # Server Configuration
    PORT: int = int(os.getenv("PORT", "5000"))
    
    # CORS Configuration
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    ALLOWED_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        FRONTEND_URL
    ]
    
    # Add production URLs if provided
    if os.getenv("FRONTEND_URL"):
        ALLOWED_ORIGINS.append(os.getenv("FRONTEND_URL"))
    
    # Allow any vercel.app or netlify.app domain (for easy deployment)
    if os.getenv("VERCEL_URL"):
        ALLOWED_ORIGINS.append(f"https://{os.getenv('VERCEL_URL')}")
    
# Create an instance of Settings
settings = Settings()
