// Load environment variables
require('dotenv').config();

// =========================
// Database Connection
// =========================
const connectDB = require('./config/database');

// =========================
// Imports
// =========================
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fareRates = require("./constants/fareRates");
const historyRoutes = require('./routes/history');
const { router: authRoutes } = require('./routes/auth');
const geocodeRoutes = require('./routes/geocode');
const directionsRoutes = require('./routes/directions');
const favoritesRoutes = require('./routes/favorites');

// =========================
// App Setup
// =========================
const app = express();
app.use(cors());
app.use(express.json());

// =========================
// Database Connection
// =========================
connectDB();

// =========================
// Routes
// =========================

// Health check route
app.get("/", (req, res) => {
  res.send("RideWise Backend Running");
});

// Authentication routes
console.log('Registering /api/auth with:', typeof authRoutes, authRoutes && authRoutes.stack ? 'Router' : 'Not a router');
app.use('/api/auth', authRoutes);

// Distance Matrix API route using Geoapify
app.get("/api/distance", async (req, res) => {
  const { source, destination } = req.query;
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Geoapify API key not set in environment variables." });
  }

  try {
    // First, geocode both addresses
    const [sourceGeocode, destGeocode] = await Promise.all([
      axios.get('https://api.geoapify.com/v1/geocode/search', {
        params: { text: source, apiKey: apiKey, format: 'json', limit: 1 }
      }),
      axios.get('https://api.geoapify.com/v1/geocode/search', {
        params: { text: destination, apiKey: apiKey, format: 'json', limit: 1 }
      })
    ]);

    const sourceCoords = sourceGeocode.data.results[0];
    const destCoords = destGeocode.data.results[0];

    if (!sourceCoords || !destCoords) {
      return res.status(404).json({ error: 'Could not geocode source or destination' });
    }

    // Get routing information (which includes distance and duration)
    const routingResponse = await axios.get('https://api.geoapify.com/v1/routing', {
      params: {
        waypoints: `${sourceCoords.lat},${sourceCoords.lon}|${destCoords.lat},${destCoords.lon}`,
        mode: 'drive',
        apiKey: apiKey
      }
    });

    if (routingResponse.data && routingResponse.data.features && routingResponse.data.features.length > 0) {
      const feature = routingResponse.data.features[0];
      
      // Transform to Google Distance Matrix format
      const transformedResponse = {
        rows: [{
          elements: [{
            distance: {
              text: `${(feature.properties.distance / 1000).toFixed(1)} km`,
              value: feature.properties.distance
            },
            duration: {
              text: `${Math.round(feature.properties.time / 60)} min`,
              value: feature.properties.time
            },
            status: 'OK'
          }]
        }],
        status: 'OK'
      };

      res.json(transformedResponse);
    } else {
      res.json({
        rows: [{ elements: [{ status: 'ZERO_RESULTS' }] }],
        status: 'ZERO_RESULTS'
      });
    }
  } catch (err) {
    console.error("Error fetching distance data:", err.response ? err.response.data : err.message);
    res.status(500).json({
      error: "Error fetching distance data",
      details: err.response ? err.response.data : err.message
    });
  }
});

// Fare estimation route
app.get("/api/fare", (req, res) => {
  const { distance } = req.query; // e.g., distance in km

  if (!distance) {
    return res.status(400).json({ error: "Distance is required" });
  }

  const distInKm = parseFloat(distance);
  if (isNaN(distInKm)) {
    return res.status(400).json({ error: "Invalid distance value" });
  }

  const INTERCITY_THRESHOLD = 50; // km
  const isIntercity = distInKm > INTERCITY_THRESHOLD;
  const categories = ['bike', 'auto', 'cab'];
  const services = ['obeer', 'radipoo', 'yela'];
  const grouped = {};
  for (const category of categories) {
    // Use intercity rates if distance is above threshold
    const rateSource = isIntercity ? fareRates.intercity[category] : fareRates[category];
    grouped[category] = services.map(service => {
      const rates = rateSource[service];
      const fare = rates.baseFare + rates.perKm * distInKm;
      return { service, fare: fare.toFixed(1), intercity: isIntercity };
    });
  }

  res.json({ estimates: grouped, intercity: isIntercity });
});

// History routes (now protected with authentication)
console.log('Registering /api/history with:', typeof historyRoutes, historyRoutes && historyRoutes.stack ? 'Router' : 'Not a router');
app.use('/api/history', historyRoutes);

// Favorites routes (protected with authentication)
console.log('Registering /api/favorites with:', typeof favoritesRoutes, favoritesRoutes && favoritesRoutes.stack ? 'Router' : 'Not a router');
app.use('/api/favorites', favoritesRoutes);

// Geocode routes
console.log('Registering /api/geocode with:', typeof geocodeRoutes, geocodeRoutes && geocodeRoutes.stack ? 'Router' : 'Not a router');
app.use('/api', geocodeRoutes);

console.log('Registering /api/directions with:', typeof directionsRoutes, directionsRoutes && directionsRoutes.stack ? 'Router' : 'Not a router');
app.use('/api', directionsRoutes);

// =========================
// Error Handling Middleware
// =========================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


// =========================
// Server Startup
// =========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 MongoDB integration active`);
  console.log(`🔐 Authentication system ready`);
  console.log(`📈 History tracking enabled`);
});
