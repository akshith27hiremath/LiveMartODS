#!/bin/bash

# Live MART - Quick Setup Script
# This script helps you set up the project quickly

set -e  # Exit on error

echo "=========================================="
echo "  Live MART - Quick Setup Script"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${BLUE}Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js $NODE_VERSION is installed${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install npm first.${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✓ npm $NPM_VERSION is installed${NC}"

# Check if Docker is installed
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓ Docker is installed: $DOCKER_VERSION${NC}"
    DOCKER_AVAILABLE=true
else
    echo -e "${BLUE}Docker is not installed. You'll need to run services manually.${NC}"
    DOCKER_AVAILABLE=false
fi

echo ""
echo -e "${BLUE}Setting up environment...${NC}"

# Create .env file if it doesn't exist
if [ ! -f .env.development ]; then
    echo -e "${BLUE}Creating .env.development file...${NC}"
    cp .env.example .env.development
    echo -e "${GREEN}✓ Created .env.development${NC}"
else
    echo -e "${GREEN}✓ .env.development already exists${NC}"
fi

# Install server dependencies
echo ""
echo -e "${BLUE}Installing server dependencies...${NC}"
cd server
npm install
echo -e "${GREEN}✓ Server dependencies installed${NC}"
cd ..

# Install client dependencies
echo ""
echo -e "${BLUE}Installing client dependencies...${NC}"
cd client
npm install
echo -e "${GREEN}✓ Client dependencies installed${NC}"
cd ..

# Ask user if they want to use Docker
echo ""
if [ "$DOCKER_AVAILABLE" = true ]; then
    read -p "Do you want to start services with Docker? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Starting services with Docker...${NC}"
        docker-compose -f docker/docker-compose.dev.yml up -d
        echo ""
        echo -e "${GREEN}=========================================="
        echo "  Setup Complete! 🎉"
        echo "==========================================${NC}"
        echo ""
        echo "Services are running:"
        echo "  - Frontend: http://localhost:3000"
        echo "  - Backend:  http://localhost:5000"
        echo "  - MongoDB:  localhost:27017"
        echo "  - Redis:    localhost:6379"
        echo ""
        echo "To view logs: docker-compose -f docker/docker-compose.dev.yml logs -f"
        echo "To stop:      docker-compose -f docker/docker-compose.dev.yml down"
    else
        echo ""
        echo -e "${GREEN}=========================================="
        echo "  Setup Complete! 🎉"
        echo "==========================================${NC}"
        echo ""
        echo "To start manually:"
        echo "  1. Start MongoDB, Redis, and Elasticsearch"
        echo "  2. In one terminal: cd server && npm run dev"
        echo "  3. In another terminal: cd client && npm start"
    fi
else
    echo ""
    echo -e "${GREEN}=========================================="
    echo "  Setup Complete! 🎉"
    echo "==========================================${NC}"
    echo ""
    echo "To start manually:"
    echo "  1. Start MongoDB, Redis, and Elasticsearch"
    echo "  2. In one terminal: cd server && npm run dev"
    echo "  3. In another terminal: cd client && npm start"
fi

echo ""
echo "For detailed setup instructions, see docs/SETUP_GUIDE.md"
echo ""
