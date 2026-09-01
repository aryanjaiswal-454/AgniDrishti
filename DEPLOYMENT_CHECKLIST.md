# AgniDrishti Deployment Checklist

## 🎯 Target Infrastructure
- **Frontend (Web)**: Render
- **Backend (API)**: Render
- **ML Classifier**: Render
- **PostgreSQL**: Aiven (managed)
- **Redis**: Upstash (managed)

---

## ⚠️ CRITICAL FIXES NEEDED BEFORE DEPLOYMENT

### 1. **Aiven CA Certificate (PostgreSQL SSL)**

**Issue**: The API Dockerfile expects `apps/api/ca.pem` but it's not in the repository.

**Solution Option A - Use SSL with Aiven Certificate (RECOMMENDED)**:
```bash
# Download Aiven CA certificate
curl -o apps/api/ca.pem https://console.aiven.io/project/agnidrishti/services/pg-agnidrishti/ca.pem

# OR download from Aiven Console -> Your PostgreSQL Service -> Overview -> Download CA Certificate

# Commit it to the repo
git add apps/api/ca.pem
git commit -m "add: Aiven PostgreSQL CA certificate for SSL"
```

**Solution Option B - Disable SSL (NOT RECOMMENDED for production)**:
Set environment variable on Render API service:
```
DB_IGNORE_SSL=true
```

---

## 📋 RENDER ENVIRONMENT VARIABLES

### **Service 1: Web (Frontend)**

**Render Configuration**:
- **Root Directory**: `Development` (← MUST set this in Render)
- **Environment**: Static Site
- **Build Command**: `npm ci && npm run build -w @agnidrishti/web`
- **Publish Directory**: `apps/web/dist`

**Environment Variables**:
```bash
VITE_API_URL=https://your-api-service.onrender.com
VITE_WS_URL=wss://your-api-service.onrender.com
VITE_GOOGLE_CLIENT_ID=119349925509-hjfegkkb9llacqjidr8m7r5806edh141.apps.googleusercontent.com
```

**Build-time Variables** (set in Render dashboard under "Environment"):
- `VITE_API_URL` (must be set BEFORE build)
- `VITE_WS_URL` (must be set BEFORE build)

---

### **Service 2: API (Backend)**

Build command: `npm ci && npm run build -w @agnidrishti/shared-types && npm run build -w @agnidrishti/api`
Start command: `node apps/api/dist/db/migrate.js && node apps/api/dist/index.js`

**Environment Variables**:
```bash
# Server Configuration
NODE_ENV=production
PORT=3001

# Database (Aiven PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
DB_IGNORE_SSL=false

# Redis (Upstash)
REDIS_URL=rediss://default:your-password@your-redis.upstash.io:6379

# CORS (CRITICAL - Must include your Render web service URL)
CORS_ORIGIN=https://your-web-service.onrender.com,https://agnidrishti.com

# JWT Authentication
JWT_SECRET=generate-a-strong-random-secret-here
JWT_EXPIRES_IN=7d

# Firebase (for authentication)
# No environment variables needed - hardcoded in firebase config files

# NASA FIRMS API
FIRMS_MAP_KEY=447830fb574b99ba63462ed5a171d748
FIRMS_SOURCE=VIIRS_SNPP_NRT,MODIS_NRT
FIRMS_AREA_COORDINATES=68,6,98,38
FIRMS_DAY_RANGE=1
FIRMS_POLL_INTERVAL=*/30 * * * *

# OpenStreetMap
OSM_OVERPASS_URL=https://overpass-api.de/api/interpreter
OSM_SYNC_INTERVAL=0 3 * * 0
OSM_AREA_BBOX=6.5,68.0,37.5,97.5

# ML Classifier Service
CLASSIFIER_URL=https://your-classifier-service.onrender.com

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=agnidrishtiadmin@gmail.com
SMTP_PASS=jojk hhvu rtov rmay
```

---

### **Service 3: Classifier (ML Model)**

