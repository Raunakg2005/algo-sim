# Algo-Sim Authentication & Feedback System

✅ **Complete setup with:**
- Google Sign-In
- Email OTP Authentication  
- MongoDB Integration
- Feedback System (like IITB VLab)
- Admin Dashboard

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Setup Environment Variables

Copy `.env.example` to `.env.local`:
```bash
copy .env.example .env.local
```

Then edit `.env.local` with your credentials.

### 3. Get Google OAuth Credentials

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project → Enable "Google+ API"
3. Credentials → Create OAuth 2.0 Client ID
4. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID & Secret to `.env.local`

### 4. Setup MongoDB

**Option A - MongoDB Atlas (Recommended):**
1. Create free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster → Get connection string
3. Add to `.env.local` as `MONGODB_URI`

**Option B - Local MongoDB:**
1. Install MongoDB locally
2. Use: `MONGODB_URI=mongodb://localhost:27017/algo-sim`

### 5. Generate Secret Key

Run in terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Copy output to `.env.local` as `NEXTAUTH_SECRET`

### 6. Configure Admin Access

Edit `.env.local`:
```env
ADMIN_EMAILS=your-email@gmail.com,admin2@gmail.com
```

### 7. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📱 Features

### User Features:
- ✅ Sign in with Google
- ✅ Sign in with Email (OTP)
- ✅ Submit detailed feedback
- ✅ Multi-experiment selection
- ✅ Institute name tracking

### Admin Features:
- ✅ View all feedbacks
- ✅ User analytics
- ✅ Institute statistics
- ✅ Rating distributions
- ✅ Export capabilities

## 🔗 Routes

| Route | Description | Access |
|-------|-------------|---------|
| `/auth/signin` | Sign in page | Public |
| `/dashboard` | Main dashboard | Authenticated |
| `/feedback` | Submit feedback | Authenticated |
| `/admin` | Admin dashboard | Admin only |

## 📊 Feedback System Features

1. **Experiment Selection**
   - Discipline dropdown (8 categories)
   - Lab dropdown (contextual)
   - Experiment dropdown (contextual)
   - Add/Remove multiple experiments

2. **Rating Questions**
   - Lab environment simulation quality
   - Manual helpfulness
   - Result interpretability
   - Overall experience
   - 5-point scale (Excellent → Poor)

3. **Yes/No Questions**
   - Innovation potential
   - Manual usage

4. **Institute Tracking**
   - Required institute name field
   - Analytics by institute

## 🔒 Security

- NextAuth.js for authentication
- MongoDB for secure data storage
- Environment variables for secrets
- Admin role-based access control

## 📝 Database Collections

1. **users** - User accounts
2. **accounts** - OAuth accounts
3. **sessions** - Active sessions
4. **verification_tokens** - Email OTP tokens
5. **feedbacks** - Feedback submissions

## 🎨 Technologies Used

- Next.js 15
- NextAuth.js
- MongoDB
- Tailwind CSS
- Shadcn/ui Components
- Framer Motion

## 🐛 Troubleshooting

**MongoDB Connection Error:**
- Check MongoDB is running (local)
- Verify connection string (Atlas)
- Check network access in Atlas

**OAuth Error:**
- Verify redirect URIs match exactly
- Check credentials are correct
- Enable Google+ API

**Email OTP Not Working:**
- Use Gmail App Password, not account password
- Enable 2FA on Gmail account
- Check SMTP settings

## 📞 Support

For issues, check:
1. `.env.local` configuration
2. MongoDB connection
3. Google OAuth setup
4. Console errors in browser DevTools

---

Made with ❤️ for Algo-Sim
