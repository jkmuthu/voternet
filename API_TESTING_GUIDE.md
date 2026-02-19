# VoterNet API Testing Guide

## ✅ #1: API Testing Examples

This guide shows you how to test all VoterNet API endpoints using different tools.

---

## 📋 Available Endpoints

### Base URL
```
http://localhost:3000
```

---

## 1. Health Check

**Endpoint:** `GET /health`

### PowerShell
```powershell
Invoke-WebRequest -Uri http://localhost:3000/health -UseBasicParsing
```

### cURL
```bash
curl http://localhost:3000/health
```

### Expected Response
```json
{
  "status": "ok",
  "timestamp": "2026-02-18T12:34:56.789Z"
}
```

---

## 2. User Registration

**Endpoint:** `POST /auth/register`

### PowerShell
```powershell
$body = @{
    email = "newuser@example.com"
    firstName = "John"
    lastName = "Doe"
    password = "SecurePass123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3000/auth/register `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -UseBasicParsing
```

### cURL
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "SecurePass123!"
  }'
```

### JavaScript (Browser Console)
```javascript
fetch('http://localhost:3000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newuser@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'SecurePass123!'
  })
}).then(res => res.json()).then(console.log);
```

### Expected Response (201 Created)
```json
{
  "user": {
    "id": "uuid-here",
    "email": "newuser@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "voter",
    "isActive": true,
    "emailVerified": false,
    "createdAt": "2026-02-18T12:34:56.789Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Validation Rules
- Email: Must be valid format
- First Name: Required, max 100 chars
- Last Name: Required, max 100 chars
- Password: Min 8 characters

---

## 3. User Login

**Endpoint:** `POST /auth/login`

### PowerShell
```powershell
$body = @{
    email = "newuser@example.com"
    password = "SecurePass123!"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri http://localhost:3000/auth/login `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -UseBasicParsing

$tokens = $response.Content | ConvertFrom-Json
$accessToken = $tokens.accessToken
$refreshToken = $tokens.refreshToken

Write-Host "Access Token: $accessToken"
Write-Host "Refresh Token: $refreshToken"
```

### cURL
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!"
  }'
```

### Expected Response (200 OK)
```json
{
  "user": {
    "id": "uuid-here",
    "email": "newuser@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "voter"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 4. Get User Profile

**Endpoint:** `GET /users/me`  
**Authentication Required:** Yes (Bearer Token)

### PowerShell
```powershell
# Use the access token from login
$headers = @{
    Authorization = "Bearer $accessToken"
}

Invoke-WebRequest -Uri http://localhost:3000/users/me `
    -Headers $headers `
    -UseBasicParsing
```

### cURL
```bash
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### JavaScript (Browser Console)
```javascript
const accessToken = 'YOUR_ACCESS_TOKEN_HERE';

fetch('http://localhost:3000/users/me', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
}).then(res => res.json()).then(console.log);
```

### Expected Response (200 OK)
```json
{
  "id": "uuid-here",
  "email": "newuser@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "voter",
  "isActive": true,
  "emailVerified": false,
  "createdAt": "2026-02-18T12:34:56.789Z",
  "updatedAt": "2026-02-18T12:34:56.789Z",
  "lastLoginAt": "2026-02-18T12:35:00.123Z"
}
```

---

## 5. Update User Profile

**Endpoint:** `PUT /users/me`  
**Authentication Required:** Yes (Bearer Token)

### PowerShell
```powershell
$body = @{
    firstName = "Jane"
    lastName = "Smith"
} | ConvertTo-Json

$headers = @{
    Authorization = "Bearer $accessToken"
}

Invoke-WebRequest -Uri http://localhost:3000/users/me `
    -Method PUT `
    -Body $body `
    -Headers $headers `
    -ContentType "application/json" `
    -UseBasicParsing
```

### cURL
```bash
curl -X PUT http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

### Expected Response (200 OK)
```json
{
  "id": "uuid-here",
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "voter",
  "isActive": true,
  "emailVerified": false,
  "createdAt": "2026-02-18T12:34:56.789Z",
  "updatedAt": "2026-02-18T12:40:00.000Z",
  "lastLoginAt": "2026-02-18T12:35:00.123Z"
}
```

---

## 6. Refresh Access Token

**Endpoint:** `POST /auth/refresh`

### PowerShell
```powershell
$body = @{
    refreshToken = $refreshToken
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3000/auth/refresh `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -UseBasicParsing
```

### cURL
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### Expected Response (200 OK)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 7. Logout

**Endpoint:** `POST /auth/logout`  
**Authentication Required:** Yes (Bearer Token)

### PowerShell
```powershell
$headers = @{
    Authorization = "Bearer $accessToken"
}

Invoke-WebRequest -Uri http://localhost:3000/auth/logout `
    -Method POST `
    -Headers $headers `
    -UseBasicParsing
```

### cURL
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Expected Response (200 OK)
```json
{
  "message": "Logged out successfully"
}
```

---

## 🧪 Complete Testing Workflow (PowerShell)

Here's a complete script to test the entire authentication flow:

```powershell
# 1. Check API Status
Write-Host "`n=== 1. Health Check ===" -ForegroundColor Green
$health = Invoke-WebRequest -Uri http://localhost:3000/health -UseBasicParsing
$health.Content | ConvertFrom-Json | ConvertTo-Json

# 2. Register New User
Write-Host "`n=== 2. Register New User ===" -ForegroundColor Green
$registerBody = @{
    email = "testuser$(Get-Random)@example.com"
    firstName = "Test"
    lastName = "User"
    password = "TestPass123!"
} | ConvertTo-Json

