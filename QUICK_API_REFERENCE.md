# Live MART API - Quick Reference

This is a quick reference for testing the Live MART API endpoints.

---

## Base URL

```
http://localhost:5000
```

---

## Test Users

| Email | Password | Type |
|-------|----------|------|
| customer@test.com | Customer123! | CUSTOMER |
| retailer@test.com | Retailer123! | RETAILER |
| wholesaler@test.com | NewWholesaler789! | WHOLESALER |

---

## Quick Test Commands

### 1. Check API Health
```bash
curl http://localhost:5000/api/health
```

### 2. Register New User (Customer)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newcustomer@test.com",
    "password": "Password123!",
    "confirmPassword": "Password123!",
    "userType": "CUSTOMER",
    "profile": {
      "name": "New Customer",
      "phone": "9999999999"
    }
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "Customer123!"
  }'
```

### 4. Get Current User (Protected)
```bash
# First, save your token from login
TOKEN="your-access-token-here"

curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Update Profile
```bash
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "name": "Updated Name",
      "bio": "My new bio"
    }
  }'
```

### 6. Change Password
```bash
curl -X PUT http://localhost:5000/api/users/password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Customer123!",
    "newPassword": "NewPassword456!",
    "confirmPassword": "NewPassword456!"
  }'
```

### 7. Refresh Token
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token-here"
  }'
```

### 8. Logout
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

---

## Register Different User Types

### Customer Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "Password123!",
    "confirmPassword": "Password123!",
    "userType": "CUSTOMER",
    "profile": {
      "name": "John Doe",
      "phone": "1234567890"
    }
  }'
```

### Retailer Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "retailer@example.com",
    "password": "Password123!",
    "confirmPassword": "Password123!",
    "userType": "RETAILER",
    "profile": {
      "name": "Store Owner",
      "phone": "9876543210"
    },
    "businessName": "My Retail Store",
    "gstin": "29ABCDE1234F1Z5"
  }'
```

### Wholesaler Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "wholesaler@example.com",
    "password": "Password123!",
    "confirmPassword": "Password123!",
    "userType": "WHOLESALER",
    "profile": {
      "name": "Wholesale Owner",
      "phone": "5555555555"
    },
    "businessName": "Wholesale Supplies Inc",
    "gstin": "27ABCDE5678K1Z5",
    "bankDetails": {
      "accountHolderName": "Wholesale Owner",
      "bankName": "Test Bank",
      "accountNumber": "1234567890",
      "ifscCode": "TEST0001234"
    }
  }'
```

---

## Response Examples

### Successful Login Response
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "...",
      "email": "customer@test.com",
      "userType": "CUSTOMER",
      "profile": { ... },
      "isVerified": false,
      "isActive": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Validation Error Response
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

---

## All Available Endpoints

### Public Endpoints (No Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Welcome message |
| GET | `/api/health` | API health check |
| GET | `/api/auth` | Auth API documentation |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/google` | Google OAuth (if configured) |
| GET | `/api/auth/facebook` | Facebook OAuth (if configured) |

### Protected Endpoints (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout current session |
| POST | `/api/auth/logout-all` | Logout all sessions |
| GET | `/api/users/profile` | Get user profile |
| PUT | `/api/users/profile` | Update user profile |
| PUT | `/api/users/password` | Change password |

---

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

Example valid password: `Password123!`

---

## GSTIN Format (for Retailers/Wholesalers)

Format: `[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}`

Example: `29ABCDE1234F1Z5`

---

## Token Information

- **Access Token:** Expires in 15 minutes
- **Refresh Token:** Expires in 7 days
- **Storage:** Refresh tokens stored in Redis
- **Blacklisting:** Logged out tokens are blacklisted

---

## Testing with Postman

1. Import the endpoints into Postman
2. Create an Environment with variable `API_URL` = `http://localhost:5000`
3. After login, save the `accessToken` to environment variable
4. Use `{{accessToken}}` in Authorization header as `Bearer {{accessToken}}`

---

## Common Issues

### "No token provided"
- Make sure you're including the Authorization header
- Format: `Authorization: Bearer YOUR_TOKEN_HERE`

### "Token has been revoked"
- You've logged out with this token
- Get a new token by logging in again

### "Invalid email or password"
- Check your email and password
- Passwords are case-sensitive

### "User with this email already exists"
- Try a different email address
- Or login with existing credentials

---

## Need Help?

- See `TESTING_GUIDE.md` for detailed testing instructions
- See `GOOGLE_OAUTH_SETUP.md` for OAuth setup
- See `AUTHENTICATION_TEST_RESULTS.md` for test results
- Check server logs: `docker-compose -f docker/docker-compose.dev.yml logs api`
