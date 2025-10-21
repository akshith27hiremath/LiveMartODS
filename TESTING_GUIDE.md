# Testing Guide - Phase 2.2 Authentication

This guide will walk you through testing all authentication features step-by-step.

---

## Prerequisites

### 1. Install Testing Tools

**Option A: Postman (Recommended - GUI)**
- Download from: https://www.postman.com/downloads/
- Easy to use, saves requests, beautiful interface

**Option B: Thunder Client (VS Code Extension)**
- Install in VS Code: Search "Thunder Client" in Extensions
- Lightweight, integrated with VS Code

**Option C: cURL (Command Line)**
- Already installed on most systems
- Use Git Bash on Windows for best compatibility

---

## Step 1: Start the Application

### Open terminal and run:
```bash
cd C:\Programming\AssignmentOOPS
docker-compose -f docker/docker-compose.dev.yml up
```

### Wait for these messages:
```
✅ MongoDB connected successfully
✅ Redis connected successfully
🚀 Live MART API Server Started
🔐 Auth Endpoints: http://localhost:5000/api/auth
```

**If you see errors**, stop containers and restart:
```bash
# Stop
docker-compose -f docker/docker-compose.dev.yml down

# Rebuild and start fresh
docker-compose -f docker/docker-compose.dev.yml up -d api
```

---

## Step 2: Test Basic Connectivity

### Test 1: Root endpoint
```bash
curl http://localhost:5000
```

**Expected Response:**
```json
{
  "message": "Welcome to Live MART API",
  "version": "1.0.0",
  "status": "running"
}
```

### Test 2: Health check
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2025-01-20T..."
}
```

✅ **If both work, your server is running!**

---

## Step 3: Test User Registration

### Register a Customer

#### Using cURL:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"customer@test.com\",\"password\":\"Customer123!\",\"confirmPassword\":\"Customer123!\",\"userType\":\"CUSTOMER\",\"profile\":{\"name\":\"Test Customer\",\"phone\":\"1234567890\"}}"
```

#### Using Postman/Thunder Client:
```
Method: POST
URL: http://localhost:5000/api/auth/register
Headers:
  Content-Type: application/json
Body (JSON):
{
  "email": "customer@test.com",
  "password": "Customer123!",
  "confirmPassword": "Customer123!",
  "userType": "CUSTOMER",
  "profile": {
    "name": "Test Customer",
    "phone": "1234567890"
  }
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "email": "customer@test.com",
      "userType": "CUSTOMER",
      "profile": {
        "name": "Test Customer",
        "phone": "1234567890"
      },
      "isActive": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

✅ **Save the accessToken - you'll need it for next steps!**

---

### Register a Retailer

```json
{
  "email": "retailer@test.com",
  "password": "Retailer123!",
  "confirmPassword": "Retailer123!",
  "userType": "RETAILER",
  "profile": {
    "name": "Test Retailer",
    "phone": "9876543210"
  },
  "businessName": "My Retail Store",
  "gstin": "29ABCDE1234F1Z5"
}
```

---

### Register a Wholesaler

```json
{
  "email": "wholesaler@test.com",
  "password": "Wholesaler123!",
  "confirmPassword": "Wholesaler123!",
  "userType": "WHOLESALER",
  "profile": {
    "name": "Test Wholesaler",
    "phone": "5555555555"
  },
  "businessName": "Wholesale Supplies Inc",
  "gstin": "27FGHIJ5678K2L9"
}
```

---

## Step 4: Test Login

### Login as Customer

#### Using cURL:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"customer@test.com\",\"password\":\"Customer123!\"}"
```

#### Using Postman/Thunder Client:
```
Method: POST
URL: http://localhost:5000/api/auth/login
Body (JSON):
{
  "email": "customer@test.com",
  "password": "Customer123!"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

✅ **Copy the accessToken - you need it for protected routes!**

---

## Step 5: Test Protected Endpoints

### Get Current User Info

#### Using cURL:
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Replace `YOUR_ACCESS_TOKEN_HERE` with the actual token from login!**

#### Using Postman/Thunder Client:
```
Method: GET
URL: http://localhost:5000/api/auth/me
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "customer@test.com",
      "userType": "CUSTOMER",
      "profile": {
        "name": "Test Customer",
        "phone": "1234567890"
      }
    }
  }
}
```

---

### Get User Profile

```
Method: GET
URL: http://localhost:5000/api/users/profile
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

