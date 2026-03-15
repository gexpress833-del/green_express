#!/bin/bash

# Simple test script to validate API endpoints
echo "Testing API Endpoints..."

echo ""
echo "1. Testing /api/ping (GET)..."
PING_RESPONSE=$(curl -s -X GET http://127.0.0.1:8000/api/ping -H "Accept: application/json")
echo "Response: $PING_RESPONSE"

echo ""
echo "2. Testing /api/login (POST) with valid credentials..."
LOGIN_RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"test@test.com","password":"password"}')
echo "Response: $LOGIN_RESPONSE"

echo ""
echo "3. Testing /api/register (POST)..."
REGISTER_RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/api/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"name":"New User","email":"newuser@test.com","password":"password123"}')
echo "Response: $REGISTER_RESPONSE"

echo ""
echo "Done!"
