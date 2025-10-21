# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth authentication for your Live MART application.

---

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click on the project dropdown (top left, next to "Google Cloud")
4. Click **"NEW PROJECT"**
5. Enter project name: `LiveMART` (or any name you prefer)
6. Click **"CREATE"**
7. Wait for project creation, then select it from the dropdown

---

### 1.2 Enable Google+ API (Required for OAuth)

1. In your project, go to **"APIs & Services"** → **"Library"** (left sidebar)
2. Search for **"Google+ API"**
3. Click on it
4. Click **"ENABLE"**

---

### 1.3 Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"** (left sidebar)
2. Select **"External"** (for testing with any Google account)
3. Click **"CREATE"**

**Fill in the form:**
- **App name:** `Live MART`
- **User support email:** Your email address
- **App logo:** (optional, skip for now)
- **Application home page:** `http://localhost:3000`
- **Authorized domains:** Leave empty for localhost testing
- **Developer contact information:** Your email address
- Click **"SAVE AND CONTINUE"**

**Scopes (Step 2):**
- Click **"ADD OR REMOVE SCOPES"**
- Check these scopes:
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
- Click **"UPDATE"** → **"SAVE AND CONTINUE"**

**Test users (Step 3):**
- Click **"ADD USERS"**
- Add your email address (for testing)
- Click **"ADD"** → **"SAVE AND CONTINUE"**

**Summary (Step 4):**
- Review and click **"BACK TO DASHBOARD"**

---

### 1.4 Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"** (left sidebar)
2. Click **"CREATE CREDENTIALS"** → **"OAuth 2.0 Client ID"**

**Configure:**
- **Application type:** `Web application`
- **Name:** `Live MART Web Client`

**Authorized JavaScript origins:**
- Click **"ADD URI"**
- Add: `http://localhost:5000`
- Click **"ADD URI"** again
- Add: `http://localhost:3000`

**Authorized redirect URIs:**
- Click **"ADD URI"**
- Add: `http://localhost:5000/api/auth/google/callback`

- Click **"CREATE"**

**Save your credentials:**
- A popup will show your **Client ID** and **Client Secret**
- **COPY BOTH** - you'll need them next
- Click **"OK"**

---

## Step 2: Configure Environment Variables

### 2.1 Update `.env.development`

Open `C:\Programming\AssignmentOOPS\.env.development` and add these lines:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

**Replace:**
- `your-client-id-here.apps.googleusercontent.com` → Your actual Client ID from Step 1.4
- `your-client-secret-here` → Your actual Client Secret from Step 1.4

### 2.2 Update `.env.example` (for documentation)

Add the same template to `.env.example`:

```bash
# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

---

## Step 3: Restart Docker Container

After updating the environment variables, restart the API container:

```bash
docker-compose -f docker/docker-compose.dev.yml restart api
```

Wait ~10 seconds for the server to restart. You should see:
```
✅ MongoDB connected successfully
✅ Redis connected successfully
🚀 Live MART API Server Started
🔐 Auth Endpoints: http://localhost:5000/api/auth
```

**No more warnings** about "Google OAuth not configured"!

---

## Step 4: Test Google OAuth

### Method 1: Browser Test (Easiest)

1. Open your browser
2. Navigate to: `http://localhost:5000/api/auth/google`
3. You'll be redirected to Google's login page
4. Sign in with your Google account (must be in test users list)
5. Grant permissions to your app
6. You'll be redirected back to `http://localhost:5000/api/auth/google/callback`
7. You should see JSON response with:
   ```json
   {
     "success": true,
     "message": "Google authentication successful",
     "data": {
       "user": { ... },
       "tokens": {
         "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
         "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
       }
     }
   }
   ```

**What happens:**
- ✅ A new user is created in MongoDB (check via `/api/auth/me` with the token)
- ✅ User is automatically verified (`isVerified: true`)
- ✅ JWT tokens are generated
- ✅ OAuth info is stored in user profile

---

### Method 2: Test with Frontend (Better UX)

Create a simple login button in your React frontend:

```jsx
// In your Login component
<button onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}>
  Login with Google
</button>
```

**For production**, you'd want to:
1. Redirect to Google OAuth
2. Handle the callback on the frontend
3. Store JWT tokens in localStorage/cookies
4. Redirect user to dashboard

---

### Method 3: Postman/Thunder Client

**GET** `http://localhost:5000/api/auth/google`

This will return HTML (the Google login page). For testing via API clients, it's better to use the browser method.

---

## Step 5: Verify OAuth User Creation

After logging in with Google:

### 5.1 Get Current User

Use the `accessToken` from Step 4:

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "your-google-email@gmail.com",
      "userType": "CUSTOMER",
      "profile": {
        "name": "Your Google Name",
        "avatar": "https://lh3.googleusercontent.com/..."
      },
      "oauth": {
        "google": {
          "id": "1234567890",
          "email": "your-google-email@gmail.com"
        }
      },
      "isVerified": true,
      "isActive": true
    }
  }
}
```

### 5.2 Check MongoDB

```bash
# Connect to MongoDB container
docker exec -it livemart-mongodb-dev mongosh -u admin -p password123 --authenticationDatabase admin

# Switch to database
use livemart_dev

# Find OAuth users
db.users.find({ "oauth.google.id": { $exists: true } }).pretty()
```

---

## Troubleshooting

### Error: "Google OAuth not configured"
- ✅ Check `.env.development` has the correct variables
- ✅ Restart the Docker container after adding variables
- ✅ Verify no typos in environment variable names

### Error: "redirect_uri_mismatch"
- ✅ Callback URL in Google Console must EXACTLY match: `http://localhost:5000/api/auth/google/callback`
- ✅ No trailing slashes
- ✅ Check both "Authorized redirect URIs" in Google Console

### Error: "Access blocked: This app's request is invalid"
- ✅ Add your email to test users in OAuth consent screen
- ✅ Make sure you're using the correct Google account

### Error: "invalid_client"
- ✅ Client ID and Secret don't match
- ✅ Check for extra spaces or quotes in `.env.development`
- ✅ Regenerate credentials in Google Console if needed

### No user created in database
- ✅ Check MongoDB connection in logs
- ✅ Check server logs for errors during OAuth callback
- ✅ Verify user email is valid

---

## Next Steps

### 1. Link OAuth Account to Existing User
Currently, OAuth creates a new user. To link to existing accounts, modify `oauth.service.ts`:
- Check if email already exists
- Link OAuth data to existing user instead of creating new one

### 2. Add Facebook OAuth
Same process, but use Facebook App Dashboard:
- https://developers.facebook.com/
- Create app → Get App ID and Secret
- Configure redirect URI

### 3. Production Deployment
When deploying to production:
1. Update callback URLs to production domain
2. Add production URLs to Google Console
3. Move from "Testing" to "Production" in OAuth consent screen
4. Use environment-specific `.env` files

---

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env.development` to Git (it's in `.gitignore`)
- Never share your Client Secret publicly
- Use different credentials for production
- Regularly rotate secrets
- Enable additional security features in Google Console for production

---

## Reference Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)

---

**You're all set!** 🎉

Your app now supports Google OAuth authentication. Users can sign up/log in with their Google accounts seamlessly.
