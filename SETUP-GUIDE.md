# Setup Guide: MongoDB Atlas + Google OAuth

This guide will help you set up MongoDB Atlas connection and Google OAuth for the Placement Dashboard.

## 🗄️ MongoDB Atlas Setup

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up or log in to your account
3. Create a new project (e.g., "Placement Dashboard")

### Step 2: Create a Cluster
1. Click "Create" to create a new cluster
2. Choose the free tier (M0 Sandbox)
3. Select a cloud provider and region
4. Give your cluster a name (e.g., "PlacementCluster")
5. Click "Create Cluster" (this may take a few minutes)

### Step 3: Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose "Allow access from anywhere" (0.0.0.0/0) for development
4. Or add your specific IP address for better security

### Step 4: Create Database User
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and strong password
5. Grant "Read and write to any database" privileges
6. Click "Add User"

### Step 5: Get Connection String
1. Go to "Clusters" and click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `myFirstDatabase` with `placement_dashboard`

Example connection string:
```
mongodb+srv://username:password@placementcluster.abc123.mongodb.net/placement_dashboard?retryWrites=true&w=majority
```

## 🔐 Google OAuth Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)

### Step 2: Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "Placement Dashboard"
   - User support email: your email
   - Authorized domains: your domain (or localhost for development)
   - Developer contact information: your email
4. Add scopes: `../auth/userinfo.email` and `../auth/userinfo.profile`
5. Add test users if in development mode

### Step 3: Create OAuth 2.0 Client
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set the name: "Placement Dashboard Web Client"
5. Add authorized redirect URIs:
   - For development: `http://localhost:5001/api/auth/google/callback`
   - For production: `https://yourdomain.com/api/auth/google/callback`
6. Click "Create"
7. Copy the Client ID and Client Secret

## ⚙️ Environment Configuration

Update your `backend/.env` file with the actual values:

```env
PORT=5001

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@placementcluster.abc123.mongodb.net/placement_dashboard?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=navgurukul_placement_jwt_secret_2026_secure_key
JWT_EXPIRE=7d
NODE_ENV=development

# Session Configuration (for OAuth)
SESSION_SECRET=navgurukul_session_secret_2026_secure_key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5001/api/auth/google/callback

# Manager email for approvals
MANAGER_EMAIL=mubin@navgurukul.org

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## 🚀 Database Migration

Once you have your MongoDB Atlas connection string:

1. **Export existing data** (if you haven't already):
   ```bash
   cd backend
   node export-database-config.js
   ```

2. **Update environment variables** with your Atlas connection string

3. **Run the migration script**:
   ```bash
   node migrate-to-atlas.js
   ```

4. **Start your application**:
   ```bash
   npm start
   ```

## 🧪 Testing

### Demo Accounts
Your migrated database will include these demo accounts:
- **Manager**: manager@placement.edu (password: password123)
- **Coordinator**: coordinator@placement.edu (password: password123)
- **Campus PoCs**: poc.jashpur@placement.edu, poc.dharamshala@placement.edu (password: password123)
- **Students**: john.doe@student.edu, jane.smith@student.edu, etc. (password: password123)

### Google OAuth Testing
1. Try logging in with Google using any Gmail account
2. If the account is not a NavGurukul email (@navgurukul.org), it will be created as a student
3. NavGurukul emails will require manager approval
4. The manager (mubin@navgurukul.org) can approve pending users from the Manager Dashboard
## 📝 Job Description Autofill from URL/PDF
- The Coordinator Job Form supports automatic parsing of job descriptions from a URL or a PDF (including Google Drive or Google Docs links).
- For Google Drive / Google Docs: ensure the document is shared as **"Anyone with the link can view"** so the server can download and parse the file.
- Parsing uses AI (if configured) and provides a preview — review before applying the suggested values to the form.
  - Managers can view AI runtime status (Operational / Unavailable / Quota issues) in **Manager → Settings → AI Integration** and refresh the status to see live details. If the AI is configured but unavailable, the parse will fall back to basic extraction and the UI will show the reason (e.g., invalid key, quota exceeded).
## 🔍 Verification

### Database Connection
1. Check your application logs for successful MongoDB connection
2. Verify data is accessible through the application

### Google OAuth
1. Test the "Continue with Google" button on the login page
2. Verify redirect flow works properly
3. Check that users are created/logged in successfully

### Manager Approval Flow
1. Register with a @navgurukul.org email via Google OAuth
2. Check that the user appears in the Manager Dashboard's "Pending User Approvals" section
3. Test the approval process

## 🚨 Security Notes

### For Production:
1. **Database**: Restrict IP access to your server's IP only
2. **OAuth**: Use HTTPS for redirect URIs
3. **Secrets**: Use strong, unique secrets for JWT and session
4. **Environment**: Set `NODE_ENV=production`

### For Development:
- The current setup allows localhost access for testing
- Demo accounts are included for easy testing

## 📝 Troubleshooting

### Common Issues:

1. **MongoDB Connection Failed**
   - Verify your connection string is correct
   - Check network access settings in Atlas
   - Ensure database user has proper permissions

2. **Google OAuth Error**
   - Verify OAuth client ID and secret
   - Check redirect URI matches exactly
   - Ensure OAuth consent screen is configured

3. **Migration Failed**
   - Make sure `database-export.json` exists
   - Check MongoDB Atlas connection
   - Verify all dependencies are installed

### Need Help?
- Check the application logs for detailed error messages
- Verify all environment variables are set correctly
- Test each component (database, OAuth) separately

## 📄 Export Enhancements (PDF Presets & Resume Layout)

We added a polished PDF export option and personal export presets to the Coordinator export flow.

- **Resume-style PDF (2 per page)**: Select `PDF` in the Export modal and choose the "Resume-style (2 per page)" layout for a polished, resume-like format (name, contact icons, short summary, top skills, readiness badge) with 2 students per page.
- **Compact Table PDF**: For dense exports use the `Compact Table` layout which produces a one-row-per-student table style PDF.
- **Export Presets**: Coordinators can save up to **2 personal presets** (selected fields, format, layout) in the Export modal. Use the Presets dropdown to apply, save, or delete presets. Presets are stored on your account and persist across devices.

Usage:
1. Open a job and click **Export** → select fields and format
2. If using PDF, choose **Resume** or **Compact Table** layout
3. Use **Save** to store a preset (max 2). Use the dropdown to apply or delete saved presets

These features are available in the Coordinator interface and require a logged-in user with coordinator role.