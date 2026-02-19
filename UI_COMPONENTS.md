# VoterNet UI Components

## Overview
This document describes all the frontend UI components created for the VoterNet platform.

## Pages Created

### 1. Landing Page (index.html)
**Location:** `/public/index.html`  
**Purpose:** Main entry point for user registration, login, and navigation  
**Features:**
- User registration form
- Login form with JWT token storage
- User profile display
- Active elections preview (top banner)
- Quick navigation to:
  - Vote in Elections (`/vote.html`)
  - View Results (`/results.html`)
  - Admin Dashboard (`/admin.html` - admin/official only)
- API server status indicator
- Role-based navigation (admin links shown only for ADMIN/ELECTION_OFFICIAL)

**API Endpoints Used:**
- `GET /health` - Server status check
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `GET /users/me` - Current user profile
- `GET /api/elections/active` - Active elections preview

---

### 2. Voter Interface (vote.html)
**Location:** `/public/vote.html`  
**Purpose:** Public voting interface for registered voters  
**Features:**
- List all active elections
- View candidate profiles (name, party, bio, platform)
- Select a candidate
- Cast vote with confirmation dialog
- One-vote-per-election enforcement
- Vote receipt display with verification hash
- Anonymous voting (vote choices not stored with user ID)
- Visual feedback (selected candidate highlighting)

**API Endpoints Used:**
- `GET /api/elections/active` - List active elections
- `GET /api/elections/:id` - Election details
- `GET /api/candidates/election/:electionId` - Candidates for election
- `GET /api/voting/election/:electionId/voted` - Check if already voted
- `POST /api/voting/vote` - Cast vote
- `GET /api/voting/election/:electionId/receipt` - Get vote receipt

**User Flow:**
1. View list of active elections
2. Click "Vote Now" on an election
3. Review all candidates and their platforms
4. Select one candidate (card highlights green)
5. Click "Submit Vote" button
6. Confirm vote in dialog
7. Receive vote receipt with:
   - Vote ID
   - Election title
   - Timestamp
   - Verification hash (for later verification)

---

### 3. Admin Dashboard (admin.html)
**Location:** `/public/admin.html`  
**Purpose:** Administrative interface for election management  
**Access:** ADMIN and ELECTION_OFFICIAL roles only  
**Features:**

#### Dashboard Tab:
- Statistics cards:
  - Total Elections
  - Active Elections
  - Total Candidates
  - Total Votes
- Recent elections list with status badges

#### Elections Tab:
- Create new election (modal form)
- View all elections (cards with status)
- Election CRUD operations:
  - Update election details
  - Delete election (draft only)
- Election lifecycle management:
  - **Publish** (Draft → Published)
  - **Activate** (Published → Active, voting begins)
  - **Complete** (Active → Completed, voting ends)
  - **Cancel** (Any status → Cancelled)
- Status badges (color-coded):
  - DRAFT (gray)
  - PUBLISHED (blue)
  - ACTIVE (green)
  - COMPLETED (purple)
  - CANCELLED (red)

#### Candidates Tab:
- List all candidates by election
- Verify candidates (official approval)
- View candidate details
- Deactivate/reactivate candidates

#### Voting Tab:
- Real-time voting statistics
- Vote counts per election
- Turnout percentages
- Audit logs access

**API Endpoints Used:**
- `GET /users/me` - Current user info
- `GET /api/elections` - List all elections
- `POST /api/elections` - Create election
- `PUT /api/elections/:id` - Update election
- `DELETE /api/elections/:id` - Delete election
- `POST /api/elections/:id/publish` - Publish election
- `POST /api/elections/:id/activate` - Activate election
- `POST /api/elections/:id/complete` - Complete election
- `POST /api/elections/:id/cancel` - Cancel election
- `GET /api/elections/:id/results` - View results
- `GET /api/candidates/election/:electionId` - List candidates
- `POST /api/candidates/:id/verify` - Verify candidate

---

### 4. Election Results Page (results.html)
**Location:** `/public/results.html`  
**Purpose:** Display official election results  
**URL Pattern:** `/results.html?id={electionId}`  
**Features:**
- Election title and metadata
- Statistics grid:
  - Total votes cast
  - Total candidates
  - Voter turnout percentage
  - Winning margin
- Winner announcement (gold winner card with crown icon)
- Detailed results for all candidates:
  - Candidate name and party
  - Vote count
  - Percentage of total votes
  - Visual progress bars (color-coded)
  - Medal icons for top 3 (🥇🥈🥉)
