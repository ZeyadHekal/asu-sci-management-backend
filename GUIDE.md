# Docker Setup Guide

## Services Overview

This Docker Compose setup includes the following services:

### 1. MySQL Database (`mysql`)
- **Image**: MySQL 8.0
- **Container**: `asu-management-mysql`
- **Port**: 3306
- **Volume**: `asu_management_mysql_data` for persistent data storage
- **Initialization**: Custom SQL scripts in `mysql-init/` directory

### 2. NestJS API (`api`)
- **Build**: From local Dockerfile
- **Container**: `asu-management-api`
- **Port**: 3001 (configurable via PORT env var)
- **Dependencies**: MySQL and MinIO services

### 3. PhpMyAdmin (`db-backup`)
- **Image**: arm64v8/phpmyadmin (or phpmyadmin/phpmyadmin for x86)
- **Container**: `asu-management-db-backup`
- **Port**: 8080
- **Purpose**: Database management interface

### 4. MinIO (`minio`)
- **Image**: minio/minio
- **Container**: `asu-management-minio`
- **Ports**: 
  - 9000 (API)
  - 9001 (Console)
- **Volume**: `asu_management_minio_data` for object storage

## Getting Started

### 1. Environment Setup
Ensure you have a `.env` file with the necessary environment variables. You can reference `default.env` for all required variables:
```bash
# Copy default.env as a reference if you need to create .env
cp default.env .env
```

### 2. Start Services
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Start specific service
docker-compose up -d mysql
```

### 3. Access Services

#### PhpMyAdmin (Database Management)
- URL: http://localhost:8080
- Server: mysql
- Username: root
- Password: root

#### MinIO Console (File Storage)
- URL: http://localhost:9001
- Username: minioadmin
- Password: minioadmin

#### API
- URL: http://localhost:3001

## Environment Variables

### Required Variables
- `PORT`: Application port (default: 3001)
- `DB_HOST`: Database host (use 'mysql' for Docker)
- `DB_PASSWORD`: Database password
- `MINIO_ENDPOINT`: MinIO endpoint (use 'minio' for Docker)

### Optional Variables
- `PHPMYADMIN_PORT`: PhpMyAdmin port (default: 8080)
- `MINIO_PORT`: MinIO API port (default: 9000)

## Configuration Notes

The `default.env` file contains all necessary environment variables for both the application and Docker Compose setup:
- **Database configuration**: Uses the same DB variables for both app and Docker services
- **MinIO configuration**: Uses the same MINIO variables for both app and Docker services  
- **Application settings**: JWT, WebSocket, and other app-specific configurations
- **Service ports**: PhpMyAdmin and other service port configurations

**Single Variable Set**: The Docker services use the same environment variables as the application:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` are used by both the app and MySQL container
- `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` are used by both the app and MinIO container

For Docker deployment, ensure your `.env` file uses:
- `DB_HOST=mysql`
- `MINIO_ENDPOINT=minio`

For local development without Docker, use:
- `DB_HOST=localhost`
- `MINIO_ENDPOINT=localhost`

## Development vs Production

### Docker Development
Use `default.env` as base and set:
- `DB_HOST=mysql`
- `MINIO_ENDPOINT=minio`

### Local Development
Use `local.env` as base and set:
- `DB_HOST=localhost`
- `MINIO_ENDPOINT=localhost`

## Useful Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: Data loss)
docker-compose down -v

# Rebuild API service
docker-compose build api
docker-compose up -d api

# View service logs
docker-compose logs mysql
docker-compose logs api
docker-compose logs minio

# Execute commands in containers
docker-compose exec mysql mysql -u root -p
docker-compose exec api npm run migration:run

# Connect to specific containers
docker exec -it asu-management-mysql bash
docker exec -it asu-management-api bash
docker exec -it asu-management-minio bash
```

## Troubleshooting

### MySQL Connection Issues
1. Ensure MySQL container is fully started: `docker-compose logs mysql`
2. Check if database is created: Access PhpMyAdmin
3. Verify environment variables in `.env`

### MinIO Issues
1. Check MinIO logs: `docker-compose logs minio`
2. Verify bucket creation in MinIO console
3. Ensure proper access keys in environment

### API Connection Issues
1. Verify MySQL and MinIO are running
2. Check API logs: `docker-compose logs api`
3. Ensure proper service dependencies 