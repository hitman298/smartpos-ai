# SmartPOS AI - Netlify Deployment Guide

## Quick Deployment Steps

### 1. Deploy to Netlify (Both Frontend + Backend)

1. **Go to [netlify.com](https://netlify.com)**
2. **Sign up with GitHub** (completely free, no credit card required)
3. **Click "New site from Git"**
4. **Connect to GitHub** and select `hitman298/smartpos-ai`
5. **Configure build settings**:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
6. **Add environment variables**:
   - Go to **Site settings** → **Environment variables**
   - Add: `MONGODB_URL` = `mongodb+srv://hitmanacc001_db_user:Rlyq0PNiOyglNASp@cluster0.8otfoya.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
7. **Deploy!**

### 2. Your App Will Be Live At:
- **Main URL**: `https://your-site-name.netlify.app`
- **Backend API**: `https://your-site-name.netlify.app/api/`

### 3. Features Included:
- ✅ **Frontend**: React app with modern UI
- ✅ **Backend**: Netlify Functions with MongoDB
- ✅ **Database**: MongoDB Atlas integration
- ✅ **Auto-deployment**: Every GitHub push deploys automatically
- ✅ **Free hosting**: No credit card required
- ✅ **Professional URL**: Custom domain support available

### 4. What You Can Show Interviewers:
- Live, working POS system
- Real database integration
- Professional deployment
- Modern tech stack (React + FastAPI + MongoDB)
- Clean, production-ready code

## Local Development

```bash
# Start backend
cd backend
python working_mongodb_server.py

# Start frontend (in new terminal)
cd frontend
npm run dev
```

## Tech Stack
- **Frontend**: React + Vite
- **Backend**: Netlify Functions (Node.js)
- **Database**: MongoDB Atlas
- **Deployment**: Netlify
- **Version Control**: GitHub