- Sorted by vote count (descending)
- Animated progress bars
- Results only shown for COMPLETED elections

**API Endpoints Used:**
- `GET /api/elections/:id/results` - Official results

**User Flow:**
1. Access via direct link or from election list
2. View winner announcement at top
3. Review detailed vote breakdown
4. See percentages and vote counts
5. Compare candidate performance via progress bars

---

## Authentication Flow

### Token Management:
- **Storage:** localStorage
- **Keys:**
  - `accessToken` - 15-minute JWT token
  - `refreshToken` - 7-day JWT token
  - `token` - Alias for accessToken (for compatibility)

### Login Process:
1. User enters email/password on `index.html`
2. POST to `/auth/login`
3. Receive `accessToken` and `refreshToken`
4. Store tokens in localStorage
5. Redirect to profile tab
6. Show navigation links based on role

### Protected Pages:
- `vote.html` - Requires authentication
- `admin.html` - Requires ADMIN or ELECTION_OFFICIAL role
- `results.html` - Public (no auth required)

### Authorization Header:
```
Authorization: Bearer <accessToken>
```

---

## Design System

### Colors:
- **Primary:** #667eea (Purple)
- **Secondary:** #764ba2 (Dark Purple)
- **Success:** #48bb78 (Green)
- **Warning:** #ed8936 (Orange)
- **Error:** #e53e3e (Red)
- **Info:** #3182ce (Blue)
- **Gray:** #718096

### Typography:
- **Font Family:** 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
- **Headers:** 28-32px, bold
- **Body:** 14-16px
- **Small Text:** 12-14px

### Components:
- **Buttons:** Rounded (5-8px), gradient backgrounds, hover effects
- **Cards:** White background, shadow, rounded corners (10px)
- **Status Badges:** Pill-shaped (15px radius), color-coded
- **Progress Bars:** Gradient fills, animated transitions
- **Modals:** Overlay with centered card, backdrop blur

### Responsive:
- All pages are mobile-responsive
- Grid layouts adapt to screen size
- Touch-friendly button sizes (min 44px)

---

## API Base URL

### Development:
```javascript
const API_URL = 'http://localhost:3000';
```

### Production (update before deployment):
```javascript
const API_URL = 'https://app.voternet.in';
```

---

## File Structure

```
public/
├── index.html          # Landing page (register/login/profile)
├── vote.html           # Voter interface (cast votes)
├── admin.html          # Admin dashboard (manage elections)
└── results.html        # Election results display
```

---

## Usage Guide

### For Voters:
1. **Register:** Visit `index.html`, fill registration form
2. **Login:** Switch to Login tab, enter credentials
3. **Vote:** Click "Vote in Elections" → Select election → Choose candidate → Submit
4. **View Results:** Click "View Election Results" after election completes

### For Admins:
1. **Login:** Must have ADMIN or ELECTION_OFFICIAL role
2. **Create Election:** Admin Dashboard → Elections → Create Election
3. **Publish Election:** Click "Publish" button
4. **Activate Voting:** Click "Activate" when election start date arrives
5. **Complete Election:** Click "Complete" when voting period ends
6. **View Results:** Automatic after completion

---

## Error Handling

### All pages handle:
- Network errors (API offline)
- Authentication errors (expired tokens)
- Authorization errors (insufficient permissions)
- Validation errors (invalid input)
- 404 errors (resource not found)

### User feedback:
- Success messages (green)
- Error messages (red)
- Warning messages (orange)
- Info messages (blue)

---

## Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## Testing Checklist

### Manual Testing:
- [ ] Register new user
- [ ] Login with credentials
- [ ] View profile
- [ ] Navigate to voting page
- [ ] Cast a vote
- [ ] Verify cannot vote twice
- [ ] View election results
- [ ] Admin create election
- [ ] Admin publish election
- [ ] Admin activate election
- [ ] Admin complete election
- [ ] Results display correctly

### Edge Cases:
- [ ] Login with expired token
- [ ] Vote in election already voted in
- [ ] Access admin page without permissions
- [ ] View results of ongoing election (should block)
- [ ] Register with duplicate email

---

## Next Steps

### Testing Phase:
1. Write unit tests for services
2. Write integration tests for API endpoints
3. Perform E2E testing on critical flows

### Deployment:
1. Update API_URL to production URL
2. Upload files to VPS
3. Configure web server
4. Setup SSL certificate
5. Test in production

---

## Notes
- All timestamps are displayed in user's local timezone
- Vote receipts should be saved by users for verification
- Admin actions are logged for audit purposes
- Inactive users cannot vote (check `isActive` flag)
