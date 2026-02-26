# Deploy Jpbackend-main to Render (Production)

## Prerequisites

- Render account
- MongoDB Atlas (or production MongoDB)
- Firebase project with service account key

---

## 1. Render Service Setup

### New Web Service
1. Go to [dashboard.render.com](https://dashboard.render.com) → **New** → **Web Service**
2. Connect your repository (the one containing `Jpbackend-main`)
3. **Root Directory:** `Jpbackend-main` (if backend is inside bottle repo)
4. **Build Command:** `npm install`
5. **Start Command:** `npm start`
6. **Instance Type:** Free or paid

---

## 2. Environment Variables (Required)

Set these in Render → Your Service → **Environment**:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Set to production | `production` |
| `MONGODB_URI` | Production MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Full service account JSON (see below) | `{"type":"service_account",...}` |
| `JWT_SECRET` | Secret for JWT signing | Your secure random string |
| `ADMIN_PHONES` | Comma-separated admin phone numbers | `+919989290703,+919876543210` |

### FIREBASE_SERVICE_ACCOUNT_KEY Format

**Important:** The value must be valid JSON. For Render:
- Paste the **entire** JSON from Firebase Console → Project Settings → Service Accounts → Generate new private key
- Use **single-line** JSON (minify: remove newlines) to avoid parsing issues
- Or paste as-is if Render preserves multiline; test after deploy

---

## 3. Firebase Project Match

The app's `google-services.json` and the backend's `FIREBASE_SERVICE_ACCOUNT_KEY` must be from the **same Firebase project**. Otherwise FCM will fail.

---

## 4. After Deploy

1. Check **Logs** for: `Firebase Admin initialized`
2. Test OTP: `POST https://your-service.onrender.com/api/auth/request-otp` with `{"phone":"+91...","fcmToken":"<real-token>"}`
3. If Firebase init fails, verify `FIREBASE_SERVICE_ACCOUNT_KEY` is valid JSON

---

## 5. App Configuration

Ensure `src/config/api.js` has:
```javascript
BASE_URL: 'https://jpbackend-ctpo.onrender.com',  // Your Render URL
```

---

## 6. Render Free Tier Notes

- Service spins down after ~15 min inactivity
- First request may take 30–60 seconds (cold start)
- App timeout is 60s to handle this
