import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB Configuration
MONGODB_URL = os.getenv(
    "MONGODB_URL",
    "mongodb://localhost:27017"
)
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "smartpos_ai")

# Server Configuration
PORT = int(os.getenv("PORT", "5000"))

# Frontend URL for CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Print configuration (without sensitive data)
print(f"🔧 Configuration:")
print(f"   MongoDB Database: {MONGODB_DB_NAME}")
print(f"   Port: {PORT}")
print(f"   Frontend URL: {FRONTEND_URL}")
if MONGODB_URL.startswith("mongodb+srv"):
    print(f"   MongoDB: Atlas (Cloud)")
else:
    print(f"   MongoDB: Local")



