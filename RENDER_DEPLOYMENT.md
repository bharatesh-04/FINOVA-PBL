# 🚀 Render.com Deployment Guide

## Complete Step-by-Step Instructions

### Prerequisites
- ✅ GitHub account
- ✅ Render.com account (free)
- ✅ Project pushed to GitHub

---
# 1. Push to GitHub
git add .
git commit -m "Ready for Render deployment"
git push origin main

# 2. Go to https://render.com
# 3. Sign up with GitHub
# 4. Click "New +" → "Blueprint"
# 5. Select your finance-tracker repo
# 6. Deploy!
## 📋 Step 1: Prepare GitHub Repository

### 1.1 Initialize Git (if not done)
```powershell
cd c:\Users\bhara\OneDrive\Desktop\PBL-PYTHON
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 1.2 Add All Files
```powershell
git add .
git commit -m "Prepare for Render deployment"
```

### 1.3 Create GitHub Repository
1. Go to **https://github.com/new**
2. Create repository: `finance-tracker`
3. **Don't** initialize with README (we already have files)

### 1.4 Push to GitHub
```powershell
git remote add origin https://github.com/YOUR_USERNAME/finance-tracker.git
git branch -M main
git push -u origin main
```

**Expected Output:**
```
Enumerating objects: XX, done.
Counting objects: 100%, done.
...
✅ Branch 'main' set up to track remote branch 'main'
```

---

## 🎯 Step 2: Deploy Backend on Render.com

### 2.1 Create Render Account
1. Go to **https://render.com**
2. Click **"Sign up"**
3. Select **"Sign up with GitHub"**
4. Authorize Render to access your GitHub

### 2.2 Deploy Backend Using Blueprint
1. Go to **https://dashboard.render.com**
2. Click **"New +"** → **"Blueprint"**
3. Select your `finance-tracker` repository
4. Render will auto-detect `render.yaml` or `render.yml`
5. Review the backend configuration
6. Click **"Create from Blueprint"**
7. Wait 2-3 minutes for deployment

**You'll get backend URL:** `https://finance-tracker-api.onrender.com`

---

## 🎯 Step 3: Deploy Frontend as Static Site

After the backend is deployed, deploy the frontend separately:

### 3.1 Create Static Site Service
1. Go to **Dashboard** → Click **"New +"** → **"Static Site"**
2. Select your `finance-tracker` repository
3. Fill in details:
   - **Name**: `finance-tracker-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`

### 3.2 Add Environment Variable
1. Click **"Environment"**
2. Add variable:
   ```
   REACT_APP_API_URL=https://finance-tracker-api.onrender.com/api
   ```
   (Use the actual backend URL from step 2)
3. Save

### 3.3 Deploy Frontend
1. Click **"Create Static Site"**
2. Wait 2-3 minutes for deployment

**You'll get frontend URL:** `https://finance-tracker-frontend.onrender.com`

---

## ✅ Verification Checklist

After deployment, verify everything works:

### Backend Service
```
✅ Open: https://finance-tracker-api.onrender.com
✅ Should show: {"message": "Finance Tracker API", "status": "running"}
✅ API Docs: https://finance-tracker-api.onrender.com/docs (if DEBUG=false, this won't show - that's OK)
✅ Health check: https://finance-tracker-api.onrender.com/health
```

### Frontend Service
```
✅ Open: https://finance-tracker-frontend.onrender.com
✅ Should show: Login page
✅ Try login: demo@example.com / demo123456
✅ Should redirect to dashboard after login
```

### API Communication
```
✅ Login should work
✅ Dashboard should load
✅ Can view accounts (INR 5,000 demo balance)
✅ Can create transactions
✅ Can view all pages
```

---

## 🔄 Continuous Deployment

With Render, deployment is **automatic**:

### After First Deployment

Simply push new changes to GitHub:
```powershell
git add .
git commit -m "Update features"
git push origin main
```

**Render will automatically:**
1. ✅ Detect the new commit
2. ✅ Rebuild the frontend (npm build)
3. ✅ Redeploy both services
4. ✅ No downtime needed

---

## 🐛 Troubleshooting

### Frontend Not Loading

**Symptom:** Shows blank page or 404

**Solution:**
1. Check Render Dashboard → Frontend Service → Logs
2. Look for build errors in `npm run build`
3. Verify `package.json` exists in `frontend/` folder
4. Check `REACT_APP_API_URL` is correctly set

### Backend API Not Responding

**Symptom:** 502 Bad Gateway

**Solution:**
1. Check Render Dashboard → Backend Service → Logs
2. Look for Python errors or import issues
3. Verify all imports in `app_demo.py` are available
4. Check `requirements-core.txt` has all needed packages

### Login Fails

**Symptom:** Can't login, authentication error

**Solution:**
1. Verify `demo@example.com` exists in backend
2. Check backend logs for errors
3. Verify `CORS_ORIGINS` includes frontend URL
4. Check browser console for network errors

### Data Not Persisting

**Symptom:** Added data disappears after refresh

**Solution:**
1. SQLite stores in `/tmp/uploads` (ephemeral on Render)
2. For production, use Render PostgreSQL instead
3. See "Add PostgreSQL" section below

---

## 📦 Adding PostgreSQL (Optional)

For production database that persists data:

### 1. Create PostgreSQL Service
1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Fill in:
   - **Name**: `finance-tracker-db`
   - **Plan**: Free tier (upgradeable)
3. Click **"Create Database"**
4. Copy the connection string

### 2. Update Backend Environment
1. Go to Backend Service → Environment
2. Add new variable:
   ```
   DATABASE_URL=(paste the PostgreSQL connection string)
   ```
3. Save and redeploy

### 3. Update Backend Code
In `backend/app_demo.py`, uncomment lines using `DATABASE_URL`:
```python
# Change from SQLite to PostgreSQL
from sqlalchemy import create_engine
database_url = os.getenv("DATABASE_URL", "sqlite:///./test.db")
engine = create_engine(database_url)
```

---

## 📊 Monitoring Deployment

### Check Deployment Status
1. Go to **Dashboard**
2. Click on your service
3. View:
   - 🟢 **Active** - Service is running
   - 🟡 **Building** - Currently deploying
   - 🔴 **Failed** - Deployment error (check logs)

### View Live Logs
1. Service Page → **Logs**
2. Watch real-time output
3. Useful for debugging issues

### Set Up Alerts (Optional)
1. Service Page → **Settings** → **Notifications**
2. Get email alerts for deployment failures

---

## 🎉 Done!

Your Finance Tracker App is now deployed on Render!

### URLs to Share
- **Application**: `https://finance-tracker-frontend.onrender.com`
- **API**: `https://finance-tracker-api.onrender.com`
- **Demo Account**: `demo@example.com` / `demo123456`

### Next Steps
1. ✅ Test all features
2. ✅ Share link with others
3. ✅ Make improvements locally, push to GitHub
4. ✅ Render auto-deploys changes
5. ✅ Consider adding PostgreSQL for production data

---

## 📞 Need Help?

**Common Issues:**
- [Render Docs](https://render.com/docs)
- [GitHub Issues](https://github.com/YOUR_USERNAME/finance-tracker/issues)
- Check service logs in Render Dashboard

**Contact Render Support:**
- https://render.com/support

---

**Happy Deploying! 🚀**
