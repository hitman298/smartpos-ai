# SmartPOS AI - Intelligent Point of Sale System

A modern, AI-powered Point of Sale (POS) system built with React frontend and FastAPI backend, featuring MongoDB integration for data persistence.

## 🚀 Live Demo

**[https://smartpos-ai.onrender.com](https://smartpos-ai.onrender.com)**

> ⚠️ **Note on Cold Start:** The app is hosted on Render's free tier, which spins down after ~15 minutes of inactivity. First load may take **30–60 seconds** to wake up — this is expected. Subsequent requests will be instant.

## Features

- **Modern UI**: Beautiful, responsive React frontend with real-time updates
- **AI Analytics**: Machine learning-powered demand prediction and analytics
- **MongoDB Integration**: Persistent data storage with real-time synchronization
- **Session Management**: Complete shop session tracking and management
- **Inventory Management**: Real-time inventory tracking with low-stock alerts
- **Customer Management**: Customer database with purchase history
- **Billing System**: Complete transaction processing with multiple payment methods
- **Kitchen Display (KDS)**: Real-time kitchen order management
- **Real-time Dashboard**: Live analytics and business insights

## Tech Stack

### Frontend
- **React 18** with Vite
- **Modern CSS** with custom design system
- **Axios** for API communication (60s timeout to handle cold starts)
- **Context API** for state management

### Backend
- **FastAPI** with async/await support
- **MongoDB Atlas** with Motor (async driver)
- **Pydantic** for data validation
- **Uvicorn** ASGI server

## Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **MongoDB Atlas account** (free tier available)

## Quick Start (Local Development)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Or use the batch files:**
```bash
start_backend.bat
start_frontend.bat
```

## Deployment (Render — Free Tier)

Both frontend and backend are deployed on **Render**:

1. **MongoDB Atlas** — Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Backend (Render Web Service)**
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Set environment variable: `MONGODB_URL=<your atlas connection string>`
3. **Frontend (Render Static Site)**
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`
   - Set environment variable: `VITE_API_URL=<your render backend URL>`

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

## Project Structure

```
smartpos-ai/
├── backend/
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── models/        # Database models
│   │   ├── ml/            # Machine learning modules
│   │   └── services/      # Business logic
│   ├── main.py            # Main FastAPI server
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   └── contexts/      # React contexts
│   └── package.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/items/` | Get all items |
| POST | `/transactions/` | Create transaction |
| GET | `/sessions/current` | Get current session |
| POST | `/sessions/open` | Open session |
| POST | `/sessions/close` | Close session |
| GET | `/customers/` | Get customers |
| GET | `/dashboard/overview` | Dashboard data |
| GET | `/analytics/ml/predict-demand` | ML demand predictions |

## Author

**hitman298** — [GitHub Profile](https://github.com/hitman298)