# VoterNet Testing Guide

## Overview
This guide provides instructions for testing the VoterNet platform, including manual testing procedures and automated test development.

---

## Prerequisites

### For Manual Testing:
- Node.js and PostgreSQL running
- API server running: `npm run dev`
- At least one user account created with ADMIN role

### For Automated Testing:
- Jest installed: `npm install --save-dev jest ts-jest @types/jest`
- Supertest installed: `npm install --save-dev supertest @types/supertest`

---

## Manual Testing Procedures

### 1. Authentication Flow

#### Test Case 1.1: User Registration
1. Navigate to `http://localhost:3000/`
2. Fill in registration form:
   - First Name: Test
   - Last Name: User
   - Email: testuser@example.com
   - Password: Password123!
3. Click "Create Account"
4. **Expected:** Success message, redirect to login tab
5. **Verify:** Email is pre-filled in login form

#### Test Case 1.2: User Login
1. Switch to Login tab
2. Enter credentials: testuser@example.com / Password123!
3. Click "Sign In"
4. **Expected:** Success message, redirect to profile tab
5. **Verify:** User details displayed correctly
6. **Verify:** Navigation links visible

#### Test Case 1.3: Invalid Login
1. Enter wrong password
2. Click "Sign In"
3. **Expected:** Error message "Invalid credentials"

#### Test Case 1.4: Session Persistence
1. Log in successfully
2. Refresh the page
3. Navigate to Profile tab
4. **Expected:** Still logged in, profile loads

---

### 2. Voting Flow

#### Test Case 2.1: View Active Elections
1. Log in as voter
2. Click "Vote in Elections"
3. **Expected:** List of active elections displayed
4. **Verify:** Each election shows:
   - Title, description
   - Election type
   - End date
   - "Vote Now" button

#### Test Case 2.2: Cast a Vote
1. Click "Vote Now" on an election
2. **Expected:** Candidates list displayed
3. Click on a candidate card
4. **Expected:** Card highlighted in green
5. Click "Submit Vote"
6. Confirm in dialog
7. **Expected:** 
   - Success message
   - Vote receipt displayed with hash
8. **Verify:** Vote ID, timestamp, election title shown

#### Test Case 2.3: Double Vote Prevention
1. After voting in an election
2. Try to access the same election again
3. **Expected:** Alert "You have already voted"
4. **Verify:** Cannot cast second vote

#### Test Case 2.4: Vote Without Selection
1. Open voting interface
2. Click "Submit Vote" without selecting candidate
3. **Expected:** Alert "Please select a candidate"

---

### 3. Admin Dashboard

#### Test Case 3.1: Admin Access
1. Log in with ADMIN or ELECTION_OFFICIAL role
2. Navigate to Profile
3. **Expected:** "Admin Dashboard" link visible
4. Click the link
5. **Expected:** Admin dashboard loads

#### Test Case 3.2: Non-Admin Access
1. Log in as regular VOTER
2. Try to access `/admin.html` directly
3. **Expected:** Error or redirect (implement if not present)

#### Test Case 3.3: Create Election
1. In Admin Dashboard, click "Elections" tab
2. Click "Create Election"
3. Fill form:
   - Title: "City Council Election 2024"
   - Description: "Annual city council election"
   - Type: LOCAL
   - Start Date: (tomorrow)
   - End Date: (next week)
   - Jurisdiction: "City of Test"
4. Click "Create"
5. **Expected:** 
   - Success message
   - New election card appears with DRAFT status

#### Test Case 3.4: Publish Election
1. Find a DRAFT election
2. Click "Publish"
3. **Expected:**
   - Status changes to PUBLISHED
   - "Activate" button appears

#### Test Case 3.5: Activate Election
1. Find a PUBLISHED election
2. Click "Activate"
3. **Expected:**
   - Status changes to ACTIVE
   - "Complete" button appears
   - Election appears in voter interface

#### Test Case 3.6: Complete Election
1. Find an ACTIVE election
2. Click "Complete"
3. **Expected:**
   - Status changes to COMPLETED
   - Results become available

#### Test Case 3.7: View Statistics
1. In Dashboard tab
2. **Expected:** Statistics cards show:
   - Total Elections count
   - Active Elections count
   - Total Candidates count
   - Total Votes count

---

### 4. Results Display

