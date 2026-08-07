#!/bin/bash
# Quick audit: Check each @app.route for authentication decorator

echo "=== ENDPOINTS WITHOUT AUTHENTICATION ==="
echo ""

# Find all @app.route lines and check if previous line has @token_required, @admin_required, or @non_viewer_required
awk '
/@app\.route/ {
    route_line = NR
    route = $0
    has_auth = 0
    
    # Check previous 5 lines for auth decorators
    for (i = 1; i <= 5; i++) {
        if (route_line - i in lines) {
            if (lines[route_line - i] ~ /@token_required/ || 
                lines[route_line - i] ~ /@admin_required/ || 
                lines[route_line - i] ~ /@non_viewer_required/ ||
                lines[route_line - i] ~ /@limiter/) {
                has_auth = 1
                break
            }
        }
    }
    
    # Exclude public routes
    if (route ~ /\/api\/auth\/login/ || route ~ /\/api\/auth\/refresh/ || route ~ /\/$/ || route ~ /\/static/) {
        has_auth = 1
    }
    
    if (has_auth == 0) {
        print "Line " NR ": " route
        print ""
    }
}
{
    lines[NR] = $0
}
' api_server.py

echo ""
echo "=== CHECKING WRITE OPERATIONS FOR VIEWER PROTECTION ==="
echo ""

# Check POST/PUT/DELETE endpoints specifically
grep -n "@app.route.*methods=\[.*\(POST\|PUT\|DELETE\)" api_server.py | while read line; do
    line_num=$(echo "$line" | cut -d: -f1)
    route=$(echo "$line" | cut -d: -f2-)
    
    # Check if @non_viewer_required or @admin_required is present within 5 lines before
    has_protection=0
    for i in $(seq 1 5); do
        check_line=$((line_num - i))
        if sed -n "${check_line}p" api_server.py | grep -q "@non_viewer_required\|@admin_required"; then
            has_protection=1
            break
        fi
    done
    
    if [ $has_protection -eq 0 ]; then
        echo "Line $line_num: $route"
        echo "  WARNING: Write operation without @non_viewer_required or @admin_required"
        echo ""
    fi
done
