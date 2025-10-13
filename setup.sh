#!/bin/bash

# Alenna API - Setup Script
# This script automates the initial setup process

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Alenna API - Setup Script           ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Step 1: Check prerequisites
echo -e "${BLUE}[1/6]${NC} Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}! pnpm not found. Installing...${NC}"
    npm install -g pnpm
fi
echo -e "${GREEN}✓ pnpm $(pnpm --version)${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✓ Docker $(docker --version | cut -d ' ' -f3 | tr -d ',')${NC}"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose${NC}"

echo ""

# Step 2: Install dependencies
echo -e "${BLUE}[2/6]${NC} Installing dependencies..."
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: Setup environment file
echo -e "${BLUE}[3/6]${NC} Setting up environment file..."

if [ -f ".env" ]; then
    echo -e "${YELLOW}! .env file already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}→ Skipping .env creation${NC}"
    else
        cp env.template .env
        echo -e "${GREEN}✓ .env file created${NC}"
    fi
else
    cp env.template .env
    echo -e "${GREEN}✓ .env file created from template${NC}"
fi
echo ""

# Step 4: Start Docker containers
echo -e "${BLUE}[4/6]${NC} Starting Docker containers..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}→ Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Check if PostgreSQL is healthy
if docker-compose ps | grep -q "alenna-postgres.*healthy"; then
    echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
else
    echo -e "${YELLOW}! PostgreSQL is starting... (this may take a moment)${NC}"
    sleep 5
fi
echo ""

# Step 5: Generate Prisma Client
echo -e "${BLUE}[5/6]${NC} Generating Prisma Client..."
pnpm run prisma:generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"
echo ""

# Step 6: Run database migrations
echo -e "${BLUE}[6/6]${NC} Running database migrations..."
echo -e "${YELLOW}→ When prompted, enter a name for the migration (e.g., 'init')${NC}"
echo ""
pnpm run prisma:migrate
echo -e "${GREEN}✓ Database migrations completed${NC}"
echo ""

# Success message
echo ""
echo "╔════════════════════════════════════════╗"
echo "║   Setup completed successfully! 🚀     ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo ""
echo "Next steps:"
echo ""
echo "1. Update .env file with your Clerk API keys:"
echo "   Get them from: https://dashboard.clerk.com"
echo ""
echo "2. (Optional) Seed the database:"
echo "   pnpm run prisma:seed"
echo ""
echo "3. Start the development server:"
echo "   pnpm run dev"
echo ""
echo "4. Access pgAdmin (Database GUI):"
echo "   http://localhost:5050"
echo "   Email: admin@alenna.local"
echo "   Password: admin"
echo ""
echo "Happy coding! 🎉"