---

### Update Profile

```
Method: PUT
URL: http://localhost:5000/api/users/profile
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
  Content-Type: application/json
Body:
{
  "profile": {
    "name": "Updated Name",
    "bio": "This is my new bio"
  }
}
```

---

## Step 6: Test Validation Errors

### Test 1: Weak Password
```json
{
  "email": "test@test.com",
  "password": "weak",
  "confirmPassword": "weak",
  "userType": "CUSTOMER",
  "profile": {
    "name": "Test",
    "phone": "1234567890"
  }
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

### Test 2: Invalid Email
```json
{
  "email": "not-an-email",
  "password": "Valid123!",
  "confirmPassword": "Valid123!",
  "userType": "CUSTOMER",
  "profile": {
    "name": "Test",
    "phone": "1234567890"
  }
}
```

**Expected: 400 error with email validation message**

### Test 3: Password Mismatch
```json
{
  "email": "test@test.com",
  "password": "Password123!",
  "confirmPassword": "Different123!",
  "userType": "CUSTOMER",
  "profile": {
    "name": "Test",
    "phone": "1234567890"
  }
}
```

**Expected: 400 error "Passwords do not match"**

---

## Step 7: Test RBAC (Role-Based Access Control)

This will be tested when we create retailer/wholesaler-specific routes in Phase 2.3.

For now, you can verify that:
- ✅ Customers, Retailers, and Wholesalers can all login
- ✅ All can access `/api/auth/me` and `/api/users/profile`
- ✅ Each user type is stored correctly in database

---

## Step 8: Test Token Refresh

### Refresh Access Token

```
Method: POST
URL: http://localhost:5000/api/auth/refresh
Headers:
  Content-Type: application/json
Body:
{
  "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "tokens": {
      "accessToken": "NEW_ACCESS_TOKEN",
      "refreshToken": "NEW_REFRESH_TOKEN"
    }
  }
}
```

---

## Step 9: Test Logout

### Logout Current Session

```
Method: POST
URL: http://localhost:5000/api/auth/logout
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**After logout, the token should be blacklisted. Try using it again:**

```
Method: GET
URL: http://localhost:5000/api/auth/me
Headers:
  Authorization: Bearer YOUR_BLACKLISTED_TOKEN
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Token has been revoked. Please login again."
}
```

---

## Step 10: Test Change Password

```
Method: PUT
URL: http://localhost:5000/api/users/password
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
  Content-Type: application/json
Body:
{
  "currentPassword": "Customer123!",
  "newPassword": "NewPassword456!",
  "confirmPassword": "NewPassword456!"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Now try logging in with the NEW password to verify it worked!**

---

## Quick Test Checklist

Use this checklist to verify everything works:

- [ ] Server starts without errors
- [ ] Can access root endpoint (/)
- [ ] Can access health endpoint (/api/health)
- [ ] Can register a customer
- [ ] Can register a retailer
- [ ] Can register a wholesaler
- [ ] Can login with correct credentials
- [ ] Cannot login with wrong password (401)
- [ ] Can access /api/auth/me with valid token
- [ ] Cannot access /api/auth/me without token (401)
- [ ] Can update profile
- [ ] Can change password
- [ ] Can refresh access token
- [ ] Can logout
- [ ] Cannot use token after logout (blacklisted)
- [ ] Validation errors work (weak password, invalid email)

---

## Common Issues & Solutions

### Issue: "Cannot connect to server"
**Solution:** Make sure Docker containers are running
```bash
docker-compose -f docker/docker-compose.dev.yml ps
```

### Issue: "Redis is not connected"
**Solution:** Redis might not be ready yet. Wait 10 seconds and try again.

### Issue: "MongoDB connection failed"
**Solution:** Restart the API container
```bash
docker-compose -f docker/docker-compose.dev.yml restart api
```

### Issue: "Token expired"
**Solution:** Login again to get a new token. Access tokens expire after 15 minutes.

### Issue: "Validation error"
**Solution:** Check your JSON syntax and ensure all required fields are present.

---

## Step 11: Test OAuth Authentication (Google)

### Prerequisites
Before testing OAuth, you need to set up Google OAuth credentials. See **`GOOGLE_OAUTH_SETUP.md`** for detailed setup instructions.

### Quick Setup Summary:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add Client ID and Secret to `.env.development`
4. Restart the API container

---

### Test Google OAuth Login

#### Method 1: Browser Test (Recommended)

1. **Initiate OAuth Flow:**
   - Open browser and navigate to: `http://localhost:5000/api/auth/google`
   - You'll be redirected to Google's login page

