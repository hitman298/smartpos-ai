# SmartPOS AI - Quick Deployment Scripts

## 🚀 One-Click Deployment Setup

### Prerequisites Checklist
- [ ] MongoDB Atlas account created
- [ ] MongoDB connection string ready
- [ ] GitHub repository created
- [ ] Render account (for backend)
- [ ] Vercel account (for frontend)

---

## Step-by-Step Deployment

### 1. MongoDB Atlas Setup (5 minutes)

```bash
# 1. Go to https://cloud.mongodb.com
# 2. Create free cluster (M0)
# 3. Create database user
# 4. Whitelist IP: 0.0.0.0/0 (allow all)
# 5. Get connection string
```

**Connection String Format:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/smartpos_ai?retryWrites=true&w=majority
```

---

### 2. Backend Deployment (Render - 10 minutes)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Render**
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Select repository
   - Settings:
     - **Name**: `smartpos-backend`
     - **Environment**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Environment Variables:
     ```
     MONGODB_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/smartpos_ai?retryWrites=true&w=majority
     MONGODB_DB_NAME=smartpos_ai
     PORT=10000
     ```
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Copy backend URL (e.g., `https://smartpos-backend.onrender.com`)

---

### 3. Frontend Deployment (Vercel - 5 minutes)

1. **Update API URL**
   Create `frontend/.env.production`:
   ```env
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

2. **Deploy on Vercel**
   - Go to https://vercel.com
   - Click "Import Project"
   - Connect GitHub repository
   - Settings:
     - **Framework Preset**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Environment Variables:
     ```
     VITE_API_URL=https://your-backend-url.onrender.com
     ```
   - Click "Deploy"
   - Wait 2-3 minutes
   - Copy frontend URL (e.g., `https://smartpos-ai.vercel.app`)

---

### 4. Update Backend CORS

1. Go to Render dashboard
2. Click on your backend service
3. Go to "Environment" tab
4. Add:
   ```
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```
5. Service will auto-restart

---

## 🎯 Alternative: Railway (All-in-One)

Railway can host both backend and frontend:

### Backend on Railway
1. Go to https://railway.app
2. Create new project
3. Add MongoDB service (or use external MongoDB Atlas)
4. Add Python service:
   - Connect GitHub repo
   - Root directory: `backend`
   - Environment variables:
     ```
     MONGODB_URL=mongodb+srv://...
     MONGODB_DB_NAME=smartpos_ai
     ```
   - Railway auto-detects Python and runs `uvicorn main:app`

### Frontend on Railway
1. Add new service → Node.js
2. Root directory: `frontend`
3. Environment variables:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```
4. Railway auto-detects Vite and builds

---

## ✅ Post-Deployment Checklist

- [ ] Backend health check: `https://your-backend-url/health`
- [ ] Frontend loads correctly
- [ ] Can open shop session
- [ ] Can add items
- [ ] Can process transactions
- [ ] Dashboard shows data
- [ ] MongoDB Atlas shows data

---

## 🔧 Troubleshooting

### Backend Issues
- **Connection timeout**: Check MongoDB network access
- **503 errors**: Render free tier sleeps after 15 min (normal)
- **Import errors**: Check `requirements.txt` includes all packages

### Frontend Issues
- **API errors**: Check `VITE_API_URL` environment variable
- **CORS errors**: Update backend CORS with frontend URL
- **Build fails**: Check Node.js version (18+)

---

## 📊 Free Tier Comparison

| Service | Backend | Frontend | Database | Always On |
|---------|---------|----------|----------|-----------|
| **Render** | ✅ | ❌ | ❌ | ⚠️ Sleeps |
| **Vercel** | ❌ | ✅ | ❌ | ✅ Always |
| **Railway** | ✅ | ✅ | ✅ | ✅ Always* |
| **Netlify** | ❌ | ✅ | ❌ | ✅ Always |

*Railway free tier: $5 credit/month, enough for small projects

---

## 🎉 Success!

Your SmartPOS AI is now live:
- ✅ Backend: `https://your-backend-url`
- ✅ Frontend: `https://your-frontend-url`
- ✅ Database: MongoDB Atlas (cloud)
- ✅ All free tier!

**No MongoDB needed on your local system!**



