# Firebase Configuration Guide

## Project Identifiers

| Item | Value |
|------|-------|
| Firebase Project ID | `dofo-ocsuite-prod` |
| GCP Organization | `digitaldofo.com` |
| Storage Bucket | `dofo-ocsuite-prod.firebasestorage.app` |
| Auth Domain | `dofo-ocsuite-prod.firebaseapp.com` |
| Admin Email | `admin@digitaldofo.com` |

## Prerequisites

### Firebase CLI
```bash
# Check if installed
firebase --version

# Install if needed
npm install -g firebase-tools

# Login
firebase login

# Check logged in account
firebase login:list

# Re-authenticate if credentials expire
firebase login --reauth
```

### Google Cloud SDK (for Storage CORS)
Located in project directory: `./google-cloud-sdk/`

```bash
# Authenticate (opens browser)
./google-cloud-sdk/bin/gcloud auth login

# Set project
./google-cloud-sdk/bin/gcloud config set project dofo-ocsuite-prod

# Check current config
./google-cloud-sdk/bin/gcloud config list
```

## Firebase Storage

### Storage Rules
Rules are defined in `storage.rules` and control who can read/write files.

**Deploy storage rules:**
```bash
firebase deploy --only storage
```

**Current rules allow:**
- Authenticated users with school membership can read/write to `/schools/{schoolId}/`
- Users can read/write to their own `/users/{userId}/` folder

### CORS Configuration
CORS (Cross-Origin Resource Sharing) must be configured to allow uploads from your domain.

**CORS config file:** `cors.json`
```json
[
  {
    "origin": ["https://digitaldofo.com", "http://localhost:5173", "https://*.matthewfinn14.workers.dev"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "X-Requested-With"]
  }
]
```

**Set CORS on bucket:**
```bash
./google-cloud-sdk/bin/gsutil cors set cors.json gs://dofo-ocsuite-prod.firebasestorage.app
```

**Check current CORS:**
```bash
./google-cloud-sdk/bin/gsutil cors get gs://dofo-ocsuite-prod.firebasestorage.app
```

## Firestore Database

### Firestore Rules
Rules are defined in `firestore.rules`.

**Deploy Firestore rules:**
```bash
firebase deploy --only firestore:rules
```

## Common Tasks

### Deploy Everything
```bash
firebase deploy
```

### Deploy Only Rules
```bash
# Storage rules only
firebase deploy --only storage

# Firestore rules only
firebase deploy --only firestore:rules

# Both rules
firebase deploy --only storage,firestore:rules
```

### Check Deployment Status
- Firebase Console: https://console.firebase.google.com/project/dofo-ocsuite-prod
- Storage: https://console.firebase.google.com/project/dofo-ocsuite-prod/storage
- Firestore: https://console.firebase.google.com/project/dofo-ocsuite-prod/firestore

## Troubleshooting

### "CORS policy" errors on upload
1. Verify CORS is set on the bucket:
   ```bash
   ./google-cloud-sdk/bin/gsutil cors get gs://dofo-ocsuite-prod.firebasestorage.app
   ```
2. If empty or wrong, set it:
   ```bash
   ./google-cloud-sdk/bin/gsutil cors set cors.json gs://dofo-ocsuite-prod.firebasestorage.app
   ```

### "Permission denied" on upload
1. Check storage rules are deployed:
   ```bash
   firebase deploy --only storage
   ```
2. Verify user has membership document in Firestore at:
   `users/{userId}/memberships/{schoolId}`

### "Bucket not found" errors
1. Make sure you're authenticated with the right account:
   ```bash
   ./google-cloud-sdk/bin/gcloud auth login admin@digitaldofo.com
   ```
2. Set the correct project:
   ```bash
   ./google-cloud-sdk/bin/gcloud config set project dofo-ocsuite-prod
   ```
3. When viewing in GCP Console, select organization `digitaldofo.com`

### Firebase CLI "credentials invalid"
```bash
firebase login --reauth
```

### gsutil "access denied"
Make sure you're logged into the correct Google account:
```bash
./google-cloud-sdk/bin/gcloud auth login admin@digitaldofo.com
./google-cloud-sdk/bin/gcloud config set project dofo-ocsuite-prod
```

### GCP Console shows no projects
In Google Cloud Console project selector, change dropdown from "No organization" to "digitaldofo.com" to see the project.

## File Structure

```
DoFO-OCSuite/
├── .firebaserc           # Firebase project aliases
├── firebase.json         # Firebase deployment config
├── firestore.rules       # Firestore security rules
├── storage.rules         # Storage security rules
├── cors.json             # CORS configuration for Storage
├── google-cloud-sdk/     # Google Cloud SDK (for gsutil)
└── app/src/services/
    └── firebase.js       # Firebase initialization & config
```

## Important Config Files

### .firebaserc
```json
{
  "projects": {
    "default": "dofo-ocsuite-prod"
  }
}
```

### firebase.json
```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

## Adding New Domains to CORS

If you add a new domain (e.g., custom domain, staging environment):

1. Edit `cors.json` and add the domain to the `origin` array
2. Run: `./google-cloud-sdk/bin/gsutil cors set cors.json gs://dofo-ocsuite-prod.firebasestorage.app`

## Security Notes

- Never commit API keys to public repos (they're in firebase.js but are client-side safe)
- Storage rules require authentication AND membership verification
- Always test rule changes in Firebase Console emulator first if making major changes
