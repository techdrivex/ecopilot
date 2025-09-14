#!/bin/bash

# EcoPilot Setup Script
# This script sets up the development environment for EcoPilot

set -e

echo "🚀 Setting up EcoPilot development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    # Check Docker (optional)
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. You can install it for containerized development."
    fi
    
    # Check Docker Compose (optional)
    if ! command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose is not installed. You can install it for containerized development."
    fi
    
    print_success "System requirements check completed"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Copy .env.example to .env if it doesn't exist
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
        print_warning "Please update .env file with your configuration"
    else
        print_status ".env file already exists"
    fi
    
    # Create logs directory
    mkdir -p logs
    print_success "Created logs directory"
}

# Install backend dependencies
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Install dependencies
    npm install
    print_success "Backend dependencies installed"
    
    # Create logs directory
    mkdir -p logs
    print_success "Backend logs directory created"
    
    cd ..
}

# Install frontend dependencies
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    npm install
    print_success "Frontend dependencies installed"
    
    cd ..
}

# Install mobile dependencies
setup_mobile() {
    print_status "Setting up mobile app..."
    
    cd mobile
    
    # Install dependencies
    npm install
    print_success "Mobile dependencies installed"
    
    cd ..
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Check if MongoDB is running
    if command -v mongod &> /dev/null; then
        if pgrep -x "mongod" > /dev/null; then
            print_success "MongoDB is running"
        else
            print_warning "MongoDB is not running. Please start MongoDB or use Docker."
        fi
    else
        print_warning "MongoDB is not installed. Please install MongoDB or use Docker."
    fi
    
    # Check if Redis is running
    if command -v redis-server &> /dev/null; then
        if pgrep -x "redis-server" > /dev/null; then
            print_success "Redis is running"
        else
            print_warning "Redis is not running. Please start Redis or use Docker."
        fi
    else
        print_warning "Redis is not installed. Please install Redis or use Docker."
    fi
}

# Setup Git hooks
setup_git_hooks() {
    print_status "Setting up Git hooks..."
    
    # Install husky
    npm install --save-dev husky
    
    # Setup pre-commit hook
    npx husky install
    npx husky add .husky/pre-commit "npm run lint-staged"
    
    print_success "Git hooks configured"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    # Create data directories
    mkdir -p data/{models,samples,raw,processed}
    
    # Create upload directories
    mkdir -p uploads/{avatars,vehicles,trips}
    
    # Create deployment directories
    mkdir -p deployment/{docker,kubernetes,nginx}
    
    print_success "Directories created"
}

# Main setup function
main() {
    echo "🌱 EcoPilot Setup Script"
    echo "========================="
    echo ""
    
    check_requirements
    setup_environment
    create_directories
    setup_backend
    setup_frontend
    setup_mobile
    setup_database
    setup_git_hooks
    
    echo ""
    print_success "🎉 EcoPilot setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update .env file with your configuration"
    echo "2. Start MongoDB and Redis (or use Docker)"
    echo "3. Run 'npm run dev' in the backend directory"
    echo "4. Run 'npm start' in the frontend directory"
    echo "5. Run 'npm start' in the mobile directory"
    echo ""
    echo "For Docker development:"
    echo "1. Run 'docker-compose up -d' to start all services"
    echo "2. Access the app at http://localhost:3001"
    echo ""
    echo "Happy coding! 🚗💨"
}

# Run main function
main "$@"