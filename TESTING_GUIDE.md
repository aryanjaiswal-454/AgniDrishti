# AgniDrishti Authentication Testing Guide

## 🔍 Interactive Debug Dashboard

**Location**: `Development/auth-debug-dashboard.html`

Open this dashboard in your browser while testing to see real-time authentication status:

```bash
# Open the dashboard
cd Development
start auth-debug-dashboard.html
```

The dashboard shows:
- **Firebase Status**: Current user, token validity
- **Backend Status**: API connection, user role from PostgreSQL
- **Auth Context**: Current route, redirect logic status
- **Recent API Calls**: Live tracking of `/auth/me` requests
- **Live Console Log**: Real-time auth flow events

Use it alongside the main app (http://localhost:5173) to monitor what's happening during login/signup.

---

## ✅ Fixed Issues

### 1. Independent Loading States for Authentication Buttons
**Status**: ✅ **FIXED**

**What was fixed**:
- Split single `isSubmitting` state into separate state variables
- `LoginPage.tsx`: Now uses `isSubmittingEmail` and `isSubmittingGoogle`
- `SignupPage.tsx`: Now uses `isSubmittingSignup` and `isSubmittingGoogle`

**How to test**:
1. Open http://localhost:5173
2. Go to Login page
3. Click the "Login" button → only the Login button shows loading spinner
4. Click "Sign in with Google" → only the Google button shows loading spinner
5. Repeat test on Signup page

**Expected**: Each button shows its own independent loading state

---

## 🔍 Current Investigation: Authentication Redirect

### What's Happening
From API server logs, authentication **IS working correctly**:
```
[INFO] [GET] /api/v1/auth/me -> 200 (82ms)
[INFO] [GET] /api/v1/auth/me -> 304 (57ms)
```

This means:
- ✅ Firebase authentication succeeds
- ✅ Firebase token is sent to backend
- ✅ Backend verifies token and returns user profile
- ✅ User is successfully authenticated

### The Real Issue
The redirect logic in `App.tsx` should trigger when `status === "authenticated"`, but users report staying on the login page. This could be:

1. **Race condition**: The status updates but the redirect timing is off
2. **State synchronization**: React state updates aren't triggering the effect
3. **Navigation timing**: The `navigateTo` function is called but doesn't execute properly

### Debug Steps

#### Step 1: Open Browser DevTools
1. Navigate to http://localhost:5173
2. Press F12 to open DevTools
3. Go to Console tab
4. Keep it open during testing

#### Step 2: Test Login Flow
1. Go to Login page
2. Enter credentials and click Login
3. Watch console for these debug logs:

```
Firebase user authenticated: <email>
Backend user profile fetched: <email> {...}
[AuthContext] Status set to authenticated
[App] Auth redirect check: {status: "authenticated", currentRoute: "/login", isAuthRoute: true}
[App] Redirecting to command center...
```

#### Step 3: Analyze Results

**If you see all logs above**: The redirect logic is working, navigation might be failing
- Check if URL changes to `#/command-center`
- Check if the page re-renders

**If "Status set to authenticated" appears but redirect check doesn't**: React effect not triggering
- Possible React state batching issue
- Need to adjust effect dependencies

**If authentication logs appear but no status update**: Backend call failing silently
- Check Network tab for failed `/auth/me` request
- Check for CORS errors

**If no logs appear at all**: Firebase authentication issue
- Check Firebase console for errors
- Verify Firebase config

#### Step 4: Check Network Tab
1. Go to Network tab in DevTools
2. Filter by "auth"
3. Look for `/api/v1/auth/me` requests
4. Check:
   - Request Headers: Should have `Authorization: Bearer <token>`
   - Response: Should be 200 with user data
   - Any failed requests or CORS errors

---

## 🔧 Quick Fixes to Try

### Fix 1: Force Redirect After Status Update
If status updates but redirect doesn't trigger, try adding a slight delay:

**File**: `Development/apps/web/src/App.tsx`

```typescript
useEffect(() => {
  const isAuthRoute = currentRoute === "/login" || currentRoute === "/signup" || currentRoute === "/forgot-password" || currentRoute.startsWith("/reset-password");
  console.log('[App] Auth redirect check:', { status, currentRoute, isAuthRoute });
  if (status === "authenticated" && isAuthRoute) {
    console.log('[App] Redirecting to command center...');
    // Add small delay to ensure state is settled
    setTimeout(() => navigateTo("/command-center"), 0);
  }
}, [status, currentRoute]);
```

### Fix 2: Check Current Route After Login
The issue might be that `currentRoute` is changing during the auth process. Add this log:

```typescript
useEffect(() => {
  console.log('[App] Current route changed:', currentRoute);
}, [currentRoute]);
```

### Fix 3: Verify Firebase Token Refresh
Firebase tokens expire. Check if token is valid:

**File**: `Development/apps/web/src/api/client.ts` (already has this, but verify):

```typescript
const token = await auth.currentUser?.getIdToken();
if (token) {
  console.log('API request with auth token:', endpoint);
} else {
  console.log('API request without auth token:', endpoint);
}
```

---

## 📋 Complete Test Checklist

### Email/Password Login
- [ ] Enter valid credentials
- [ ] Click Login button → only Login button shows loading
- [ ] Console shows all authentication logs
- [ ] User redirects to /command-center
- [ ] Command center loads with user data

### Email/Password Signup
- [ ] Enter name, email, password
- [ ] Click Signup button → only Signup button shows loading
- [ ] Console shows authentication logs
- [ ] User redirects to /command-center
- [ ] New user appears in PostgreSQL database

### Google Sign-In (Login page)
- [ ] Click "Sign in with Google" → only Google button shows loading
- [ ] Google popup opens
- [ ] Complete OAuth flow
- [ ] Console shows authentication logs
- [ ] User redirects to /command-center

### Google Sign-In (Signup page)
- [ ] Click "Sign up with Google" → only Google button shows loading
- [ ] Google popup opens
- [ ] Complete OAuth flow
- [ ] Console shows authentication logs
- [ ] User redirects to /command-center

---

## 🔑 Password Reset Email Issue

**Status**: ⏳ **PENDING - Requires Firebase Console Configuration**

### Current Implementation
- Code is correct: `sendPasswordResetEmail(auth, email)` in `AuthContext.tsx`
- Uses Firebase's built-in email system (NOT backend nodemailer)

### Why Emails Aren't Sending
Firebase needs to be configured in Firebase Console:

### Fix Steps
1. Go to https://console.firebase.google.com
2. Select project: `agnidrishti-f8bbb`
3. Navigate to **Authentication** → **Templates** tab
4. Find "Password reset" template
5. Click **Edit**
6. Configure:
   - **Email sender**: `agnidrishtiadmin@gmail.com` (or your preferred)
   - **Subject**: "Reset your AgniDrishti password"
   - **Template**: Customize the email body
7. **Save** the template
8. Verify email provider settings in Firebase Console

### Test Password Reset
After configuring Firebase Console:
1. Go to http://localhost:5173/#/forgot-password
2. Enter email address
3. Click "Send Reset Link"
4. Check email inbox (including spam folder)
5. Click reset link in email
6. Enter new password
7. Verify you can login with new password

---

## 🐳 Docker Status

**Status**: ✅ **HEALTHY**

All containers running:
- PostgreSQL: Port 5432
- Redis: Port 6379
- Classifier: Port 5000

To verify:
```bash
docker ps
```

---

## 🌐 Server Status

**API Server**: http://localhost:8087
```bash
curl http://localhost:8087/health
```

**Web Server**: http://localhost:5173
```bash
curl -I http://localhost:5173
```

---

## 💡 Next Steps

1. **Test the loading button fix** (already applied)
2. **Debug authentication redirect** using steps above
3. **Configure Firebase Console** for password reset emails
4. Report findings in console logs

---

## 📞 Getting Help

If issues persist, share:
1. Full console logs from browser DevTools
2. Network tab screenshot showing `/auth/me` request
3. Any error messages
4. Which specific step fails in the checklist above