**Render Configuration (CRITICAL)**:
- **Root Directory**: `Development` (← MUST set this in Render, otherwise build will fail looking for `apps/`)
- **Build Command**: `pip install -r apps/classifier/requirements.txt`
- **Start Command**: `uvicorn apps.classifier.main:app --host 0.0.0.0 --port $PORT`
- **Dockerfile Path**: `apps/classifier/Dockerfile`
- **Docker Build Context**: `.` (relative to root dir)

**Environment Variables**:
```bash
TRACK_B_CONTRACT_PATH=/app/data/sample/processed/track_b_b4_contract_ready.jsonl
PYTHONPATH=/app/track_a/a4:$PYTHONPATH
```

**Note**: You'll need to upload the model data files (`/data` and `/track_a` folders) to Render or use persistent disk storage.

---

## 🔧 CORS CONFIGURATION FIX

### Current Issue:
Your CORS is set to `http://localhost` by default. This will **block your frontend on Render**.

### Fix in code:
File: `apps/api/src/config/index.ts`

```typescript
cors: {
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) 
    : ["http://localhost:5173", "http://localhost"],
  credentials: true,
},
```

This is already correct! Just ensure you set `CORS_ORIGIN` on Render to include your frontend URL.

---

## 🔐 SECURITY CHECKLIST

### Before Deployment:

1. ✅ **Generate a strong JWT_SECRET**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. ✅ **Update Firebase authorized domains**:
   - Go to Firebase Console → Authentication → Settings → Authorized domains
   - Add your Render domain: `your-web-service.onrender.com`

3. ✅ **Add Aiven CA certificate** (Option A above)

4. ✅ **Update CORS_ORIGIN** with your production frontend URL

5. ✅ **Never commit `.env` file** (it's already in `.gitignore`)

---

## 📦 GIT COMMIT BEFORE DEPLOYMENT

Run these commands to commit all changes:

```bash
# Check what needs to be committed
git status

# Add all modified files
git add .

# Commit with descriptive message
git commit -m "fix: authentication flow and prepare for production deployment

- Fixed default user role to 'admin'
- Fixed auto-creation logic in auth middleware
- Added logout on user deletion
- Fixed redirect after login/signup
- Updated CORS configuration for production
- Added Aiven CA certificate for SSL
- Updated all Dockerfiles for production"

# Push to your repository
git push origin main
```

---

## 🚀 DEPLOYMENT ORDER

1. **Deploy Classifier Service first** (ML model)
2. **Deploy API Service second** (backend)
   - Set `CLASSIFIER_URL` to point to the deployed classifier
3. **Deploy Web Service last** (frontend)
   - Set `VITE_API_URL` to point to the deployed API

---

## ✅ POST-DEPLOYMENT VERIFICATION

After deploying all services:

1. **Test API Health**:
   ```bash
   curl https://your-api-service.onrender.com/health
   ```

2. **Test Classifier Health**:
   ```bash
   curl https://your-classifier-service.onrender.com/health
   ```

3. **Test Frontend**:
   - Open `https://your-web-service.onrender.com`
   - Try to sign up / log in
   - Check browser console for errors

4. **Test Database Connection**:
   - Sign up with a new account
   - Check Aiven console to verify user was created

5. **Test Redis Connection**:
   - Check Upstash console for connection metrics

---

## 🐛 DEBUGGING TIPS

### API logs on Render:
```bash
# View logs in Render dashboard
# Look for:
# - "🔥 AgniDrishti API running on http://localhost:3001"
# - "Migration complete!"
# - Database connection errors
# - CORS errors
```

### Common Issues:

1. **CORS Error**: Update `CORS_ORIGIN` to include frontend URL
2. **Database SSL Error**: Add Aiven CA certificate or set `DB_IGNORE_SSL=true`
3. **Redis Connection Error**: Check `REDIS_URL` format (should be `rediss://` for SSL)
4. **Firebase Auth Error**: Add Render domain to Firebase authorized domains

---

## 📝 NOTES

- Render free tier services **sleep after 15 minutes of inactivity**
- First request after sleep takes 30-60 seconds to wake up
- Consider upgrading to paid tier for production use
- Set up health checks on Render to keep services alive
