# 🔑 Geoapify API Key Guide - What You Need

## 📌 Quick Answer: **ONE API KEY for EVERYTHING**

**Good news!** Geoapify gives you **ONE single API key** that works for ALL services. You don't need separate keys for different APIs! 🎉

---

## 🛠️ What Your RideWise App Uses

Your app uses **4 Geoapify services**, but they all work with the **same API key**:

### 1️⃣ **Geocoding API** ✅
**What it does:** Converts addresses to coordinates  
**Example:** "Mumbai Central Station" → `{lat: 18.9685, lng: 72.8205}`  
**Used in:**
- `server/routes/geocode.js` - Forward geocoding endpoint
- `server/routes/directions.js` - Converting addresses before routing
- `server/index.js` - Distance calculation

**API Endpoint:**
```
https://api.geoapify.com/v1/geocode/search
```

---

### 2️⃣ **Reverse Geocoding API** ✅
**What it does:** Converts GPS coordinates to addresses  
**Example:** `{lat: 18.9685, lng: 72.8205}` → "Mumbai Central Station"  
**Used in:**
- `server/routes/geocode.js` - When you click "Current Location" button
- Getting address from your phone's GPS coordinates

**API Endpoint:**
```
https://api.geoapify.com/v1/geocode/reverse
```

---

### 3️⃣ **Geocoding Autocomplete API** ✅
**What it does:** Provides location suggestions as you type  
**Example:** Type "mumb" → Shows "Mumbai, Maharashtra", "Mumbai Central", etc.  
**Used in:**
- `server/routes/geocode.js` - Autocomplete suggestions
- Source and Destination input fields on Compare page

**API Endpoint:**
```
https://api.geoapify.com/v1/geocode/autocomplete
```

---

### 4️⃣ **Routing API** ✅
**What it does:** Calculates routes between two points  
**Example:** Get route from "Delhi" to "Agra" with distance, duration, and path  
**Used in:**
- `server/routes/directions.js` - Route calculation
- `server/index.js` - Distance and duration calculation
- Drawing the blue line on the map

**API Endpoint:**
```
https://api.geoapify.com/v1/routing
```

---

### 5️⃣ **Map Tiles API** ✅
**What it does:** Provides map images for Leaflet to display  
**Example:** The actual map background you see  
**Used in:**
- `client/src/pages/Compare.jsx` - Leaflet map display

**API Endpoint:**
```
https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png
```

---

## 🎯 How to Get Your API Key

### Step 1: Sign Up
1. Go to: **https://www.geoapify.com/**
2. Click **"Get Started for Free"** (top right)
3. Sign up with your email (no credit card needed!)

### Step 2: Get Your API Key
1. After login, you'll see your **Dashboard**
2. Look for **"Your API Key"** or **"Projects"**
3. Copy the API key (looks like: `abc123def456...`)

### Step 3: Check What's Included
Your **FREE tier** includes:
- ✅ Geocoding API (search & reverse)
- ✅ Geocoding Autocomplete API
- ✅ Routing API
- ✅ Map Tiles API
- ✅ **3,000 credits/day** (each request = 1 credit)

**All these work with the SAME key!** 🎊

---

## 📝 Where to Paste Your API Key

### Option 1: Environment Files (Recommended) ✅

**Server (.env):**
```env
# File: c:\Users\dheer\OneDrive\Desktop\RideWise\server\.env
GEOAPIFY_API_KEY=YOUR_ACTUAL_KEY_HERE
```

**Client (.env):**
```env
# File: c:\Users\dheer\OneDrive\Desktop\RideWise\client\.env
REACT_APP_GEOAPIFY_API_KEY=YOUR_ACTUAL_KEY_HERE
```

**Replace `YOUR_ACTUAL_KEY_HERE` with the SAME key in both files!**

---

## ❓ Common Questions

### Q: Do I need different keys for different APIs?
**A:** No! One key works for all services (geocoding, routing, tiles, etc.)

### Q: Should I create multiple projects in Geoapify?
**A:** No need. One project with one key is enough for your entire RideWise app.

### Q: What if I see "Invalid API Key" error?
**A:** Make sure you:
- Copied the entire key (no spaces before/after)
- Pasted it in BOTH `.env` files
- Restarted both server and client after adding the key

### Q: How do I know if my key is working?
**A:** After adding the key and restarting:
1. Open RideWise app
2. Type in source/destination fields
3. If you see autocomplete suggestions → ✅ Working!
4. If map loads → ✅ Working!

### Q: What counts as one "credit"?
**A:** Each API request = 1 credit:
- 1 autocomplete suggestion = 1 credit
- 1 route calculation = 1 credit
- 1 address geocoding = 1 credit
- Map tiles = ~0.1 credit per 10 tiles

With 3,000 credits/day, you can easily do **500-1000 fare comparisons** per day! 🚀

---

## 🚨 Important Notes

### ✅ DO:
- Use the same key in both server and client
- Keep your key private (don't commit to public GitHub)
- Restart servers after adding the key

### ❌ DON'T:
- Don't share your key publicly
- Don't create multiple Geoapify accounts
- Don't use different keys for different services

---

## 🧪 Test Your Setup

After adding the key, test these features:

1. **Map Display** → Should show map tiles ✅
2. **Autocomplete** → Type in source field (3+ chars) ✅
3. **Current Location** → Click GPS button ✅
4. **Calculate Fares** → Enter source + destination ✅
5. **Route Display** → Blue line should appear on map ✅

If all work → **Your setup is perfect!** 🎉

---

## 📊 API Usage Dashboard

You can monitor your usage at:
**https://myprojects.geoapify.com/**

See:
- Daily credit usage
- Which APIs you're using most
- Remaining credits

---

## 🎁 Free Tier Limits

| Service | Included | Limit |
|---------|----------|-------|
| Geocoding | ✅ Yes | 3,000/day |
| Reverse Geocoding | ✅ Yes | 3,000/day |
| Autocomplete | ✅ Yes | 3,000/day |
| Routing | ✅ Yes | 3,000/day |
| Map Tiles | ✅ Yes | 3,000/day |
| **Total Daily Credits** | **3,000** | Shared across all APIs |

**More than enough for development and small-scale production!** 🚀

---

## 🔄 Quick Setup Summary

```
1. Sign up → geoapify.com
2. Copy your API key
3. Paste in server/.env: GEOAPIFY_API_KEY=your_key
4. Paste in client/.env: REACT_APP_GEOAPIFY_API_KEY=your_key
5. Restart server: npm start (in server folder)
6. Restart client: npm start (in client folder)
7. Test the app!
```

**That's it! One key, all services working! 🎊**

---

## 📞 Still Confused?

**Simple Answer:**
1. Get ONE API key from Geoapify
2. Paste it in BOTH .env files
3. Restart both servers
4. Everything works!

**You don't need to enable specific APIs separately. The single API key gives you access to ALL the services your RideWise app needs!** ✨
