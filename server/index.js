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
      
      // Add random variations to make pricing realistic and dynamic
      // Each provider gets a random multiplier between 0.95 and 1.05 (±5%)
      const randomMultiplier = 0.95 + (Math.random() * 0.10);
      
      // Calculate base fare with variation
      let fare = (rates.baseFare + rates.perKm * distInKm) * randomMultiplier;
      
      // Add time-based surge pricing (similar to ML model)
      const currentHour = new Date().getHours();
      const isRushHour = [7, 8, 9, 17, 18, 19].includes(currentHour);
      const isWeekend = [0, 6].includes(new Date().getDay());
      
      if (isRushHour) {
        // Rush hour: 10-20% surge
        fare *= (1.1 + Math.random() * 0.1);
      } else if (isWeekend) {
        // Weekend: slight discount 5-10%
        fare *= (0.9 + Math.random() * 0.05);
      }
      
      // Add small random noise (±₹5) to make each quote unique
      fare += (Math.random() * 10) - 5;
      
      // Ensure minimum fare
      fare = Math.max(rates.baseFare, fare);
      
      return { service, fare: fare.toFixed(1), intercity: isIntercity };
    });
  }

  res.json({ estimates: grouped, intercity: isIntercity });
});

// =========================
// ML Price Prediction Endpoints
// =========================
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Check ML service health
app.get('/api/ml/health', async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`);
    res.json(response.data);
  } catch (error) {
    res.status(503).json({ 
      error: 'ML service unavailable',
      message: 'Price prediction service is not running'
    });
  }
});

// Predict fare using ML model
app.post('/api/ml/predict', async (req, res) => {
  try {
    const { distance_km, transport_type, service_provider, hour, day_of_week, duration_mins } = req.body;
    
    if (!distance_km || !transport_type || !service_provider) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, {
      distance_km,
      transport_type,
      service_provider,
      hour,
      day_of_week,
      duration_mins
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('ML prediction error:', error.message);
    res.status(500).json({ 
      error: 'Prediction failed',
      message: error.response?.data?.error || error.message
    });
  }
});

// Get best time to book recommendation
app.post('/api/ml/best-time', async (req, res) => {
  try {
    const { distance_km, transport_type, service_provider, hours_ahead } = req.body;
    
    if (!distance_km) {
      return res.status(400).json({ error: 'Missing distance_km' });
    }
    
    const response = await axios.post(`${ML_SERVICE_URL}/best-time`, {
      distance_km,
      transport_type: transport_type || 'cab',
      service_provider: service_provider || 'obeer',
      hours_ahead: hours_ahead || 24
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Best time prediction error:', error.message);
    res.status(500).json({ 
      error: 'Best time prediction failed',
      message: error.response?.data?.error || error.message
    });
  }
});

// Batch predict for all transport types and providers
app.post('/api/ml/batch-predict', async (req, res) => {
  try {
    const { distance_km, transport_types, service_providers, hour, day_of_week } = req.body;
    
    if (!distance_km) {
      return res.status(400).json({ error: 'Missing distance_km' });
    }
    
    const response = await axios.post(`${ML_SERVICE_URL}/batch-predict`, {
      distance_km,
      transport_types: transport_types || ['bike', 'auto', 'cab'],
      service_providers: service_providers || ['obeer', 'radipoo', 'yela'],
      hour,
      day_of_week
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Batch prediction error:', error.message);
    res.status(500).json({ 
      error: 'Batch prediction failed',
      message: error.response?.data?.error || error.message
    });
  }
});

// Get model info and metadata
app.get('/api/ml/model-info', async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/model-info`);
    res.json(response.data);
  } catch (error) {
    console.error('Model info error:', error.message);
    res.status(500).json({ 
      error: 'Could not fetch model info',
      message: error.response?.data?.error || error.message
    });
  }
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
