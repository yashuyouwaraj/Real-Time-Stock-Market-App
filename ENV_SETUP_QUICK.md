# Quick Environment Setup Reference

## 🚀 Get Started in 5 Minutes

### Step 1: Create `.env.local`

Create a file named `.env.local` in the project root with this template:

```env
MONGODB_URI=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
FINNHUB_API_KEY=
GEMINI_API_KEY=
EMAIL_FROM=
EMAIL_PASSWORD=
```

### Step 2: Generate BETTER_AUTH_SECRET

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste into `.env.local` as `BETTER_AUTH_SECRET=<value>`

### Step 3: Get MongoDB URI

**Option A: MongoDB Atlas (Cloud)**
1. Visit https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create M0 cluster
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

**Option B: Local MongoDB**
```
mongodb://localhost:27017/stock-app
```

Add to `.env.local`: `MONGODB_URI=<your-string>`

### Step 4: Get API Keys (Optional but Recommended)

- **Finnhub (Stock Data)**: https://finnhub.io → Get API Key
- **Gemini (AI Insights)**: https://aistudio.google.com/apikey
- **Nodemailer (Email)**: Gmail App Password (if using Gmail)

### Step 5: Run

```powershell
npm install
npm run dev
```

Visit `http://localhost:3000` and sign up!

---

## ✅ Verification Checklist

- [ ] `.env.local` created with all required variables
- [ ] `MONGODB_URI` is set and valid format
- [ ] `BETTER_AUTH_SECRET` is generated (32-byte hex string)
- [ ] `BETTER_AUTH_URL` is set to `http://localhost:3000`
- [ ] `npm run build` completes successfully
- [ ] `npm run dev` starts without errors
- [ ] Can sign up at `/sign-up`
- [ ] Can sign in at `/sign-in`

---

## 🔧 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `MONGODB_URI is not defined` | Missing env var | Set `MONGODB_URI` in `.env.local` |
| `Failed to connect to MongoDB` | Invalid connection string | Check format: `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `BETTER_AUTH_SECRET is not set` | Missing env var | Generate with command above and add to `.env.local` |
| `Sign in failed - Database not configured` | MongoDB not accessible | Ensure MongoDB is running and accessible |
| Invalid email or password | Wrong credentials | Make sure you signed up first at `/sign-up` |

---

## 📝 Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGODB_URI` | Database connection | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `BETTER_AUTH_SECRET` | Auth token signing key | 32-byte hex string |
| `BETTER_AUTH_URL` | Auth callback URL | `http://localhost:3000` |
| `FINNHUB_API_KEY` | Stock market data | Get from https://finnhub.io |
| `GEMINI_API_KEY` | AI insights (optional) | Get from https://aistudio.google.com/apikey |
| `EMAIL_FROM` | Email sender (optional) | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | Email password (optional) | Gmail App Password |

---

## 🚀 Deploy to Vercel

1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variables in Vercel dashboard (same as `.env.local`)
4. Update `BETTER_AUTH_URL` to your Vercel domain after first deploy
5. Deploy!

See `SETUP_GUIDE.md` for detailed instructions.