2. **Sign in with Google:**
   - Use a Google account (must be added as test user in Google Console)
   - Grant permissions to your app

3. **Get JWT Tokens:**
   - After successful login, you'll be redirected to the callback URL
   - Response will show JSON with user data and tokens:
   ```json
   {
     "success": true,
     "message": "Google authentication successful",
     "data": {
       "user": {
         "_id": "...",
         "email": "yourname@gmail.com",
         "userType": "CUSTOMER",
         "profile": {
           "name": "Your Name",
           "avatar": "https://lh3.googleusercontent.com/..."
         },
         "oauth": {
           "google": {
             "id": "1234567890",
             "email": "yourname@gmail.com"
           }
         },
         "isVerified": true
       },
       "tokens": {
         "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
         "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
       }
     }
   }
   ```

4. **Verify OAuth User:**
   - Copy the `accessToken`
   - Test with `/api/auth/me`:
   ```bash
   curl -X GET http://localhost:5000/api/auth/me \
     -H "Authorization: Bearer YOUR_OAUTH_ACCESS_TOKEN"
   ```

---

#### Method 2: Frontend Integration

Create a login button in your React app:

```jsx
// Simple Google OAuth button
<button onClick={() => {
  window.location.href = 'http://localhost:5000/api/auth/google';
}}>
  Login with Google
</button>
```

**For production**, you'd handle the callback properly and store tokens.

---

### Verify OAuth User in Database

```bash
# Connect to MongoDB
docker exec -it livemart-mongodb-dev mongosh -u admin -p password123 --authenticationDatabase admin

# Check OAuth users
use livemart_dev
db.users.find({ "oauth.google.id": { $exists: true } }).pretty()
```

**Expected:**
- User created with Google email
- `oauth.google.id` field populated
- `isVerified: true` (auto-verified by Google)
- No password field (OAuth users don't have passwords)

---

### Facebook OAuth (Optional)

Same process as Google, but:
1. Get credentials from [Facebook Developers](https://developers.facebook.com/)
2. Add to `.env.development`:
   ```bash
   FACEBOOK_APP_ID=your-facebook-app-id
   FACEBOOK_APP_SECRET=your-facebook-app-secret
   FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback
   ```
3. Test at: `http://localhost:5000/api/auth/facebook`

---

### OAuth Troubleshooting

**Error: "Google OAuth not configured"**
- Missing environment variables
- Restart API container after adding variables

**Error: "redirect_uri_mismatch"**
- Callback URL doesn't match Google Console configuration
- Must be exactly: `http://localhost:5000/api/auth/google/callback`

**Error: "Access blocked"**
- Email not added as test user in Google Console
- App not published (use test mode)

**User not created:**
- Check server logs for errors
- Verify MongoDB connection
- Check Redis connection (stores tokens)

See **`GOOGLE_OAUTH_SETUP.md`** for detailed troubleshooting.

---

## Using Postman Collection (Recommended)

I can create a Postman collection file that has all these requests pre-configured. Would you like me to create one? It would save you a lot of time!

---

## Next Steps

Once you've verified all these tests pass:
1. ✅ Phase 2.2 is confirmed working
2. ✅ OAuth authentication works (if configured)
3. ➡️ Ready to proceed to Phase 2.3 (Product/Order/Payment routes)
4. 📊 Can start building the frontend authentication UI

**Happy Testing! 🚀**
