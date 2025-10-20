# Live MART - Setup Guide

This guide will help you get the Live MART project up and running on your local machine.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation Steps](#installation-steps)
3. [Docker Setup](#docker-setup)
4. [Manual Setup](#manual-setup)
5. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Node.js**: Version 18.0.0 or higher
  - Download: https://nodejs.org/
  - Verify: `node --version`

- **npm**: Version 9.0.0 or higher
  - Comes with Node.js
  - Verify: `npm --version`

- **Git**: For version control
  - Download: https://git-scm.com/
  - Verify: `git --version`

### For Docker Setup (Recommended)
- **Docker Desktop**: Latest version
  - Download: https://www.docker.com/products/docker-desktop
  - Verify: `docker --version`

- **Docker Compose**: Usually comes with Docker Desktop
  - Verify: `docker-compose --version`

### For Manual Setup
- **MongoDB**: Version 7 or higher
  - Download: https://www.mongodb.com/try/download/community

- **Redis**: Version 7 or higher
  - Download: https://redis.io/download

- **Elasticsearch**: Version 8.11.0
  - Download: https://www.elastic.co/downloads/elasticsearch

## Installation Steps

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd AssignmentOOPS
```

### 2. Install Dependencies

#### Install Server Dependencies
```bash
cd server
npm install
cd ..
```

#### Install Client Dependencies
```bash
cd client
npm install
cd ..
```

### 3. Setup Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.development

# Open .env.development and update the values
```

**Important Environment Variables to Configure:**

```env
# Database
MONGODB_URI=mongodb://admin:password123@localhost:27017/livemart_dev?authSource=admin

# Redis
REDIS_URL=redis://localhost:6379

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# JWT Secrets (change these!)
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
```

## Docker Setup (Recommended)

Docker is the easiest way to get started as it handles all the dependencies automatically.

### Step 1: Start Services

```bash
# Start all services in development mode
docker-compose -f docker/docker-compose.dev.yml up -d
```

This command will start:
- MongoDB (port 27017)
- Redis (port 6379)
- Elasticsearch (port 9200)
- Backend API (port 5000)
- Frontend Client (port 3000)

### Step 2: Verify Services

```bash
# Check if all containers are running
docker-compose -f docker/docker-compose.dev.yml ps

# View logs
docker-compose -f docker/docker-compose.dev.yml logs -f
```

### Step 3: Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379
- **Elasticsearch**: http://localhost:9200

### Useful Docker Commands

```bash
# Stop all services
docker-compose -f docker/docker-compose.dev.yml down

# Restart a specific service
docker-compose -f docker/docker-compose.dev.yml restart api

# View logs for a specific service
docker-compose -f docker/docker-compose.dev.yml logs -f api

# Rebuild containers
docker-compose -f docker/docker-compose.dev.yml up -d --build

# Remove all containers and volumes (clean slate)
docker-compose -f docker/docker-compose.dev.yml down -v
```

## Manual Setup

If you prefer not to use Docker, follow these steps:

### Step 1: Start Database Services

#### Start MongoDB
```bash
# Windows
mongod --dbpath C:\data\db

# macOS/Linux
mongod --dbpath /data/db
```

#### Start Redis
```bash
# Windows (if installed via WSL or native)
redis-server

# macOS
brew services start redis

# Linux
sudo systemctl start redis
```

#### Start Elasticsearch
```bash
# Windows/macOS/Linux
cd <elasticsearch-directory>
./bin/elasticsearch
```

### Step 2: Start Backend Server

```bash
cd server
npm run dev
```

The backend will start on http://localhost:5000

### Step 3: Start Frontend Client

Open a new terminal:

```bash
cd client
npm start
```

The frontend will start on http://localhost:3000

### Step 4: Verify Setup

Open http://localhost:3000 in your browser. You should see the Live MART homepage.

## Troubleshooting

### Port Already in Use

**Error**: Port 3000 or 5000 is already in use

**Solution**:
```bash
# Windows - Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Docker Container Fails to Start

**Error**: Container exits immediately

**Solution**:
```bash
# Check logs
docker-compose -f docker/docker-compose.dev.yml logs <service-name>

# Rebuild containers
docker-compose -f docker/docker-compose.dev.yml up -d --build

# Remove all containers and start fresh
docker-compose -f docker/docker-compose.dev.yml down -v
docker-compose -f docker/docker-compose.dev.yml up -d
```

### MongoDB Connection Error

**Error**: `MongoNetworkError: failed to connect to server`

**Solution**:
- Ensure MongoDB is running
- Check connection string in `.env.development`
- Verify port 27017 is not blocked by firewall

### Redis Connection Error

**Error**: `Error: Redis connection to localhost:6379 failed`

**Solution**:
- Ensure Redis is running: `redis-cli ping` (should return PONG)
- Check Redis URL in `.env.development`
- Restart Redis service

### Elasticsearch Not Starting

**Error**: Elasticsearch fails to start

**Solution**:
```bash
# Check system requirements (needs at least 2GB RAM)
# Reduce memory for development (in docker-compose.dev.yml):
ES_JAVA_OPTS=-Xms256m -Xmx256m
```

### Module Not Found Errors

**Error**: `Cannot find module 'xyz'`

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or in Docker
docker-compose -f docker/docker-compose.dev.yml down
docker-compose -f docker/docker-compose.dev.yml up -d --build
```

### TypeScript Compilation Errors

**Error**: TypeScript errors during build

**Solution**:
```bash
# Check TypeScript version
npm list typescript

# Reinstall TypeScript
npm install typescript@latest --save-dev

# Run type checking
npm run typecheck
```

## Next Steps

After successful setup:

1. **Read the documentation** in `/docs` folder
2. **Review the codebase structure** in `abstractplan.txt`
3. **Check the UML diagram** in `Structure.mmd`
4. **Start developing features** following the module structure

## Getting Help

If you encounter issues not covered here:

1. Check the main `README.md`
2. Review the `abstractplan.txt` for architecture details
3. Look at Docker logs for specific errors
4. Search for similar issues online
5. Contact your team members or instructor

## Development Workflow

Once setup is complete:

```bash
# 1. Create a new feature branch
git checkout -b feature/your-feature-name

# 2. Make changes
# Edit files...

# 3. Test your changes
cd server && npm test
cd client && npm test

# 4. Commit changes
git add .
git commit -m "feat: your feature description"

# 5. Push to repository
git push origin feature/your-feature-name
```

Happy coding! 🚀
