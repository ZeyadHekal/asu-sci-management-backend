#!/bin/bash

echo "Starting database backup service..."

# Create initial backup
echo "Creating initial backup..."
/scripts/backup.sh

# Start cron in foreground
echo "Starting cron daemon..."
cron -f 