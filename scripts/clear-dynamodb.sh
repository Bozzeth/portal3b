#!/bin/bash

echo "🗑️  Clearing SevisPass DynamoDB tables..."

APP_TABLE="SevisPassApplication-c4bcsfqjkndrncj4xmbl753i74-NONE"
HOLDER_TABLE="SevisPassHolder-c4bcsfqjkndrncj4xmbl753i74-NONE"

echo "📋 Clearing SevisPassApplication table..."
# Get all items from application table
aws dynamodb scan --table-name "$APP_TABLE" --query "Items[*].{id:id.S, userId:userId.S}" --output json > /tmp/app_items.json

# Delete each item
cat /tmp/app_items.json | jq -r '.[] | "\(.id) \(.userId)"' | while read id userId; do
    if [ ! -z "$id" ] && [ ! -z "$userId" ]; then
        echo "  Deleting application: $id"
        aws dynamodb delete-item --table-name "$APP_TABLE" --key "{\"id\":{\"S\":\"$id\"},\"userId\":{\"S\":\"$userId\"}}"
    fi
done

echo "👤 Clearing SevisPassHolder table..."
# Get all items from holder table
aws dynamodb scan --table-name "$HOLDER_TABLE" --query "Items[*].{id:id.S, uin:uin.S}" --output json > /tmp/holder_items.json

# Delete each item
cat /tmp/holder_items.json | jq -r '.[] | "\(.id) \(.uin)"' | while read id uin; do
    if [ ! -z "$id" ] && [ ! -z "$uin" ]; then
        echo "  Deleting holder: $uin"
        aws dynamodb delete-item --table-name "$HOLDER_TABLE" --key "{\"id\":{\"S\":\"$id\"},\"uin\":{\"S\":\"$uin\"}}"
    fi
done

echo "🔍 Verifying cleanup..."
APP_COUNT=$(aws dynamodb scan --table-name "$APP_TABLE" --select "COUNT" --query "Count")
HOLDER_COUNT=$(aws dynamodb scan --table-name "$HOLDER_TABLE" --select "COUNT" --query "Count")

echo "📊 Results:"
echo "  Applications remaining: $APP_COUNT"
echo "  Holders remaining: $HOLDER_COUNT"

if [ "$APP_COUNT" -eq 0 ] && [ "$HOLDER_COUNT" -eq 0 ]; then
    echo "✅ Database successfully cleared!"
else
    echo "⚠️  Some items may still remain"
fi

# Clean up temp files
rm -f /tmp/app_items.json /tmp/holder_items.json