# VoterNet - Test Credentials

## 🔑 Test User Accounts

### Admin Account
**Use this for:** Admin Dashboard, Election Management

- **Email:** `admin@voternet.com`
- **Password:** `Admin123!`
- **Role:** ADMIN
- **Permissions:**
  - Create, edit, delete elections
  - Publish, activate, complete elections
  - Verify candidates
  - View all voting statistics
  - Invalidate votes (fraud detection)
  - Full system access

---

### Voter Account
**Use this for:** Voting, Viewing Results

- **Email:** `voter@voternet.com`
- **Password:** `Voter123!`
- **Role:** VOTER
- **Permissions:**
  - Register as candidate
  - Cast votes in active elections
  - View election results
  - Create campaign posts
  - Comment and engage with civic feed

---

## 🚀 Quick Start

### 1. Start the Application
```bash
npm run dev
```

### 2. Access the Application
- **Landing Page:** http://localhost:3000/
- **Voting:** http://localhost:3000/vote.html
- **Admin Dashboard:** http://localhost:3000/admin.html
- **Results:** http://localhost:3000/results.html

### 3. Login as Admin
1. Go to http://localhost:3000/
2. Click "Login" tab
3. Enter:
   - Email: `admin@voternet.com`
   - Password: `Admin123!`
4. Click "Sign In"
5. Go to Profile tab and click "Admin Dashboard"

### 4. Login as Voter
1. Go to http://localhost:3000/
2. Click "Login" tab
3. Enter:
   - Email: `voter@voternet.com`
   - Password: `Voter123!`
4. Click "Sign In"
5. Go to Profile tab and click "Vote in Elections"

---

## 📝 Testing Workflows

### Admin Workflow: Create an Election
1. Login as Admin
2. Click "Admin Dashboard" from Profile
3. Click "Elections" tab
4. Click "Create Election" button
5. Fill in the form:
   - **Title:** "City Council Election 2026"
   - **Description:** "Annual city council election"
   - **Type:** LOCAL
   - **Start Date:** (current date/time)
   - **End Date:** (7 days from now)
   - **Jurisdiction:** "Test City"
6. Click "Create"
7. Click "Publish" on the created election
8. Click "Activate" to start voting

### Voter Workflow: Cast a Vote
1. Login as Voter
2. Click "Vote in Elections" from Profile
3. Select an active election
4. Review candidates
5. Click on a candidate to select
6. Click "Submit Vote"
7. Confirm your selection
8. Save your vote receipt

### Admin Workflow: View Results
1. Login as Admin
2. Navigate to Admin Dashboard
3. Find an active election
4. Click "Complete" to end voting
5. Click to view results
6. Or visit: http://localhost:3000/results.html?id={electionId}

---

## 🔒 Security Notes

- These are **test credentials only** - do not use in production
- Passwords meet security requirements:
  - Minimum 8 characters
  - Contains uppercase letter
  - Contains lowercase letter
  - Contains number
  - Contains special character
- In production, create new admin accounts with strong unique passwords
- Enable 2FA if implementing for production

---

## 🗑️ Reset Test Users

To recreate test users:

```bash
# Run seed script again (it checks for existing users)
npm run db:seed
```

To delete and recreate:

```bash
# Connect to PostgreSQL
psql -U postgres -d voternet

# Delete test users
DELETE FROM users WHERE email IN ('admin@voternet.com', 'voter@voternet.com');

# Exit and run seed again
\q
npm run db:seed
```

---

## 📊 API Testing with These Credentials

### Login Endpoint
```bash
# PowerShell
$body = @{
    email = "admin@voternet.com"
    password = "Admin123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST -Body $body -ContentType "application/json"

# Extract token
$token = $response.accessToken
```

### Use Token in Requests
```bash
# PowerShell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/users/me" -Headers $headers
```

---

## 👥 Create Additional Test Users

You can register more users through the UI:

1. Go to http://localhost:3000/
2. Fill in the registration form
3. Click "Create Account"
4. Login with the new credentials

Or use the API:

```bash
# PowerShell
$newUser = @{
    email = "testvoter@example.com"
    password = "TestPass123!"
    firstName = "Test"
    lastName = "Voter"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/auth/register" -Method POST -Body $newUser -ContentType "application/json"
```

---

## ✅ Verification

Run this to verify users were created:

```bash
# Connect to database
psql -U postgres -d voternet

# Check users
SELECT id, email, "firstName", "lastName", role, "isActive", "emailVerified" FROM users WHERE email IN ('admin@voternet.com', 'voter@voternet.com');
```

Expected output:
```
                  id                  |        email        | firstName | lastName |     role           | isActive | emailVerified
--------------------------------------+---------------------+-----------+----------+-------------------+----------+---------------
 <uuid>                               | admin@voternet.com  | Admin     | User     | admin             | t        | t
 <uuid>                               | voter@voternet.com  | John      | Voter    | voter             | t        | t
```

---

**Last Updated:** February 18, 2026  
**Script Location:** `src/database/seed-test-users.ts`  
**NPM Command:** `npm run db:seed`
