# SmartPOS AI - Intelligent Point of Sale System

A modern, AI-powered Point of Sale (POS) system built with React frontend and FastAPI backend, featuring MongoDB integration for data persistence.

## 🚀 Features

- **Modern UI**: Beautiful, responsive React frontend with real-time updates
- **AI Analytics**: Machine learning-powered demand prediction and analytics
- **MongoDB Integration**: Persistent data storage with real-time synchronization
- **Session Management**: Complete shop session tracking and management
- **Inventory Management**: Real-time inventory tracking with low-stock alerts
- **Customer Management**: Customer database with purchase history
- **Billing System**: Complete transaction processing with multiple payment methods
- **Real-time Dashboard**: Live analytics and business insights

## 🛠️ Tech Stack

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

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (v4.4 or higher)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
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
- **API Documentation**: http://localhost:5000/docs

## 📁 Project Structure

```
smartpos-ai/
├── backend/
│   ├── app/                 # Application modules
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Core configuration
│   │   ├── ml/             # Machine learning models
│   │   ├── models/         # Data models
│   │   └── services/       # Business logic
│   ├── main.py             # Alternative server entry point
│   ├── working_mongodb_server.py  # Main server
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── routes/         # Routing configuration
│   ├── package.json        # Node.js dependencies
│   └── vite.config.js      # Vite configuration
├── start_servers.bat       # Windows startup script
├── start_servers.ps1       # PowerShell startup script
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```env
MONGODB_URL=mongodb://localhost:27017
```

### MongoDB Setup
1. Install MongoDB locally or use MongoDB Atlas
2. Ensure MongoDB is running on port 27017
3. The application will automatically create the `smartpos_ai` database

## 📊 API Endpoints

### Core Endpoints
- `GET /` - API information
- `GET /health` - Health check
- `GET /dashboard/overview` - Dashboard data

### Items Management
- `GET /items/` - Get all items
- `POST /items/` - Create new item
- `PUT /items/{id}` - Update item
- `DELETE /items/{id}` - Delete item

### Session Management
- `GET /sessions/current` - Get current session
- `GET /sessions/` - Get all sessions
- `POST /sessions/open` - Open new session
- `POST /sessions/close` - Close current session

### Transaction Processing
- `GET /transactions/` - Get all transactions
- `POST /transactions/` - Create new transaction

### Customer Management
- `GET /customers/` - Get all customers
- `POST /customers/` - Create new customer

## 🎯 Usage

1. **Start the Shop**: Open a session from the navigation
2. **Add Items**: Use the billing system to add items to cart
3. **Process Payment**: Complete transactions with cash, card, or UPI
4. **View Analytics**: Monitor sales, inventory, and customer data
5. **Manage Inventory**: Track stock levels and receive alerts
6. **Close Shop**: End the session to finalize daily operations

## 🔍 Features in Detail

### AI-Powered Analytics
- Demand prediction based on historical data
- Peak hours identification
- Waste reduction suggestions
- Customer behavior analysis

### Real-time Updates
- Live dashboard with current metrics
- Real-time inventory tracking
- Session status monitoring
- Transaction history

### Data Persistence
- All data stored in MongoDB
- Automatic backup and recovery
- Transaction integrity
- Session continuity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the console logs for debugging

## 🎉 Acknowledgments

Built with modern web technologies and best practices for scalability and maintainability.
