#!/bin/bash

BASE_URL="http://localhost:3000"

echo "=== Testing SAT Tutor API ==="
echo

# 1. Health check
echo "1. Health Check"
curl -s $BASE_URL/health | jq
echo -e "\n"

# 2. Generate token
echo "2. Generate Agora Token"
curl -s -X POST $BASE_URL/api/tutor/token \
  -H "Content-Type: application/json" \
  -d '{"channelName": "test-channel", "uid": 12345}' | jq
echo -e "\n"

# 3. Start session
echo "3. Start Tutoring Session"
SESSION_RESPONSE=$(curl -s -X POST $BASE_URL/api/tutor/session/start \
  -H "Content-Type: application/json" \
  -d '{"userId": "student-001", "subject": "math"}')
echo $SESSION_RESPONSE | jq

# Extract sessionId
SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.sessionId')
echo "Session ID: $SESSION_ID"
echo -e "\n"

# 4. Process message
echo "4. Process Message"
curl -s -X POST $BASE_URL/api/tutor/process \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"message\": \"What is the quadratic formula?\"}" | jq 'del(.audioData, .videoData)'
echo -e "\n"

# 5. Process another message
echo "5. Process Follow-up Message"
curl -s -X POST $BASE_URL/api/tutor/process \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"message\": \"Can you give me an example?\"}" | jq 'del(.audioData, .videoData)'
echo -e "\n"

# 6. End session
echo "6. End Session"
curl -s -X POST $BASE_URL/api/tutor/session/end \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\"}" | jq
echo -e "\n"

echo "=== Test Complete ==="