#### Test Case 4.1: View Completed Election Results
1. Navigate to `/results.html?id={completedElectionId}`
2. **Expected:**
   - Winner card displayed at top
   - All candidates listed with vote counts
   - Percentages calculated correctly
   - Progress bars animated

#### Test Case 4.2: View Active Election Results
1. Navigate to `/results.html?id={activeElectionId}`
2. **Expected:** 
   - Warning message: "Results not yet available"
   - Or 403 error from API

#### Test Case 4.3: Results Accuracy
1. Cast votes for multiple candidates
2. Complete the election
3. View results
4. **Verify:** 
   - Vote counts match votes cast
   - Percentages add up correctly
   - Winner is candidate with most votes

---

### 5. Edge Cases

#### Test Case 5.1: Expired Token
1. Log in
2. Manually delete token from localStorage
3. Try to vote or access admin
4. **Expected:** Redirect to login or error message

#### Test Case 5.2: API Offline
1. Stop the API server
2. Try to perform any action
3. **Expected:** Error message "Connection error"

#### Test Case 5.3: Invalid Election ID
1. Navigate to `/results.html?id=invalid-uuid`
2. **Expected:** Error message "Failed to load results"

#### Test Case 5.4: Concurrent Voting
1. Open two browser windows with same user
2. Try to vote in same election from both
3. **Expected:** Only first vote succeeds

---

## Automated Testing

### Unit Tests

#### Location: `src/apps/elections/domain/*.test.ts`

#### Example Test File: `election.service.test.ts`

```typescript
import { ElectionService } from './election.service';
import { Repository } from 'typeorm';
import { Election } from '../../../shared/entities/Election.js';

describe('ElectionService', () => {
  let service: ElectionService;
  let mockRepository: jest.Mocked<Repository<Election>>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    } as any;

    service = new ElectionService(mockRepository);
  });

  describe('createElection', () => {
    it('should create election with valid data', async () => {
      const data = {
        title: 'Test Election',
        description: 'Test',
        electionType: 'LOCAL',
        startDate: new Date(),
        endDate: new Date(),
        jurisdiction: 'Test City'
      };

      const user = { id: '1', role: 'ADMIN' };
      mockRepository.save.mockResolvedValue(data as any);

      const result = await service.createElection(data, user);
      expect(result).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw error for non-admin user', async () => {
      const data = { /* ... */ };
      const user = { id: '1', role: 'VOTER' };

      await expect(service.createElection(data, user))
        .rejects
        .toThrow('Only administrators');
    });
  });

  describe('publishElection', () => {
    it('should publish draft election', async () => {
      const election = {
        id: '1',
        status: 'DRAFT',
        candidateCount: 2
      };

      mockRepository.findOne.mockResolvedValue(election as any);
      mockRepository.save.mockResolvedValue({ ...election, status: 'PUBLISHED' } as any);

      const result = await service.publishElection('1', { role: 'ADMIN' });
      expect(result.status).toBe('PUBLISHED');
    });

    it('should throw error if no candidates', async () => {
      const election = {
        id: '1',
        status: 'DRAFT',
        candidateCount: 0
      };

      mockRepository.findOne.mockResolvedValue(election as any);

      await expect(service.publishElection('1', { role: 'ADMIN' }))
        .rejects
        .toThrow('at least 2 candidates');
    });
  });
});
```

#### Tests to Write:

**ElectionService (12 methods):**
- [x] createElection - valid data
- [x] createElection - non-admin user
- [x] createElection - invalid date range
- [x] publishElection - success
- [x] publishElection - no candidates
- [x] activateElection - success
- [x] activateElection - wrong status
- [x] completeElection - success
- [x] getElectionResults - accurate calculation
- [x] isElectionActiveForVoting - date checks

**CandidateService (10 methods):**
- [ ] registerCandidate - success
- [ ] registerCandidate - ineligible voter
- [ ] registerCandidate - duplicate registration
- [ ] registerCandidate - past deadline
- [ ] verifyCandidate - success
- [ ] verifyCandidate - non-admin
- [ ] updateCandidate - success
- [ ] updateCandidate - unauthorized user

**VotingService (12 methods):**
- [ ] castVote - success
- [ ] castVote - already voted
- [ ] castVote - ineligible voter
- [ ] castVote - invalid candidate
- [ ] castVote - election not active
- [ ] checkVotingEligibility - all scenarios
- [ ] getVoteReceipt - correct data
- [ ] getElectionVoteCount - accuracy
- [ ] invalidateVote - admin only

