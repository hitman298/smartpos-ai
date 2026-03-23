# SmartPOS AI - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Python 3.11+ installed
- Node.js 18+ installed
- MongoDB (optional - system works with fallback data)

### Step 1: Backend Setup

**Option A: Using Batch File (Windows)**
```bash
start_backend.bat
```

**Option B: Manual Setup**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

Backend will start on: **http://localhost:5000**

### Step 2: Frontend Setup

**Option A: Using Batch File (Windows)**
```bash
start_frontend.bat
```

**Option B: Manual Setup**
```bash
cd frontend
npm install
npm run dev
```

Frontend will start on: **http://localhost:5173**

### Step 3: First Steps

1. **Open the Application**
   - Navigate to http://localhost:5173
   - You'll see the Dashboard

2. **Open Shop Session**
   - Click "Open Shop" button in the header
   - This enables transaction processing

3. **Add Items** (if needed)
   - Go to "Items" section
   - Add products with prices and stock

4. **Process Transactions**
   - Go to "Billing" section
   - Add items to cart
   - Select customer (optional)
   - Process payment

5. **View Analytics**
   - Dashboard shows real-time metrics
   - Analytics section provides detailed insights

## 📱 Feature Overview

### Dashboard
- Real-time sales metrics
- Today's transactions
- Active items count
- Customer statistics
- Shop status indicator

### Billing
- Product catalog
- Shopping cart
- Multiple payment methods (Cash, Card, UPI)
- Customer selection
- Transaction processing

### Items Management
- Add/Edit/Delete items
- Category management
- Stock tracking
- Price management

### Inventory
- Stock levels
- Low stock alerts
- Category filtering
- Stock updates

### Customers
- Customer database
- Purchase history
- Customer analytics
- Search and filter

### Employees (NEW)
- Employee database
- Role management
- Status tracking
- Add/Edit employees

### Sessions
- Session history
- Open/Close sessions
- Session analytics
- Duration tracking

### Analytics
- Sales trends
- Peak hours
- Demand prediction
- Waste reduction insights

## 🔧 Configuration

### MongoDB (Optional)
Create `.env` file in `backend/` directory:
```
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=smartpos_ai
```

If MongoDB is not available, the system uses in-memory fallback data.

### API URL
Frontend API URL can be configured in `frontend/.env`:
```
VITE_API_URL=http://localhost:5000
```

## 🐛 Troubleshooting

### Backend won't start
- Check Python version: `python --version`
- Install dependencies: `pip install -r requirements.txt`
- Check port 5000 is available

### Frontend won't start
- Check Node.js version: `node --version`
- Install dependencies: `npm install`
- Check port 5173 is available

### Transactions not working
- Ensure shop is open (click "Open Shop")
- Check backend is running
- Check browser console for errors

### Data not persisting
- Check MongoDB connection (if using MongoDB)
- System uses fallback data if MongoDB unavailable
- Data resets on restart if using fallback mode

## 📊 Testing Checklist

- [ ] Backend starts successfully
- [ ] Frontend starts successfully
- [ ] Can open shop session
- [ ] Can add items to cart
- [ ] Can process transactions
- [ ] Dashboard shows correct data
- [ ] Inventory updates correctly
- [ ] Customer management works
- [ ] Employee management works
- [ ] Reports generate correctly

## 🎯 Common Workflows

### Daily Operations
1. Open shop session
2. Process customer transactions
3. Monitor inventory levels
4. View dashboard for metrics
5. Close shop session at end of day

### Adding New Product
1. Go to Items section
2. Click "Add Item"
3. Enter product details
4. Set price and stock
5. Save item

### Managing Employees
1. Go to Employees section
2. Click "Add Employee"
3. Enter employee details
4. Assign role
5. Set status (Active/Inactive)

### Generating Reports
1. Go to Analytics section
2. Select report type
3. Set date range
4. Generate report
5. Export if needed

## 💡 Tips

- Always open shop session before processing transactions
- Keep inventory updated for accurate stock levels
- Use customer selection for better analytics
- Monitor low stock alerts regularly
- Check dashboard for daily performance

## 🆘 Support

For issues:
1. Check browser console for errors
2. Check backend terminal for errors
3. Verify all services are running
4. Check network connectivity
5. Review IMPROVEMENTS.md for known issues

## 📚 Additional Resources

- See `IMPROVEMENTS.md` for detailed changelog
- See `README.md` for project overview
- API documentation: http://localhost:5000/docs

