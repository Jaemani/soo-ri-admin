#!/bin/bash

# Test script to generate welfare reports via Cloud Functions API
# Usage: ./scripts/generate-test-welfare-report.sh <userId>

API_URL="https://asia-northeast3-soo-ri.cloudfunctions.net/api/admin/welfare/generate"

if [ -z "$1" ]; then
  echo "❌ Error: userId is required"
  echo "Usage: $0 <userId>"
  exit 1
fi

USER_ID="$1"

echo "📝 Generating welfare report for user: $USER_ID"
echo "🌐 Calling API: $API_URL"

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\"}" \
  -w "\n\nHTTP Status: %{http_code}\n"

echo ""
echo "✅ Done!"
