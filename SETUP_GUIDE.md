# Real-Time Stock Market App - Setup Guide

This guide will help you get the application running locally and deployed on Vercel.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Variables Setup](#environment-variables-setup)
3. [MongoDB Configuration](#mongodb-configuration)
4. [Authentication Setup](#authentication-setup)
5. [API Keys Configuration](#api-keys-configuration)
6. [Running Locally](#running-locally)
7. [Vercel Deployment](#vercel-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js**: v18+ (v19.1.0+ recommended)
- **npm**: v8+ or yarn/pnpm
- **MongoDB**: Atlas account (free tier available) or local MongoDB instance
- **Git**: For version control

### Verify Installation

```powershell
node --version   # Should be v18+
npm --version    # Should be v8+
```

---

## Environment Variables Setup

### 1. Create `.env.local` File

In the root of your project, create a `.env.local` file with the following structure:

```env
# MongoDB Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Better Auth Configuration
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Finnhub (Stock Data API)
FINNHUB_API_KEY=your-finnhub-api-key

# Gemini AI (Optional - for AI insights)
GEMINI_API_KEY=your-gemini-api-key

# Nodemailer (Email Service - Optional)
EMAIL_FROM=noreply@yourdomain.com
EMAIL_PASSWORD=your-email-password
```

### 2. Never Commit `.env.local`

The `.env.local` file is already in `.gitignore` for security. **Never share your environment variables publicly.**

---

## MongoDB Configuration

### Option 1: Using MongoDB Atlas (Cloud - Recommended)

**Step 1: Create MongoDB Atlas Account**
1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Try Free" and sign up
3. Create a new organization and project
4. Create a free M0 cluster

**Step 2: Create Database User**
1. Go to Database Access
2. Click "Add Database User"
3. Choose "Password" authentication
4. Create username and password (save these!)
5. Click "Add User"

**Step 3: Get Connection String**
1. Go to Database → Clusters
2. Click "Connect" on your cluster
3. Select "Drivers"
4. Choose Node.js and copy the connection string
5. Replace `<password>` with your actual password
6. Replace `myFirstDatabase` with your desired database name

**Example Connection String:**
```
mongodb+srv://myuser:mypassword@cluster0.mongodb.net/stock-app
```

**Step 4: Configure Network Access**
1. Go to Security → Network Access
2. Click "Add IP Address"
3. For local development: Add your IP (click "Add Current IP")
4. For production: Add `0.0.0.0/0` (allows all IPs - use with caution)

**Step 5: Set in `.env.local`**
```env
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.mongodb.net/stock-app
```

### Option 2: Using Local MongoDB

**Step 1: Install MongoDB Community Edition**
- Windows: Download from https://www.mongodb.com/try/download/community
- Follow installation wizard

**Step 2: Start MongoDB Service**
```powershell
# MongoDB should auto-start as a Windows service
# If not, run:
mongod
```

**Step 3: Set Connection String in `.env.local`**
```env
MONGODB_URI=mongodb://localhost:27017/stock-app
```

### Verify MongoDB Connection

```powershell
# Test connection (optional)
npm run build
```

If you see: `✅ MongoDB connected successfully` - you're good!

---

## Authentication Setup

### Generate BETTER_AUTH_SECRET

This is a cryptographic key used to sign authentication tokens. Generate a secure one:

```powershell
# Run this in PowerShell to generate a random 32-byte hex string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and set it in `.env.local`:

```env
BETTER_AUTH_SECRET=abc123def456...
```

### Set BETTER_AUTH_URL

For local development:
```env
BETTER_AUTH_URL=http://localhost:3000
```

For production (Vercel):
```env
BETTER_AUTH_URL=https://your-domain.com
```

---

## API Keys Configuration

### Finnhub (Stock Market Data - Required for Features)

1. Go to https://finnhub.io
2. Click "Get free API key"
3. Sign up with email
4. Copy your API key
5. Set in `.env.local`:

```env
FINNHUB_API_KEY=c123abc456def789
```

### Gemini API (AI Insights - Optional)

1. Go to https://aistudio.google.com/apikey
2. Click "Get API Key"
3. Create new project if needed
4. Copy the API key
5. Set in `.env.local`:

```env
GEMINI_API_KEY=AIza...
```

### Nodemailer (Email Notifications - Optional)

Using Gmail:

1. Enable 2-Factor Authentication on your Google Account
2. Go to https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer" (or your device)
4. Google will generate a 16-character password
5. Set in `.env.local`:

```env
EMAIL_FROM=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

---

## Running Locally

### 1. Install Dependencies
```powershell
npm install
```

### 2. Run Development Server
```powershell
npm run dev
```

The app will be available at `http://localhost:3000`

### 3. Test Sign-Up

1. Open http://localhost:3000/sign-up
2. Fill in the form
3. Click "Create Account"
4. You should be redirected to the dashboard if successful

### 4. Test Sign-In

1. Go to http://localhost:3000/sign-in
2. Enter the email and password you just created
3. Click "Sign In"
4. You should see the dashboard

### Common Issues

**Error: "MONGODB_URI is not defined"**
- Set `MONGODB_URI` in `.env.local`
- Restart the dev server: `npm run dev`

**Error: "Failed to connect to MongoDB"**
- Check your MongoDB connection string format
- Verify MongoDB is running (MongoDB Atlas or local mongod)
- Check network access in MongoDB Atlas if using cloud

**Error: "BETTER_AUTH_SECRET is not set"**
- Generate one using the command above
- Set it in `.env.local`
- Restart the dev server

---

## Vercel Deployment

### 1. Push to GitHub

```powershell
git add .
git commit -m "Add environment setup"
git push origin main
```

### 2. Connect to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Select your project

### 3. Set Environment Variables

In Vercel dashboard:
1. Go to Settings → Environment Variables
2. Add all variables from your `.env.local`:

```
MONGODB_URI = mongodb+srv://...
BETTER_AUTH_SECRET = your-generated-secret
BETTER_AUTH_URL = https://your-domain.vercel.app
FINNHUB_API_KEY = your-api-key
GEMINI_API_KEY = your-api-key (optional)
EMAIL_FROM = your-email@gmail.com (optional)
EMAIL_PASSWORD = your-password (optional)
```

### 4. Deploy

Click "Deploy" and wait for the build to complete.

### 5. Update BETTER_AUTH_URL

After deployment, update the `BETTER_AUTH_URL` environment variable to your deployed URL:
- If using preview domain: `https://project-name.vercel.app`
- If using custom domain: `https://yourdomain.com`

---

## Troubleshooting

### Build Fails on Vercel

**Issue**: "MONGODB_URI is not defined" during build

**Solution**: 
- Ensure `MONGODB_URI` is set in Vercel Environment Variables
- Don't set it as "Preview" only - it needs to be available during build
- Go to Settings → Environment Variables → Make sure production env has the variable

**Issue**: "Build timed out"

**Solution**:
- Check that MongoDB connection is working
- If using free Atlas tier, it may need IP whitelisting
- Try building locally: `npm run build`

### Sign-In Not Working

**Issue**: "Database not configured. Please set MONGODB_URI..."

**Solution**:
- Your MongoDB isn't connected
- Check `MONGODB_URI` format: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`
- Verify password contains no special URL characters (if it does, URL-encode it)
- Test locally first: `npm run dev`

**Issue**: "Invalid email or password"

**Solution**:
- Make sure you signed up first at `/sign-up`
- Check caps lock on password
- Try signing up with a new email

**Issue**: "BETTER_AUTH_SECRET is not set"

**Solution**:
- Generate secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Set in `.env.local` for local dev
- Set in Vercel Environment Variables for production

### Database Connection Pool Issues

**Issue**: "Too many connections" error

**Solution**:
- This happens when the connection pool exhausts
- Restart the development server: Press `Ctrl+C`, then `npm run dev`
- For Vercel: Redeploy the application

---

## Project Structure

```
app/
  (auth)/           # Authentication pages (public)
    sign-in/
    sign-up/
  (root)/           # Protected pages (requires auth)
    page.tsx        # Dashboard
    stocks/[symbol] # Stock details
lib/
  better-auth/      # Authentication setup
  actions/          # Server actions for auth & data
  inngest/          # Background job functions
components/        # React components
database/          # MongoDB connection & models
```

---

## Next Steps

1. ✅ Configure MongoDB
2. ✅ Generate BETTER_AUTH_SECRET
3. ✅ Add API keys (Finnhub required, others optional)
4. ✅ Run locally: `npm run dev`
5. ✅ Test sign-up and sign-in
6. ✅ Deploy to Vercel

---

## Support

If you encounter issues:

1. **Check the console logs** - The app provides detailed error messages
2. **Verify all environment variables** are set correctly
3. **Restart the dev server** after changing `.env.local`
4. **Check MongoDB status** - Ensure it's running and accessible
5. **Review this guide** - Most issues are environment-related

For more help:
- MongoDB Atlas: https://docs.atlas.mongodb.com/
- Better Auth: https://www.better-auth.com/docs
- Vercel: https://vercel.com/docs
