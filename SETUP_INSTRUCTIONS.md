# Install required packages

Run these commands in your terminal:

```powershell
pnpm add next-auth @auth/mongodb-adapter mongodb nodemailer
pnpm add -D @types/nodemailer
```

# Setup Instructions

## 1. MongoDB Setup

### Option A: Local MongoDB
- Install MongoDB from https://www.mongodb.com/try/download/community
- Start MongoDB service
- Update `.env.local` with: `MONGODB_URI=mongodb://localhost:27017/algo-sim`

### Option B: MongoDB Atlas (Cloud - Recommended)
- Go to https://www.mongodb.com/cloud/atlas
- Create a free account and cluster
- Get your connection string
- Update `.env.local` with your connection string

## 2. Google OAuth Setup

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

## 3. Email Setup (for OTP)

### Using Gmail:
1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Update `.env.local` with your email and app password

## 4. Admin Setup

Update `.env.local` ADMIN_EMAILS with comma-separated admin emails:
```
ADMIN_EMAILS=admin@example.com,admin2@example.com
```

## 5. Generate NextAuth Secret

Run in terminal:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output to `.env.local` NEXTAUTH_SECRET

## 6. Run the Application

```powershell
pnpm dev
```

## Routes:
- `/auth/signin` - Sign in page
- `/dashboard` - Main dashboard (requires auth)
- `/feedback` - Feedback form (requires auth)
- `/admin` - Admin dashboard (requires admin role)

## Test the System:

1. Sign in with Google or Email OTP
2. Go to `/feedback` to submit feedback
3. Sign in as admin to view all feedback at `/admin`
