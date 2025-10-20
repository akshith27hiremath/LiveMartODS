# Pure Docker Development Workflow

This project is configured for a **pure Docker workflow** - you don't need to install Node.js or npm locally!

## 🚀 Quick Start

### Prerequisites
- **Docker Desktop** installed and running
- That's it! No Node.js required!

### Start Development Environment

```bash
# From project root directory
docker-compose -f docker/docker-compose.dev.yml up
```

**First time startup**: ~2-3 minutes (installs dependencies)
**Subsequent startups**: ~10-30 seconds (uses cached dependencies)

### What Happens

When you run `docker-compose up`, Docker will automatically:

1. ✅ Start MongoDB (port 27017)
2. ✅ Start Redis (port 6379)
3. ✅ Start Elasticsearch (port 9200)
4. ✅ Install backend dependencies (`server/node_modules/`)
5. ✅ Start backend server (port 5000)
6. ✅ Install frontend dependencies (`client/node_modules/`)
7. ✅ Start React app (port 3000)

### Access Your Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 📂 What Gets Created

After first run, Docker will create these folders in your project:

```
server/
└── node_modules/        ← Created by Docker (gitignored)
    └── (5000+ packages)

client/
└── node_modules/        ← Created by Docker (gitignored)
    └── (2000+ packages)
```

**Note**: These are created by Docker but live in your local filesystem. They're automatically ignored by git.

## 🔥 Hot Reload

Code changes are **automatically detected**:

- Edit `server/src/**/*.ts` → Backend restarts automatically
- Edit `client/src/**/*.tsx` → Frontend reloads automatically
- No need to restart Docker!

## 📋 Common Commands

```bash
# Start services (foreground - see logs)
docker-compose -f docker/docker-compose.dev.yml up

# Start services (background - detached)
docker-compose -f docker/docker-compose.dev.yml up -d

# View logs
docker-compose -f docker/docker-compose.dev.yml logs -f

# View logs for specific service
docker-compose -f docker/docker-compose.dev.yml logs -f api
docker-compose -f docker/docker-compose.dev.yml logs -f client

# Stop services
docker-compose -f docker/docker-compose.dev.yml down

# Stop services and remove volumes (clean slate)
docker-compose -f docker/docker-compose.dev.yml down -v

# Restart specific service
docker-compose -f docker/docker-compose.dev.yml restart api

# Rebuild containers (after changing dependencies)
docker-compose -f docker/docker-compose.dev.yml up --build
```

## 🐛 Troubleshooting

### "Dependencies not installing"

If npm install seems stuck, check the logs:
```bash
docker-compose -f docker/docker-compose.dev.yml logs api
```

### "Port already in use"

Stop existing containers:
```bash
docker-compose -f docker/docker-compose.dev.yml down
```

Or find and kill the process using the port:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### "Changes not reflecting"

1. Make sure the file is saved
2. Check logs for errors: `docker-compose logs -f`
3. Restart the specific service: `docker-compose restart api`

### "Clean start needed"

Remove everything and start fresh:
```bash
# Stop and remove containers, networks, volumes
docker-compose -f docker/docker-compose.dev.yml down -v

# Remove local node_modules (optional)
rm -rf server/node_modules client/node_modules

# Start again
docker-compose -f docker/docker-compose.dev.yml up
```

## 🔧 Adding New Dependencies

When you add packages to `package.json`:

### Option 1: Restart Container (Automatic)
```bash
docker-compose -f docker/docker-compose.dev.yml restart api
# or
docker-compose -f docker/docker-compose.dev.yml restart client
```

Dependencies will be installed automatically on restart.

### Option 2: Manual Install Inside Container
```bash
# Backend
docker exec -it livemart-api-dev npm install <package-name>

# Frontend
docker exec -it livemart-client-dev npm install <package-name>
```

## 📊 Container Status

Check if all containers are running:
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

## 🎯 Why Pure Docker?

**Advantages:**
- ✅ No Node.js installation required locally
- ✅ Consistent environment across all developers
- ✅ Works identically on Windows, Mac, and Linux
- ✅ Easy onboarding for new team members
- ✅ Isolated dependencies (no version conflicts)
- ✅ Clean uninstall (just remove containers)

**Trade-offs:**
- ⚠️ First startup takes 2-3 minutes (one-time)
- ⚠️ `node_modules/` folders created locally (can delete anytime)
- ⚠️ Requires Docker Desktop running

## 🚫 What You DON'T Need

- ❌ `setup.bat` or `setup.sh` - Skip these!
- ❌ Local Node.js installation - Not required!
- ❌ Local `npm install` - Docker handles it!
- ❌ Global packages - Everything is containerized!

## 🎓 Learning Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Project README](./README.md) - Full project documentation
- [Setup Guide](./docs/SETUP_GUIDE.md) - Detailed setup instructions

---

**Happy coding with Docker! 🐳**
