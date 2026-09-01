# Authentication Debug Summary - AgniDrishti

## Current Status (2026-09-01)

### ✅ What's Working
- API server running on `http://localhost:8087`
- Web server running on `http://localhost:5173`
- Docker containers: PostgreSQL, Redis, Classifier all healthy
- Firebase configuration appears correct
- Enhanced debug logging added to trace auth flow

### 🔍 Issues Identified

#### 1. **Authentication Redirect Loop**
**Problem**: After successful login/signup/Google sign-in, users stay on the login page instead of redirecting to `/command-center`

**Root Cause Analysis**:
- `App.tsx` lines 64-69 should trigger redirect when `status === "authenticated"`
- `AuthContext.tsx` sets status to "authenticated" after Firebase auth + backend `/auth/me` call succeeds
- Likely issue: Backend user profile fetch failing or Firebase token not being sent correctly

**Code Flow**:
1. User logs in → Firebase `signInWithEmailAndPassword()` succeeds
2. `onAuthStateChanged()` fires → tries to fetch user from `/api/v1/auth/me`
3. If successful → sets `status = "authenticated"` → should trigger redirect
4. If fails → sets `status = "unauthenticated"` → stays on login page

**Added Debug Logging**:
- `App.tsx`: Logs auth redirect checks
- `AuthContext.tsx`: Logs backend user fetch details and errors

#### 2. **Password Reset - No Email Sent**
**Problem**: Users don't receive password reset emails

**Status**: Firebase `sendPasswordResetEmail()` is configured correctly in code
**Likely Issues**:
- Firebase email templates may not be configured in Firebase Console
- Email provider settings may need verification
- Domain may not be authorized in Firebase Console

**Location**: `apps/web/src/context/AuthContext.tsx` line 198-204

#### 3. **Docker Configuration Mismatch**
**Issue**: `docker-compose.yml` doesn't include API server, only `docker-compose.prod.yml` does
**Impact**: For local development, need to run API outside Docker or use prod compose file

### 🔧 Fixes Applied

1. **Enhanced Debug Logging**
   - Added console logs to trace auth status changes
   - Added detailed error logging for backend user fetch
   - Added redirect attempt logging in App.tsx

2. **Server Status**
   - Started API server locally on port 8087
   - Started web dev server on port 5173

### 📋 Next Steps to Test

1. **Test Login Flow**:
   ```
   1. Open http://localhost:5173
   2. Navigate to Login page
   3. Try logging in with existing user
   4. Check browser console for debug logs
   5. Verify redirect to /command-center
   ```

2. **Test Signup Flow**:
   ```
   1. Go to Signup page
   2. Create new account
   3. Check if user is created in Firebase AND PostgreSQL
   4. Verify automatic redirect
   ```

3. **Test Google Sign-In**:
   ```
   1. Click "Sign in with Google"
   2. Complete Google OAuth
   3. Check if user is synced to backend
   4. Verify redirect
   ```

4. **Test Password Reset**:
   ```
   1. Go to Forgot Password page
   2. Enter email
   3. Check Firebase Console email logs
   4. Verify email is received
   ```

### 🐛 Debugging Commands

Check API logs:
```bash
# Monitor API server output
tail -f C:\Users\Lenovo\AppData\Local\Temp\claude\C--Users-Lenovo-Downloads-AgniDrishti\b67061ea-af44-43b9-ae20-6ac9a8c38f08\tasks\b07o9qghc.output
```

Test API endpoints:
```bash
# Health check
curl http://localhost:8087/health

# Auth endpoint (should fail without token)
curl http://localhost:8087/api/v1/auth/me
```

Check running processes:
```bash
netstat -ano | findstr ":8087"  # API server
netstat -ano | findstr ":5173"  # Web server
```

### 🔑 Key Files Modified

1. `apps/web/src/App.tsx` - Added redirect debug logging
2. `apps/web/src/context/AuthContext.tsx` - Enhanced error logging

### 💡 Potential Issues to Investigate

1. **CORS Configuration**: Check if CORS is allowing requests from localhost:5173
2. **Firebase Token**: Verify Firebase ID token is being included in API requests
3. **Backend User Sync**: Check if users are being auto-created in PostgreSQL on first Firebase login
4. **Environment Variables**: Verify all required env vars are set correctly

### 📝 Configuration Check

**API Port**: 8087 (configured in `.env`)
**Web Port**: 5173 (Vite default)
**API Base URL**: `http://localhost:8087/api/v1`
**CORS Origins**: `http://localhost,http://localhost:5173`

All configurations appear correct!
