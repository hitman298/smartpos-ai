# SmartPOS AI - Free Tier Deployment Guide

## 🚀 Complete Free Tier Setup (No MongoDB on Your System!)

This guide will help you deploy SmartPOS AI completely free using cloud services.

## 📋 Prerequisites

- GitHub account (free)
- MongoDB Atlas account (free tier)
- Render account (free tier) OR Railway account (free tier)
- Vercel account (free tier) OR Netlify account (free tier)

---

## Step 1: Set Up MongoDB Atlas (Free Tier)

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for free account
3. Choose **Free Tier (M0)** - 512MB storage, shared cluster

### 1.2 Create Cluster
1. Click "Build a Database"
2. Select **FREE** tier (M0)
3. Choose your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Select region closest to you
5. Click "Create Cluster"

### 1.3 Configure Database Access
1. Go to **Database Access** → **Add New Database User**
2. Username: `smartpos_user` (or your choice)
3. Password: Create a strong password (save it!)
4. User Privileges: **Read and write to any database**
5. Click "Add User"

### 1.4 Configure Network Access
1. Go to **Network Access** → **Add IP Address**
2. Click **"Add Current IP Address"** (for testing)
3. For production, click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click "Confirm"

### 1.5 Get Connection String
1. Click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Driver: **Python**, Version: **3.11 or later**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your actual credentials
6. Add database name at the end:
   ```
   mongodb+srv://smartpos_user:yourpassword@cluster0.xxxxx.mongodb.net/smartpos_ai?retryWrites=true&w=majority
   ```

---

## Step 2: Update Backend Configuration

### 2.1 Create `.env` File
Create `backend/.env` file:

```env
MONGODB_URL=mongodb+srv://smartpos_user:yourpassword@cluster0.xxxxx.mongodb.net/smartpos_ai?retryWrites=true&w=majority
MONGODB_DB_NAME=smartpos_ai
PORT=5000
```

### 2.2 Update CORS Settings
The backend will automatically allow your deployed frontend URL.

---

## Step 3: Deploy Backend (Render - Free Tier)

### 3.1 Prepare Backend
1. Create `backend/Procfile`:
   ```
   web: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

2. Create `backend/runtime.txt`:
   ```
   python-3.11.0
   ```

### 3.2 Deploy to Render
1. Go to [Render](https://render.com) and sign up
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your repository
5. Configure:
   - **Name**: `smartpos-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

6. Add Environment Variables:
   - `MONGODB_URL`: Your MongoDB Atlas connection string
   - `MONGODB_DB_NAME`: `smartpos_ai`
   - `PORT`: `10000` (Render sets this automatically)

7. Click **"Create Web Service"**

8. Wait for deployment (5-10 minutes)

9. Copy your backend URL (e.g., `https://smartpos-backend.onrender.com`)

---

## Step 4: Deploy Frontend (Vercel - Free Tier)

### 4.1 Update Frontend API URL
Create `frontend/.env.production`:
```env
VITE_API_URL=https://smartpos-backend.onrender.com
```

### 4.2 Deploy to Vercel
1. Go to [Vercel](https://vercel.com) and sign up
2. Click **"Import Project"**
3. Connect your GitHub repository
4. Select your repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. Add Environment Variable:
   - `VITE_API_URL`: Your backend URL from Render

7. Click **"Deploy"**

8. Wait for deployment (2-3 minutes)

9. Copy your frontend URL (e.g., `https://smartpos-ai.vercel.app`)

---

## Step 5: Update Backend CORS

After deployment, update your backend CORS to allow your frontend URL:

1. Go to Render dashboard
2. Click on your backend service
3. Go to **"Environment"** tab
4. Add environment variable:
   - `FRONTEND_URL`: Your Vercel frontend URL

5. Update `backend/main.py` CORS settings (we'll do this automatically)

---

## Step 6: Alternative Deployment Options

### Option A: Railway (Backend + Frontend)
Railway offers free tier with $5 credit monthly:

1. Go to [Railway](https://railway.app)
2. Sign up with GitHub
3. Create new project
4. Deploy backend:
   - Add MongoDB Atlas connection string
   - Railway auto-detects Python
5. Deploy frontend:
   - Add backend URL as environment variable

### Option B: Netlify (Frontend) + Render (Backend)
1. Netlify for frontend: Similar to Vercel
2. Render for backend: As described above

---

## Step 7: Update Frontend API Service

Update `frontend/src/services/api.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

---

## ✅ Testing Your Deployment

1. **Backend Health Check**: Visit `https://your-backend-url.onrender.com/health`
2. **Frontend**: Visit your Vercel URL
3. **Test Features**:
   - Open shop session
   - Add items
   - Process transactions
   - Check dashboard

---

## 🔒 Security Notes

1. **Never commit `.env` files** to GitHub
2. Add `.env` to `.gitignore`
3. Use environment variables in deployment platforms
4. MongoDB Atlas allows connections only from whitelisted IPs

---

## 📊 Free Tier Limits

### MongoDB Atlas (M0 Free Tier)
- ✅ 512MB storage
- ✅ Shared cluster
- ✅ Unlimited connections
- ✅ Perfect for development/small projects

### Render (Free Tier)
- ✅ 750 hours/month (enough for 24/7)
- ✅ Automatic SSL
- ✅ Sleeps after 15 minutes inactivity (wakes on request)
- ⚠️ Cold start: ~30 seconds after sleep

### Vercel (Free Tier)
- ✅ Unlimited projects
- ✅ Automatic SSL
- ✅ Global CDN
- ✅ Instant deployments

---

## 🐛 Troubleshooting

### Backend Not Connecting to MongoDB
- Check MongoDB Atlas network access (allow 0.0.0.0/0)
- Verify connection string in environment variables
- Check MongoDB username/password

### Frontend Can't Reach Backend
- Check CORS settings in backend
- Verify `VITE_API_URL` environment variable
- Check backend URL is correct

### Render App Sleeping
- Free tier sleeps after 15 min inactivity
- First request after sleep takes ~30 seconds
- Consider upgrading or using Railway for always-on

---

## 🎉 You're Live!

Your SmartPOS AI is now:
- ✅ Running on cloud (no local MongoDB needed)
- ✅ Accessible from anywhere
- ✅ Using free tier services
- ✅ Production-ready

---

## 📝 Quick Reference

- **Backend URL**: `https://your-backend.onrender.com`
- **Frontend URL**: `https://your-frontend.vercel.app`
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com/dashboard

---

## Next Steps

1. Custom domain (optional, free with Vercel)
2. Set up monitoring
3. Configure backups
4. Add analytics