try {
    $regResponse = Invoke-WebRequest -Uri http://localhost:3000/auth/register `
        -Method POST `
        -Body $registerBody `
        -ContentType "application/json" `
        -UseBasicParsing
    $regData = $regResponse.Content | ConvertFrom-Json
    Write-Host "✓ Registration successful!" -ForegroundColor Cyan
    $email = ($registerBody | ConvertFrom-Json).email
    $password = ($registerBody | ConvertFrom-Json).password
} catch {
    Write-Host "✗ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 3. Login
Write-Host "`n=== 3. Login ===" -ForegroundColor Green
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri http://localhost:3000/auth/login `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json" `
    -UseBasicParsing

$loginData = $loginResponse.Content | ConvertFrom-Json
$accessToken = $loginData.accessToken
$refreshToken = $loginData.refreshToken
Write-Host "✓ Login successful!" -ForegroundColor Cyan
Write-Host "Access Token: $($accessToken.Substring(0,50))..." -ForegroundColor Yellow

# 4. Get Profile
Write-Host "`n=== 4. Get User Profile ===" -ForegroundColor Green
$headers = @{
    Authorization = "Bearer $accessToken"
}

$profileResponse = Invoke-WebRequest -Uri http://localhost:3000/users/me `
    -Headers $headers `
    -UseBasicParsing

$profileData = $profileResponse.Content | ConvertFrom-Json
Write-Host "✓ Profile retrieved!" -ForegroundColor Cyan
$profileData | ConvertTo-Json

# 5. Update Profile
Write-Host "`n=== 5. Update Profile ===" -ForegroundColor Green
$updateBody = @{
    firstName = "Updated"
    lastName = "Name"
} | ConvertTo-Json

$updateResponse = Invoke-WebRequest -Uri http://localhost:3000/users/me `
    -Method PUT `
    -Body $updateBody `
    -Headers $headers `
    -ContentType "application/json" `
    -UseBasicParsing

Write-Host "✓ Profile updated!" -ForegroundColor Cyan
$updateResponse.Content | ConvertFrom-Json | ConvertTo-Json

# 6. Refresh Token
Write-Host "`n=== 6. Refresh Access Token ===" -ForegroundColor Green
$refreshBody = @{
    refreshToken = $refreshToken
} | ConvertTo-Json

$refreshResponse = Invoke-WebRequest -Uri http://localhost:3000/auth/refresh `
    -Method POST `
    -Body $refreshBody `
    -ContentType "application/json" `
    -UseBasicParsing

$newTokens = $refreshResponse.Content | ConvertFrom-Json
Write-Host "✓ Token refreshed!" -ForegroundColor Cyan
Write-Host "New Access Token: $($newTokens.accessToken.Substring(0,50))..." -ForegroundColor Yellow

# 7. Logout
Write-Host "`n=== 7. Logout ===" -ForegroundColor Green
$headers.Authorization = "Bearer $($newTokens.accessToken)"

$logoutResponse = Invoke-WebRequest -Uri http://localhost:3000/auth/logout `
    -Method POST `
    -Headers $headers `
    -UseBasicParsing

Write-Host "✓ Logout successful!" -ForegroundColor Cyan
$logoutResponse.Content | ConvertFrom-Json | ConvertTo-Json

Write-Host "`n=== All Tests Completed Successfully! ===" -ForegroundColor Green
```

---

## 🔍 Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid credentials"
}
```

### 404 Not Found
```json
{
  "error": "Not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests from this IP, please try again later"
}
```

---

## 📊 Rate Limiting

- **Development:** 500 requests per 15 minutes per IP
- **Production:** 100 requests per 15 minutes per IP
- Health check endpoint (`/health`) is excluded from rate limiting

---

## 🔐 Authentication

### JWT Tokens

**Access Token:**
- Lifespan: 15 minutes
- Used for: Authenticating API requests
- Header: `Authorization: Bearer <access_token>`

**Refresh Token:**
- Lifespan: 7 days
- Used for: Getting new access tokens
- Stored in secure HTTP-only cookie (production)

### Using Tokens

Include the access token in the Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🎯 Postman Collection

You can import these endpoints into Postman:

1. Create a new Collection named "VoterNet API"
2. Add environment variables:
   - `base_url`: `http://localhost:3000`
   - `access_token`: (will be set after login)
   - `refresh_token`: (will be set after login)

3. Add requests with proper pre-request and test scripts to auto-save tokens

---

## ✅ Testing Checklist

- [ ] Health check returns 200
- [ ] Can register new user with valid data
- [ ] Registration fails with invalid email
- [ ] Registration fails with short password
- [ ] Registration fails with duplicate email
- [ ] Can login with correct credentials
- [ ] Login fails with wrong password
- [ ] Can get user profile with valid token
- [ ] Profile request fails without token
- [ ] Profile request fails with expired token
- [ ] Can update user profile
- [ ] Can refresh access token
- [ ] Can logout successfully
- [ ] Logout invalidates the session

---

## 🚀 Next Steps

Once you've tested all endpoints, you can:

1. **Test via Web Interface:** Use the landing page at http://localhost:3000
2. **Deploy to Ubuntu VPS:** Follow SETUP_GUIDE.md
3. **Add Phase 2 Features:** Elections, voting, civic feed

---

**API Status:** ✅ All Phase 1 endpoints operational
**Testing Tools:** PowerShell, cURL, Postman, Web Browser
**Documentation:** Complete and up-to-date
