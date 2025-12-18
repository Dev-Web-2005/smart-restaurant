#!/bin/bash
API_KEY="lT0O|c_/4<{;K|.Ann[Cuib+7l+LL#W_-Y,T>w}8Mmeu}Z[el<1*|v.p&Wg}Mp%y:0\$]4m&;5,8m5JN-,S<h#}"
URL_FILE="url.txt"

echo "================================================"
echo "🚀 Smart Restaurant Services Health Check"
echo "================================================"
echo ""


if [ ! -f "$URL_FILE" ]; then
    echo "❌ Error: $URL_FILE not found!"
    exit 1
fi

TOTAL=0
SUCCESS=0
FAILED=0


while IFS= read -r url || [ -n "$url" ]; do
    if [[ -z "$url" || "$url" == \#* ]]; then
        continue
    fi
    
    TOTAL=$((TOTAL + 1))
    SERVICE_NAME=$(echo "$url" | sed -E 's|https?://smart-restaurant-([^.]+)\..*|\1|')
    
    echo "📡 Checking: $SERVICE_NAME"
    echo "   URL: $url"
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -H "x-api-key: $API_KEY" \
        -H "Content-Type: application/json" \
        -X GET \
        "$url" \
        --max-time 10)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    BODY=$(echo "$RESPONSE" | sed '$d')
   
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
        echo "   ✅ Status: $HTTP_CODE - OK"
        echo "   Response: $BODY"
        SUCCESS=$((SUCCESS + 1))
    else
        echo "   ❌ Status: $HTTP_CODE - FAILED"
        echo "   Response: $BODY"
        FAILED=$((FAILED + 1))
    fi
    
    echo ""
    
done < "$URL_FILE"

echo "================================================"
echo "📊 Summary"
echo "================================================"
echo "Total services checked: $TOTAL"
echo "✅ Successful: $SUCCESS"
echo "❌ Failed: $FAILED"
echo ""


if [ $FAILED -gt 0 ]; then
    echo "⚠️  Some services are not healthy!"
    exit 1
else
    echo "[SUCCESSFUL]: All services are healthy!"
    exit 0
fi
