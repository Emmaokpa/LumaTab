-- Appwrite Database Collections Setup
-- Run these commands in your Appwrite console or use the Appwrite CLI

-- 1. Create Database (if not exists)
-- Database ID: lumatab_db

-- 2. Create Collections

-- Wallpapers Collection
-- Collection ID: wallpapers
-- Attributes:
-- title (string, required, size: 255)
-- description (string, required, size: 1000)
-- imageUrl (string, required, size: 500)
-- thumbnailUrl (string, required, size: 500)
-- category (string, required, size: 50)
-- tags (string array, required)
-- price (integer, required, default: 0)
-- isPremium (boolean, required, default: false)
-- isLive (boolean, required, default: false)
-- creatorId (string, required, size: 50)
-- creatorName (string, required, size: 100)
-- creatorAvatar (string, required, size: 500)
-- downloads (integer, required, default: 0)
-- likes (integer, required, default: 0)
-- createdAt (datetime, required)

-- Users Collection
-- Collection ID: users
-- Attributes:
-- email (string, required, size: 255)
-- name (string, required, size: 100)
-- avatar (string, required, size: 500)
-- isCreator (boolean, required, default: false)
-- totalEarnings (integer, required, default: 0)
-- totalSales (integer, required, default: 0)
-- createdAt (datetime, required)

-- Orders Collection
-- Collection ID: orders
-- Attributes:
-- userId (string, required, size: 50)
-- wallpaperId (string, required, size: 50)
-- amount (integer, required)
-- status (string, required, size: 20, default: "pending")
-- paddleOrderId (string, required, size: 100)
-- createdAt (datetime, required)

-- 3. Create Storage Bucket
-- Bucket ID: wallpapers_bucket
-- Permissions: Read access for all users, Write access for authenticated users
-- File size limit: 10MB
-- Allowed file extensions: jpg, jpeg, png, webp, gif

-- 4. Set up Indexes (for better query performance)
-- Wallpapers Collection:
-- - Index on 'category' (ascending)
-- - Index on 'createdAt' (descending)
-- - Index on 'creatorId' (ascending)
-- - Index on 'isPremium' (ascending)

-- Orders Collection:
-- - Index on 'userId' (ascending)
-- - Index on 'createdAt' (descending)
-- - Index on 'status' (ascending)

-- 5. Environment Variables needed:
-- NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
-- NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
-- NEXT_PUBLIC_APPWRITE_DATABASE_ID=lumatab_db
-- NEXT_PUBLIC_APPWRITE_WALLPAPERS_COLLECTION_ID=wallpapers
-- NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users
-- NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID=orders
-- NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=wallpapers_bucket
