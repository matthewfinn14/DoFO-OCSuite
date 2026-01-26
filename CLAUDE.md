# DoFO OCSuite - Project Context

## Overview
DoFO (Digital Offensive Football Operations) is a football coaching software suite for managing playbooks, practice plans, game plans, rosters, and more.

## Live Site
- **Production URL**: https://digitaldofo.com
- **Preview URLs**: https://*-dofo-ocsuite.matthewfinn14.workers.dev

## Infrastructure

### Hosting: Cloudflare Pages
- **Project**: dofo-ocsuite
- **GitHub Repo**: matthewfinn14/DoFO-OCSuite
- **Auto-deploy**: Yes - pushes to `main` branch trigger automatic deployment
- **Deploy command**: Just `git push` - Cloudflare handles the rest

### Backend: Firebase
- **Authentication**: Firebase Auth (Google Sign-In, Email/Password)
- **Database**: Firestore
- **Storage**: Firebase Storage (for logos, images)
- **Cloud Functions**: Not yet configured (needed for Stripe integration)

## Firebase Data Model

### Current Structure

```
Firestore Database
├── users/
│   └── {userId}/
│       ├── email: string
│       ├── schoolId: string (references schools collection)
│       ├── recoveredAt?: timestamp
│       └── memberships/
│           └── {schoolId}/
│               ├── role: string ('admin', 'coach', etc.)
│               └── joinedAt: timestamp
│
├── schools/
│   └── {schoolId}/
│       ├── name: string
│       ├── mascot: string
│       ├── memberList: array (emails of members)
│       ├── staff: array (staff objects with roles)
│       ├── domains: array (email domains for auto-join)
│       ├── plays: array (playbook)
│       ├── roster: array (players)
│       ├── weeks: array (practice plans by week)
│       ├── depthChart: object
│       ├── ratings: object (player ratings)
│       ├── formations: array
│       ├── settings: object (teamLogo, accentColor, theme, etc.)
│       └── billing: object (plan, trialEndsAt, subscriptionEndsAt)
│
└── invites/
    └── {inviteId}/
        ├── email: string
        ├── schoolId: string
        ├── status: 'pending' | 'accepted' | 'expired'
        └── createdAt: timestamp
```

### School Billing Structure
```javascript
{
  billing: {
    plan: "trial",  // "trial" | "premium" | "expired"
    trialEndsAt: "2026-02-01T00:00:00Z",  // 7 days from school creation
    // Future: stripeCustomerId, subscriptionId
  }
}
```

### How Data Sync Currently Works

1. **On Login**:
   - App checks `users/{userId}` for existing membership
   - If found, loads school data from `schools/{schoolId}`
   - Data is written to localStorage for offline access
   - React state is populated from loaded data

2. **On Data Change**:
   - React state updates trigger useEffect hooks
   - `useAutoSync` hook syncs to Firestore with debounce (2-3 seconds)
   - localStorage is updated as backup
   - `dataLoaded` flag prevents syncing stale data on boot

3. **Current Issues (Being Fixed)**:
   - localStorage was source of truth (should be Firebase)
   - Race conditions on initial load
   - Some syncs weren't gated by `dataLoaded`

### How Data Sync SHOULD Work (Target State)

1. **Firebase = Source of Truth**
   - All reads come from Firestore first
   - localStorage is ONLY for offline fallback
   - Never trust localStorage over Firestore

2. **Proper Load Sequence**:
   ```
   User logs in
   → Show loading screen
   → Fetch ALL data from Firestore
   → Populate React state
   → Set dataLoaded = true
   → THEN render app
   → THEN enable localStorage writes
   ```

3. **Subscription-Gated Access (Future with Stripe)**:
   ```
   User logs in
   → Check schools/{schoolId}/billing
   → If subscription active → grant access
   → If trial expired → show "Trial Expired" screen
   → If subscription lapsed > 30 days → archive/delete data
   ```

### Firebase Security Rules
Located in `firestore.rules` - controls who can read/write what data.
Key rules:
- Users can only read/write their own user document
- School data requires membership in that school
- Admin users have broader access

### Payment (Planned): Stripe
- **Status**: Not yet implemented
- **Goal**: Auto-create/delete school data based on subscription status
- **Flow**: Subscription active → access granted; Lapsed → locked out; Inactive 30-90 days → data deleted

## App Architecture
- **Single-file app**: `index.html` (~44,000 lines) contains entire React app
- **No build step**: Runs directly in browser via Babel standalone
- **State management**: React useState/useContext with localStorage persistence
- **Data sync**: Firestore with localStorage as offline fallback

## Key Files
- `index.html` - The entire app (monolithic)
- `firebase.json` - Firestore and Storage rules config
- `firestore.rules` - Database security rules
- `storage.rules` - File storage security rules

## Auth Flow (Simplified - Auto Trial)
1. User signs in via Firebase Auth (Google or Email)
2. App checks for pending invites or existing school membership
3. If has school membership:
   - Check trial status (`school.billing.trialEndsAt`)
   - If trial expired → Show "Trial Expired" screen
   - If trial active → Load data and render app
4. If no school membership → Show Create School wizard
   - Creates school with 7-day trial automatically
   - No admin approval needed

### Trial Expiration
- New schools get 7-day trial from creation date
- Trial expiration is checked on login
- Admins can extend trials via Site Admin panel (7/14/30 days)
- When trial expires, users see TrialExpiredScreen until extended

## Local Development
- Open `index.html` directly in browser (file:// protocol)
- Local bypass: Skips auth checks for localhost/file://
- Use browser DevTools console for debugging (look for DEBUG: logs)

## Admin Access
- Site admin email: admin@digitaldofo.com (bypasses all school setup)

## Common Tasks

### Deploy changes
```bash
git add index.html
git commit -m "Description of changes"
git push
# Cloudflare auto-deploys within ~30 seconds
```

### Test locally
Just open index.html in browser - local bypass is automatic

### Check deployment status
Cloudflare Dashboard → Workers & Pages → dofo-ocsuite → Deployments
