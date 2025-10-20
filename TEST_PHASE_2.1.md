# Phase 2.1 Testing Instructions

## 🎯 What We've Built

- ✅ Database connection with MongoDB
- ✅ Logger utility
- ✅ Base User model (abstract)
- ✅ Customer, Retailer, Wholesaler models
- ✅ Backend API with health check
- ✅ Frontend React app showing backend status

---

## 🚀 Step 1: Start Docker Compose

```bash
docker-compose -f docker/docker-compose.dev.yml up
```

### What Will Happen:

1. **MongoDB** starts (port 27017)
2. **Redis** starts (port 6379)
3. **Elasticsearch** starts (port 9200)
4. **Backend** installs npm packages (~2 mins first time), then starts on port 5000
5. **Frontend** installs npm packages (~2 mins first time), then starts on port 3000

### Expected Output:

```
mongodb      | ... MongoDB ready
redis        | ... Ready to accept connections
elasticsearch| ... started
api          | npm install... (first time only)
api          | ✅ MongoDB connected successfully
api          | 🚀 Live MART API Server Started
api          | 📡 Port: 5000
client       | npm install... (first time only)
client       | webpack compiled successfully
client       | On Your Network: http://localhost:3000
```

---

## 🧪 Step 2: Test the Application

### 2.1 Open Frontend

Navigate to: **http://localhost:3000**

You should see:
- ✅ Beautiful gradient background
- ✅ "Live MART" title
- ✅ Backend status (healthy)
- ✅ Database status (connected)
- ✅ Server uptime
- ✅ List of completed features

### 2.2 Test Backend Health Check

Navigate to: **http://localhost:5000/api/health**

Expected JSON response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T...",
  "uptime": 123.45,
  "database": {
    "connected": true,
    "status": "connected",
    "host": "mongodb",
    "database": "livemart_dev"
  },
  "environment": "development"
}
```

### 2.3 Test Database Models

Navigate to: **http://localhost:5000/api/test/models**

Expected JSON response:
```json
{
  "success": true,
  "message": "Models loaded successfully",
  "models": {
    "User": "User",
    "Customer": "User",
    "Retailer": "User",
    "Wholesaler": "User"
  },
  "collections": ["users"],
  "database": "livemart_dev"
}
```

---

## 📊 Step 3: Verify Docker Containers

In a new terminal:

```bash
docker-compose -f docker/docker-compose.dev.yml ps
```

Expected output (all "Up"):
```
NAME                          STATUS
livemart-mongodb-dev          Up
livemart-redis-dev            Up
livemart-elasticsearch-dev    Up
livemart-api-dev              Up
livemart-client-dev           Up
```

---

## 🔍 Step 4: Check Logs

### Backend logs:
```bash
docker-compose -f docker/docker-compose.dev.yml logs -f api
```

Look for:
- ✅ `MongoDB connected successfully`
- ✅ `Live MART API Server Started`
- ✅ `Port: 5000`

### Frontend logs:
```bash
docker-compose -f docker/docker-compose.dev.yml logs -f client
```

Look for:
- ✅ `webpack compiled successfully`
- ✅ `On Your Network: http://localhost:3000`

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to backend"

**Solution:**
```bash
# Check if backend is running
docker-compose -f docker/docker-compose.dev.yml ps

# Restart backend
docker-compose -f docker/docker-compose.dev.yml restart api

# Check backend logs
docker-compose -f docker/docker-compose.dev.yml logs api
```

### Issue: "MongoDB connection failed"

**Solution:**
```bash
# Check if MongoDB is running
docker-compose -f docker/docker-compose.dev.yml ps mongodb

# Restart MongoDB
docker-compose -f docker/docker-compose.dev.yml restart mongodb
```

### Issue: "Port already in use"

**Solution:**
```bash
# Stop all containers
docker-compose -f docker/docker-compose.dev.yml down

# Kill process using port 3000 or 5000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Start again
docker-compose -f docker/docker-compose.dev.yml up
```

---

## 🎉 Success Criteria

You've successfully completed Phase 2.1 if:

- [ ] Docker shows all 5 containers running
- [ ] Frontend displays at http://localhost:3000
- [ ] Backend health check returns "healthy"
- [ ] Database status shows "connected"
- [ ] `/api/test/models` returns all 4 models
- [ ] No errors in Docker logs

---

## 📁 Files Created

```
server/src/
├── app.ts                    # Express server entry point
├── config/
│   └── database.ts           # MongoDB connection
├── utils/
│   └── logger.ts             # Winston logger
└── models/
    ├── User.model.ts         # Base user model
    ├── Customer.model.ts     # Customer model
    ├── Retailer.model.ts     # Retailer model
    └── Wholesaler.model.ts   # Wholesaler model

client/
├── public/
│   └── index.html            # HTML entry point
└── src/
    ├── index.tsx             # React entry point
    ├── App.tsx               # Main app component
    └── index.css             # Global styles
```

---

## 🎯 What's Next

After successful testing:

1. ✅ Continue with remaining Phase 2.1 models (Product, Order, Inventory, UPITransaction)
2. ✅ Move to Phase 2.2 (Authentication System)
3. ✅ Implement API endpoints

---

## 📸 Screenshots to Take

For your project documentation, take screenshots of:

1. Frontend dashboard showing backend status
2. `/api/health` JSON response
3. `/api/test/models` JSON response
4. Docker containers running (`docker ps`)
5. Backend logs showing "MongoDB connected"

---

**Ready to test? Run `docker-compose up` and visit http://localhost:3000!** 🚀
