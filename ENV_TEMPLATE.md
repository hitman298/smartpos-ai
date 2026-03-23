# Environment Variables Template

## Backend (.env)
Create `backend/.env`:

```env
# MongoDB Atlas Connection String
MONGODB_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/smartpos_ai?retryWrites=true&w=majority
MONGODB_DB_NAME=smartpos_ai

# Server Port (Render sets this automatically)
PORT=5000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

## Frontend (.env.production)
Create `frontend/.env.production`:

```env
# Backend API URL
VITE_API_URL=https://your-backend-url.onrender.com
```

## Frontend (.env.development)
Create `frontend/.env.development`:

```env
# Local development backend
VITE_API_URL=http://localhost:5000
```

## ⚠️ Important Notes

1. **Never commit `.env` files** to Git
2. Add `.env` to `.gitignore`
3. Set environment variables in your deployment platform:
   - Render: Dashboard → Environment tab
   - Vercel: Project Settings → Environment Variables
   - Railway: Variables tab

## 🔒 Security

- Keep MongoDB credentials secret
- Use different passwords for production
- Rotate credentials regularly
- Don't share `.env` files



