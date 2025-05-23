-- Initialize the database with proper charset and collation
CREATE DATABASE IF NOT EXISTS `management_system` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE `management_system`;

-- Set default charset for the session
SET
    NAMES utf8mb4;

-- Ensure proper time zone handling
SET
    time_zone = '+00:00';

-- Grant necessary privileges to the database user
GRANT ALL PRIVILEGES ON `management_system`.* TO 'root' @'%';

FLUSH PRIVILEGES;