# ASU Science Management Backend - Startup Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Project Overview](#project-overview)
- [Quick Start Guide](#quick-start-guide)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Docker Setup (Recommended)](#docker-setup-recommended)
- [Local Development Setup](#local-development-setup)
- [Accessing Services](#accessing-services)
- [Database and Seeding](#database-and-seeding)
- [Development Tools](#development-tools)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting the application, ensure you have the following installed:

### Required Software
- **Node.js** (version 22 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Docker** and **Docker Compose** (for containerized setup) - [Download here](https://docker.com/)

### Optional Software (for local development)
- **MySQL** (version 8.0 or higher) - [Download here](https://dev.mysql.com/downloads/)
- **MinIO** (for object storage) - [Download here](https://min.io/download)

### System Requirements
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: At least 2GB free space
- **Operating System**: Windows 10/11, macOS 10.15+, or Linux

## Project Overview

This is a NestJS-based backend application for ASU Science Management system with the following components:

### Core Services
- **NestJS API**: Main application server (Port: 3001)
- **MySQL Database**: Data storage (Port: 3306)
- **MinIO**: Object storage for files (Ports: 9000/9001)
- **PhpMyAdmin**: Database management interface (Port: 8080)

### Key Features
- Authentication and authorization
- Course and student management
- Lab session tracking
- Device and software management
- File uploads and management
- Real-time WebSocket communication

## Quick Start Guide

### Option 1: Docker (Recommended)
```bash
# 1. Clone and navigate to the project
git clone <repository-url>
cd asu-sci-management-backend

# 2. Copy environment configuration
cp default.env .env

# 3. Start all services with Docker
docker-compose up -d

# 4. View logs to ensure everything is running
docker-compose logs -f
```

### Option 2: Local Development
```bash
# 1. Clone and navigate to the project
git clone <repository-url>
cd asu-sci-management-backend

# 2. Install dependencies
npm install

# 3. Set up environment for local development
cp default.env .env
# Edit .env file to use localhost instead of service names

# 4. Start external services (MySQL, MinIO)
# You need to install and start these manually

# 5. Run the application
npm run start:dev
```

## Environment Configuration

### Environment Files Overview
- **`default.env`**: Default configuration (for Docker)
- **`.env`**: Your local configuration (create from default.env)

### Required Environment Variables

```bash
# Application Settings
PORT=3001
CREATE_DEFAULT_USERS=true
PASSWORD_SALT=10
JWT_SECRET=your_random_secret_key_here

# Database Configuration
DB_HOST=mysql          # Use 'mysql' for Docker, 'localhost' for local
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_NAME=management_system
DB_SYNCHRONIZE=true    # Auto-sync database schema
DB_LOGGING=false

# MinIO Object Storage
MINIO_ENDPOINT=minio   # Use 'minio' for Docker, 'localhost' for local
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=asu-sci-management
MINIO_SIGNED_URL_EXPIRY=3600

# WebSocket Configuration
WS_PATH=/ws
WS_CORS_ORIGIN=https://example.com,http://localhost:5173
WS_PING_TIMEOUT=10000
WS_TRANSPORTS=websocket
```

### Environment Setup for Different Scenarios

#### Docker Development (Recommended)
```bash
cp default.env .env
# Use default.env as is - it's already configured for Docker
```

#### Local Development
```bash
cp default.env .env
# Edit .env file and change:
DB_HOST=localhost
MINIO_ENDPOINT=localhost
```

## Running the Application

### Using Docker (Recommended)

#### Start All Services
```bash
# Start all services in background
docker-compose up -d

# Start with logs visible
docker-compose up

# Start specific services
docker-compose up -d mysql minio
docker-compose up -d api
```

#### Development Commands
```bash
# View logs
docker-compose logs -f
docker-compose logs -f api

# Restart specific service
docker-compose restart api

# Rebuild and restart
docker-compose build api
docker-compose up -d api

# Stop all services
docker-compose down

# Stop and remove all data (WARNING: Data loss!)
docker-compose down -v
```

### Using Local Development

#### Prerequisites Setup
1. **Install and start MySQL**:
   ```bash
   # Create database
   mysql -u root -p
   CREATE DATABASE management_system;
   ```

2. **Install and start MinIO**:
   ```bash
   # Download and run MinIO
   minio server ./data --console-address ":9001"
   ```

#### Run the Application
```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## Docker Setup (Recommended)

### Services Overview

#### 1. MySQL Database (`mysql`)
- **Image**: MySQL 8.0
- **Container**: `asu-management-mysql`
- **Port**: 3306
- **Volume**: `asu_management_mysql_data` for persistent data storage
- **Initialization**: Custom SQL scripts in `mysql-init/` directory

#### 2. NestJS API (`api`)
- **Build**: From local Dockerfile
- **Container**: `asu-management-api`
- **Port**: 3001 (configurable via PORT env var)
- **Dependencies**: MySQL and MinIO services

#### 3. PhpMyAdmin (`db-backup`)
- **Image**: arm64v8/phpmyadmin (or phpmyadmin/phpmyadmin for x86)
- **Container**: `asu-management-db-backup`
- **Port**: 8080
- **Purpose**: Database management interface

#### 4. MinIO (`minio`)
- **Image**: minio/minio
- **Container**: `asu-management-minio`
- **Ports**: 
  - 9000 (API)
  - 9001 (Console)
- **Volume**: `asu_management_minio_data` for object storage

## Local Development Setup

### Manual Service Setup

#### MySQL Setup
```bash
# Install MySQL 8.0
# Create database
mysql -u root -p
CREATE DATABASE management_system;
CREATE USER 'root'@'localhost' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON management_system.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

#### MinIO Setup
```bash
# Download MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio

# Start MinIO server
./minio server ./data --console-address ":9001"
```

### Development Workflow
```bash
# Install dependencies
npm install

# Start in development mode
npm run start:dev

# Run tests
npm run test
npm run test:e2e

# Format code
npm run format

# Lint code
npm run lint
```

## Accessing Services

### Application URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **API** | http://localhost:3001 | N/A |
| **API Docs (Swagger)** | http://localhost:3001/api | N/A |
| **PhpMyAdmin** | http://localhost:8080 | Server: `mysql`, User: `root`, Password: `root` |
| **MinIO Console** | http://localhost:9001 | User: `minioadmin`, Password: `minioadmin` |
| **WebSocket** | ws://localhost:3001/socket.io | N/A |

### Default User Accounts
When `CREATE_DEFAULT_USERS=true`, the following accounts are created:

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| Admin | `admin` | `Abcd@1234` | System administrator |
| Secretary | `secretary` | `Abcd@1234` | Administrative staff |
| Lab Admin | `lab_admin` | `Abcd@1234` | Laboratory administrator |
| Student | `student` | `Abcd@1234` | Student account |

## Database and Seeding

### Automatic Database Setup
The application automatically:
- Creates database tables on startup (when `DB_SYNCHRONIZE=true`)
- Seeds initial data including:
  - Default users (if `CREATE_DEFAULT_USERS=true`)
  - Sample courses and professors
  - Laboratory information
  - Device configurations

### Manual Database Operations
```bash
# Access database via PhpMyAdmin
# URL: http://localhost:8080

# Or via command line (Docker)
docker-compose exec mysql mysql -u root -p management_system

# Or via command line (Local)
mysql -u root -p management_system
```

## Development Tools

### Available Scripts
```bash
# Development
npm run start:dev      # Start with hot reload
npm run start:debug    # Start with debugging
npm run build          # Build for production
npm run start:prod     # Start production build

# Testing
npm run test           # Run unit tests
npm run test:watch     # Run tests in watch mode
npm run test:e2e       # Run end-to-end tests
npm run test:cov       # Run tests with coverage

# Code Quality
npm run lint           # Lint code
npm run format         # Format code

# Utilities
npm run salt           # Generate password salt
```

### Useful Docker Commands
```bash
# Container Management
docker-compose ps                    # List running containers
docker-compose logs <service>        # View service logs
docker-compose exec <service> bash   # Access container shell

# Database Operations
docker-compose exec mysql mysql -u root -p
docker-compose exec api npm run migration:run

# File Operations
docker cp local_file container_name:/path/to/destination
docker cp container_name:/path/to/file local_destination
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
netstat -tulpn | grep :3001
lsof -i :3001

# Stop the process or change the port in .env
PORT=3002
```

#### 2. Database Connection Failed
```bash
# Check if MySQL is running
docker-compose ps mysql
docker-compose logs mysql

# Verify database credentials in .env
# Ensure DB_HOST matches your setup ('mysql' for Docker, 'localhost' for local)
```

#### 3. MinIO Connection Issues
```bash
# Check MinIO status
docker-compose ps minio
docker-compose logs minio

# Verify MinIO settings in .env
# Access MinIO console to check bucket creation
```

#### 4. Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# For Docker, rebuild the image
docker-compose build api
```

#### 5. Permission Denied (Linux/macOS)
```bash
# Fix Docker permissions
sudo chmod +x ./scripts/*
sudo chown -R $USER:$USER ./data

# Fix MinIO data directory
sudo chmod -R 755 ./minio-data
```

### Getting Help

1. **Check Logs**: Always start by checking application logs
   ```bash
   # Docker
   docker-compose logs -f api
   
   # Local
   npm run start:dev  # Logs appear in console
   ```

2. **Verify Environment**: Ensure all environment variables are correctly set
   ```bash
   # Check current environment
   cat .env
   ```

3. **Service Health**: Verify all required services are running
   ```bash
   # Docker
   docker-compose ps
   
   # Local
   # Check MySQL: mysql -u root -p
   # Check MinIO: curl http://localhost:9000/minio/health/live
   ```

4. **Reset Everything**: If all else fails, reset the entire setup
   ```bash
   # Docker (WARNING: Will delete all data)
   docker-compose down -v
   docker-compose up -d
   
   # Local
   # Drop and recreate database
   # Clear MinIO data directory
   # rm -rf node_modules && npm install
   ```

### Performance Tips

1. **Increase Docker Resources**: Ensure Docker has enough RAM (4GB+)
2. **SSD Storage**: Use SSD for better database performance
3. **Environment Variables**: Set `DB_LOGGING=false` in production
4. **Node.js Memory**: Increase Node.js heap size if needed:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run start:prod
   ```

---

**Need Help?** If you encounter issues not covered here, please check the project's issue tracker or contact the development team. 