# EcoPilot Setup Guide

This guide will help you set up the EcoPilot development environment on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 8+ (comes with Node.js)
- **MongoDB** 5+ ([Download](https://www.mongodb.com/try/download/community))
- **Redis** 6+ ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/))

### Optional (for containerized development)
- **Docker** ([Download](https://www.docker.com/products/docker-desktop))
- **Docker Compose** (comes with Docker Desktop)

## Quick Setup

### 1. Clone the Repository

```bash
git clone https://github.com/techdrivex/ecopilot.git
cd ecopilot
```

### 2. Run the Setup Script

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This script will:
- Check system requirements
- Install all dependencies
- Set up environment files
- Create necessary directories
- Configure Git hooks

### 3. Configure Environment

Edit the `.env` file with your configuration:

```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Start Services

#### Option A: Local Development

1. **Start MongoDB:**
   ```bash
   # macOS (with Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```

2. **Start Redis:**
   ```bash
   # macOS (with Homebrew)
   brew services start redis
   
   # Linux
   sudo systemctl start redis
   
   # Windows
   redis-server
   ```

3. **Start the Backend:**
   ```bash
   npm run dev:backend
   ```

4. **Start the Frontend:**
   ```bash
   npm run dev:frontend
   ```

5. **Start the Mobile App (optional):**
   ```bash
   npm run dev:mobile
   ```

#### Option B: Docker Development

```bash
# Start all services with Docker
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

## Manual Setup

If you prefer to set up manually or the script fails:

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install mobile dependencies
cd mobile
npm install
cd ..
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Update the following variables in `.env`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/ecopilot
REDIS_URL=redis://localhost:6379

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# External API Keys (optional)
OPENWEATHER_API_KEY=your-openweather-api-key
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 3. Database Setup

#### MongoDB Setup

1. **Create Database:**
   ```bash
   mongo
   use ecopilot
   ```

2. **Run Migrations:**
   ```bash
   npm run db:migrate
   ```

3. **Seed Data (optional):**
   ```bash
   npm run db:seed
   ```

#### Redis Setup

Redis should start automatically. Verify it's running:

```bash
redis-cli ping
# Should return: PONG
```

### 4. Start Development Servers

#### Backend Server

```bash
cd backend
npm run dev
```

The backend will be available at: `http://localhost:3000`
API Documentation: `http://localhost:3000/api-docs`

#### Frontend Application

```bash
cd frontend
npm start
```

The frontend will be available at: `http://localhost:3001`

#### Mobile Application

```bash
cd mobile
npm start
```

Follow the React Native CLI instructions to run on iOS/Android.

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend

# Run mobile tests only
npm run test:mobile
```

### Code Quality

```bash
# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Database Management

```bash
# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Reset database
npm run db:reset
```

### Docker Commands

```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# Rebuild containers
npm run docker:build

# View logs
npm run docker:logs

# Clean up
npm run docker:clean
```

## Project Structure

```
ecopilot/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/          # Utility functions
│   │   └── config/         # Configuration files
│   ├── tests/              # Backend tests
│   └── package.json
├── frontend/               # React web application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json
├── mobile/                 # React Native mobile app
│   ├── src/
│   │   ├── components/     # React Native components
│   │   ├── screens/        # Screen components
│   │   ├── navigation/      # Navigation setup
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── package.json
├── docs/                   # Documentation
├── scripts/                # Setup and utility scripts
├── deployment/             # Deployment configurations
├── data/                   # Data files and samples
├── tools/                  # Development tools
├── docker-compose.yml      # Docker services
├── .env.example           # Environment template
└── package.json           # Root package.json
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

If you get "port already in use" errors:

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different ports in .env
PORT=3001
```

#### 2. MongoDB Connection Issues

```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start MongoDB
brew services start mongodb-community

# Check MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log
```

#### 3. Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping

# Start Redis
brew services start redis

# Check Redis logs
tail -f /usr/local/var/log/redis.log
```

#### 4. Node Modules Issues

```bash
# Clean and reinstall
npm run clean
npm run install:all
```

#### 5. Docker Issues

```bash
# Clean Docker
npm run docker:clean

# Rebuild containers
npm run docker:build
npm run docker:up
```

### Environment Variables

Make sure all required environment variables are set:

- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `PORT` - Backend server port
- `FRONTEND_URL` - Frontend URL for CORS

### Database Issues

If you encounter database issues:

1. **Check MongoDB status:**
   ```bash
   mongo --eval "db.adminCommand('ismaster')"
   ```

2. **Check Redis status:**
   ```bash
   redis-cli ping
   ```

3. **Reset database:**
   ```bash
   npm run db:reset
   ```

## Getting Help

If you encounter issues:

1. Check the [API Documentation](API.md)
2. Review the [Troubleshooting](#troubleshooting) section
3. Search existing [GitHub Issues](https://github.com/techdrivex/ecopilot/issues)
4. Create a new issue with:
   - Your operating system
   - Node.js version
   - Error messages
   - Steps to reproduce

## Next Steps

Once setup is complete:

1. **Explore the API:** Visit `http://localhost:3000/api-docs`
2. **Test the Frontend:** Visit `http://localhost:3001`
3. **Read the Documentation:** Check the `docs/` folder
4. **Run Tests:** Ensure everything works with `npm test`
5. **Start Developing:** Begin with the [Development Guide](DEVELOPMENT.md)

## Production Deployment

For production deployment, see the [Deployment Guide](DEPLOYMENT.md).

---

Happy coding! 🚗💨