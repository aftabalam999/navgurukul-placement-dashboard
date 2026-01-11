#!/bin/bash

# Sync Production MongoDB to Local
# Usage: ./sync-from-production.sh "mongodb+srv://user:pass@cluster.mongodb.net/dbname"

if [ -z "$1" ]; then
  echo "❌ Please provide production MongoDB URI"
  echo "Usage: ./sync-from-production.sh \"mongodb+srv://user:pass@cluster.mongodb.net/dbname\""
  exit 1
fi

PROD_URI="$1"
LOCAL_URI="mongodb://localhost:27017/placement_dashboard"

echo "🔄 Syncing production data to local..."
echo "⚠️  This will REPLACE all local data!"
read -p "Continue? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "📥 Downloading from production..."
  mongodump --uri="$PROD_URI" --archive=/tmp/prod_backup.archive
  
  echo "📤 Restoring to local..."
  mongorestore --uri="$LOCAL_URI" --archive=/tmp/prod_backup.archive --drop
  
  echo "🧹 Cleaning up..."
  rm /tmp/prod_backup.archive
  
  echo "✅ Sync complete!"
else
  echo "❌ Cancelled"
fi
