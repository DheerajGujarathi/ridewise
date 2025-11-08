# 🔑 IMPORTANT: Add Your Geoapify API Key

## Quick Setup (5 minutes)

### 1️⃣ Get Free API Key
Visit: https://www.geoapify.com/
- Click "Get Started for Free"
- Sign up (no credit card needed!)
- Copy your API key from dashboard

### 2️⃣ Add to Server .env
File: `c:\Users\dheer\OneDrive\Desktop\RideWise\server\.env`

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5001
GEOAPIFY_API_KEY=YOUR_ACTUAL_KEY_HERE
```

### 3️⃣ Add to Client .env
File: `c:\Users\dheer\OneDrive\Desktop\RideWise\client\.env`

```env
REACT_APP_GEOAPIFY_API_KEY=YOUR_ACTUAL_KEY_HERE
```

### 4️⃣ Restart Both Servers

**Server:**
```powershell
cd c:\Users\dheer\OneDrive\Desktop\RideWise\server
npm start
```

**Client:**
```powershell
cd c:\Users\dheer\OneDrive\Desktop\RideWise\client
npm start
```

---

## ✅ You're Done!

Your app is now using Geoapify with 3,000 FREE requests per day! 🎉

See `GEOAPIFY_MIGRATION_COMPLETE.md` for full documentation.