**CivicFeedService (15 methods):**
- [ ] createPost - success
- [ ] createPost - validation
- [ ] getTrendingPosts - correct sorting
- [ ] searchPosts - correct results
- [ ] createComment - success
- [ ] likePost - toggle behavior

---

### Integration Tests

#### Location: `src/apps/elections/routes/*.test.ts`

#### Example Test File: `election.routes.test.ts`

```typescript
import request from 'supertest';
import { app } from '../../../main.js';
import { getRepository } from 'typeorm';
import { User } from '../../../shared/entities/User.js';

describe('Election Routes', () => {
  let authToken: string;
  let adminToken: string;
  let electionId: string;

  beforeAll(async () => {
    // Create test user and get token
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    authToken = loginRes.body.accessToken;

    // Create admin user and get token
    const adminLoginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'password' });
    
    adminToken = adminLoginRes.body.accessToken;
  });

  describe('POST /api/elections', () => {
    it('should create election with admin token', async () => {
      const res = await request(app)
        .post('/api/elections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Election',
          description: 'Test',
          electionType: 'LOCAL',
          startDate: new Date(),
          endDate: new Date(),
          jurisdiction: 'Test'
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      electionId = res.body.data.id;
    });

    it('should fail without token', async () => {
      const res = await request(app)
        .post('/api/elections')
        .send({ /* ... */ });

      expect(res.status).toBe(401);
    });

    it('should fail with voter token', async () => {
      const res = await request(app)
        .post('/api/elections')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ /* ... */ });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/elections', () => {
    it('should list elections', async () => {
      const res = await request(app)
        .get('/api/elections')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/elections/:id/publish', () => {
    it('should publish election', async () => {
      const res = await request(app)
        .post(`/api/elections/${electionId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PUBLISHED');
    });
  });
});
```

#### Tests to Write:

**Elections API (12 endpoints):**
- [ ] POST /api/elections - create (auth, validation, permissions)
- [ ] GET /api/elections - list (auth, filtering)
- [ ] GET /api/elections/active - list active (public/private)
- [ ] GET /api/elections/:id - get details
- [ ] PUT /api/elections/:id - update (auth, permissions)
- [ ] POST /api/elections/:id/publish - publish (permissions, validation)
- [ ] POST /api/elections/:id/activate - activate
- [ ] POST /api/elections/:id/complete - complete
- [ ] GET /api/elections/:id/results - results (only completed)

**Candidates API (9 endpoints):**
- [ ] POST /api/candidates - register
- [ ] GET /api/candidates/election/:id - list
- [ ] PUT /api/candidates/:id - update
- [ ] POST /api/candidates/:id/verify - verify (admin only)

**Voting API (11 endpoints):**
- [ ] POST /api/voting/vote - cast vote
- [ ] GET /api/voting/election/:id/voted - check voted
- [ ] GET /api/voting/election/:id/receipt - get receipt
- [ ] GET /api/voting/election/:id/eligibility - check eligibility

**Civic Feed API (16 endpoints):**
- [ ] POST /api/civic/posts - create
- [ ] GET /api/civic/posts - list (pagination)
- [ ] GET /api/civic/posts/trending - trending
- [ ] DELETE /api/civic/posts/:id - delete

---

### E2E Tests

#### Test Scenario 1: Complete Voting Flow
```typescript
describe('Complete Voting Flow', () => {
  it('should allow user to register, login, and vote', async () => {
    // 1. Register
    const registerRes = await request(app)
      .post('/auth/register')
      .send({ /* user data */ });
    expect(registerRes.status).toBe(201);

    // 2. Login
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email, password });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.accessToken;

    // 3. Get active elections
    const electionsRes = await request(app)
      .get('/api/elections/active')
      .set('Authorization', `Bearer ${token}`);
    expect(electionsRes.body.data.length).toBeGreaterThan(0);
    const electionId = electionsRes.body.data[0].id;

    // 4. Get candidates
    const candidatesRes = await request(app)
      .get(`/api/candidates/election/${electionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(candidatesRes.body.data.length).toBeGreaterThan(0);
    const candidateId = candidatesRes.body.data[0].id;

    // 5. Cast vote
    const voteRes = await request(app)
      .post('/api/voting/vote')
      .set('Authorization', `Bearer ${token}`)
      .send({ electionId, candidateId });
    expect(voteRes.status).toBe(201);
    expect(voteRes.body.data).toHaveProperty('voteHash');

    // 6. Verify cannot vote again
    const doubleVoteRes = await request(app)
      .post('/api/voting/vote')
      .set('Authorization', `Bearer ${token}`)
      .send({ electionId, candidateId });
    expect(doubleVoteRes.status).toBe(400);
  });
});
```

#### Test Scenario 2: Election Lifecycle
```typescript
describe('Election Lifecycle', () => {
  it('should go through full election process', async () => {
    // Create → Publish → Activate → Complete → Results
    // Test each transition
  });
});
```

---

## Performance Testing

### Load Test Scenarios:

#### Scenario 1: Concurrent Voting
- **Goal:** Test 1000 concurrent votes
- **Tool:** Apache JMeter or Artillery
- **Expected:** < 2 second response time, 0 failures

#### Scenario 2: Results Calculation
- **Goal:** Calculate results for election with 10,000 votes
- **Expected:** < 5 seconds

#### Scenario 3: API Throughput
- **Goal:** 500 requests/second sustained
- **Expected:** No errors, consistent response times

---

## Security Testing

### Checklist:
- [ ] SQL Injection attempts (parameterized queries)
- [ ] XSS attempts (input sanitization)
- [ ] CSRF protection (if not using JWT exclusively)
- [ ] Rate limiting on login endpoint
- [ ] Password strength enforcement
- [ ] JWT expiration handling
- [ ] Authorization checks on all endpoints
- [ ] Sensitive data exposure (no passwords in responses)

---

## Test Data Setup

### Create Test Users:
```sql
-- Admin user
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES ('admin-uuid', 'admin@voternet.com', '$hashed', 'Admin', 'User', 'ADMIN', true);

-- Regular voter
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES ('voter-uuid', 'voter@voternet.com', '$hashed', 'Test', 'Voter', 'VOTER', true);
```

### Create Test Election:
```sql
INSERT INTO elections (id, title, description, election_type, status, start_date, end_date, jurisdiction, candidate_count)
VALUES ('election-uuid', 'Test Election', 'For testing', 'LOCAL', 'ACTIVE', NOW(), NOW() + INTERVAL '7 days', 'Test City', 3);
```

### Create Test Candidates:
```sql
INSERT INTO candidates (id, election_id, user_id, candidate_name, party_affiliation, is_verified, status)
VALUES 
  ('cand1-uuid', 'election-uuid', 'user1-uuid', 'Alice Johnson', 'Independent', true, 'ACTIVE'),
  ('cand2-uuid', 'election-uuid', 'user2-uuid', 'Bob Smith', 'Democratic', true, 'ACTIVE'),
  ('cand3-uuid', 'election-uuid', 'user3-uuid', 'Carol White', 'Republican', true, 'ACTIVE');
```

---

## Continuous Integration

### GitHub Actions Workflow (`.github/workflows/test.yml`):
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm install
      - run: npm run build
      - run: npm test
```

---

## Test Coverage Goals

- **Unit Tests:** > 80% code coverage
- **Integration Tests:** All API endpoints
- **E2E Tests:** Critical user flows
- **Manual Testing:** All UI components

---

## Reporting

### Test Reports:
- Jest generates `coverage/` directory
- View with: `open coverage/index.html`
- CI generates test reports as artifacts

### Bug Tracking:
- Document issues found
- Severity: Critical, High, Medium, Low
- Priority: P0, P1, P2, P3

---

## Next Steps

1. **Install Testing Dependencies**
   ```bash
   npm install --save-dev jest ts-jest @types/jest supertest @types/supertest
   ```

2. **Configure Jest**
   - Create `jest.config.js`
   - Setup test database

3. **Write Unit Tests**
   - Start with ElectionService
   - Then CandidateService, VotingService

4. **Write Integration Tests**
   - Test all API endpoints
   - Verify authentication/authorization

5. **Perform Manual Testing**
   - Follow checklist above
   - Document any issues found

6. **Fix Bugs**
   - Address critical issues first
   - Retest after fixes

7. **Deploy to Production**
   - After all tests pass
