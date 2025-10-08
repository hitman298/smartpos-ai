# SmartPOS AI - Intelligent Point of Sale System

A modern, AI-powered Point of Sale (POS) system built with React frontend and FastAPI backend, featuring MongoDB integration for data persistence.

## Features

- **Modern UI**: Beautiful, responsive React frontend with real-time updates
- **AI Analytics**: Machine learning-powered demand prediction and analytics
- **MongoDB Integration**: Persistent data storage with real-time synchronization
- **Session Management**: Complete shop session tracking and management
- **Inventory Management**: Real-time inventory tracking with low-stock alerts
- **Customer Management**: Customer database with purchase history
- **Billing System**: Complete transaction processing with multiple payment methods
- **Real-time Dashboard**: Live analytics and business insights

## Tech Stack

### Frontend
- **React 18** with Vite
- **Modern CSS** with custom design system
- **Axios** for API communication
- **Context API** for state management

### Backend
- **FastAPI** with async/await support
- **MongoDB** with Motor (async driver)
- **Pydantic** for data validation
- **Uvicorn** ASGI server

## Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **MongoDB Atlas account** (free tier available)

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/hitman298/smartpos-ai.git
cd smartpos-ai
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python working_mongodb_server.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/docs

## Project Structure

```
smartpos-ai/
├── backend/
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── models/        # Database models
│   │   ├── ml/           # Machine learning modules
│   │   └── services/     # Business logic
│   ├── working_mongodb_server.py  # Main server file
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API services
│   │   └── contexts/     # React contexts
│   └── package.json
└── README.md
```

## Key Components

### Backend API Endpoints
- `GET /` - API health check
- `GET /items/` - Get all items
- `POST /transactions/` - Create new transaction
- `GET /sessions/` - Get all sessions
- `POST /sessions/open` - Open new session
- `POST /sessions/close` - Close current session
- `GET /customers/` - Get all customers
- `GET /dashboard/overview` - Get dashboard data

### Frontend Components
- **Dashboard**: Real-time analytics and overview
- **Billing**: Transaction processing and cart management
- **Inventory**: Item and stock management
- **Customers**: Customer database management
- **Sessions**: Shop session management
- **Analytics**: Advanced business analytics

## Development

### Backend Development
```bash
cd backend
python working_mongodb_server.py
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Database
The application uses MongoDB Atlas for data persistence. All data is automatically saved and synchronized across sessions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Author

**hitman298** - [GitHub Profile](https://github.com/hitman298)