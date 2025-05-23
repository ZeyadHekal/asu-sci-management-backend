#!/bin/bash

# Wait for MySQL to be ready
while ! mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -uroot -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1" > /dev/null 2>&1; do
    echo "Waiting for MySQL to be ready..."
    sleep 5
done

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE=/backups/backup_$DATE.sql

echo "Starting backup at $(date)"

# Create backup
if mysqldump -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" > "$BACKUP_FILE"; then
    echo "Database dump completed successfully"
    
    # Compress backup
    if gzip "$BACKUP_FILE"; then
        echo "Backup compressed successfully: $BACKUP_FILE.gz"
        
        # Remove backups older than 7 days
        find /backups -name '*.sql.gz' -mtime +7 -delete
        echo "Old backups cleaned up"
        
        echo "Backup completed successfully at $(date)"
    else
        echo "Failed to compress backup"
        rm -f "$BACKUP_FILE"
        exit 1
    fi
else
    echo "Failed to create database dump"
    exit 1
fi 