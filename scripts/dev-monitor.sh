#!/bin/bash

# Development server monitor script
# This script monitors the Next.js development server and restarts it if it becomes unresponsive

PORT=${PORT:-3000}
HEALTH_CHECK_URL="http://localhost:$PORT/api/health"
MAX_RESPONSE_TIME=10  # seconds
CHECK_INTERVAL=30     # seconds
MAX_RESTARTS=5        # maximum restarts per hour
RESTART_COUNT_FILE="/tmp/dev-server-restart-count"

# Initialize restart counter
if [ ! -f "$RESTART_COUNT_FILE" ]; then
    echo "0" > "$RESTART_COUNT_FILE"
fi

# Function to check if server is responsive
check_server() {
    local response_time
    local http_code
    
    # Get response time and HTTP status code
    response_time=$(curl -s -o /dev/null -w "%{time_total}" "$HEALTH_CHECK_URL" 2>/dev/null || echo "999")
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" 2>/dev/null || echo "000")
    
    # Convert to integer for comparison
    response_time=$(printf "%.0f" "$response_time")
    
    if [ "$http_code" != "200" ]; then
        echo "Server returned HTTP $http_code"
        return 1
    elif [ "$response_time" -gt "$MAX_RESPONSE_TIME" ]; then
        echo "Server is slow or unresponsive (response time: ${response_time}s)"
        return 1
    else
        echo "Server is responsive (response time: ${response_time}s, HTTP: $http_code)"
        return 0
    fi
}

# Function to restart the development server
restart_server() {
    local restart_count
    restart_count=$(cat "$RESTART_COUNT_FILE")
    
    if [ "$restart_count" -ge "$MAX_RESTARTS" ]; then
        echo "Maximum restarts reached. Please check the server manually."
        exit 1
    fi
    
    echo "Restarting development server..."
    
    # Kill existing Next.js processes
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "next-server" 2>/dev/null || true
    
    # Wait a moment for processes to terminate
    sleep 2
    
    # Start the development server in the background
    pnpm dev &
    local server_pid=$!
    
    # Wait for server to start
    echo "Waiting for server to start..."
    sleep 10
    
    # Check if server started successfully
    if check_server; then
        echo "Server restarted successfully"
        # Increment restart counter
        echo $((restart_count + 1)) > "$RESTART_COUNT_FILE"
    else
        echo "Failed to restart server"
        kill $server_pid 2>/dev/null || true
    fi
}

# Function to reset restart counter (called every hour)
reset_restart_counter() {
    echo "0" > "$RESTART_COUNT_FILE"
    echo "Restart counter reset"
}

# Main monitoring loop
echo "Starting development server monitor..."
echo "Health check URL: $HEALTH_CHECK_URL"
echo "Max response time: ${MAX_RESPONSE_TIME}s"
echo "Check interval: ${CHECK_INTERVAL}s"

# Start the development server if it's not already running
if ! pgrep -f "next dev" > /dev/null; then
    echo "Starting development server..."
    pnpm dev &
    sleep 10
fi

# Reset restart counter every hour
(
    while true; do
        sleep 3600  # 1 hour
        reset_restart_counter
    done
) &

# Main monitoring loop
while true; do
    if ! check_server; then
        echo "Server health check failed, attempting restart..."
        restart_server
    fi
    
    sleep "$CHECK_INTERVAL"
done 