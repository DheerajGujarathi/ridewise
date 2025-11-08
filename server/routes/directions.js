const express = require('express');
const axios = require('axios');
const router = express.Router();

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;

router.get('/directions', async (req, res) => {
  const { origin, destination } = req.query;
  
  if (!origin || !destination) {
    return res.status(400).json({ error: 'Origin and destination are required' });
  }

  if (!GEOAPIFY_API_KEY) {
    return res.status(500).json({ error: 'Geoapify API key not configured' });
  }

  try {
    // First, geocode the origin and destination to get coordinates
    const [originGeocode, destGeocode] = await Promise.all([
      axios.get('https://api.geoapify.com/v1/geocode/search', {
        params: { text: origin, apiKey: GEOAPIFY_API_KEY, format: 'json', limit: 1 }
      }),
      axios.get('https://api.geoapify.com/v1/geocode/search', {
        params: { text: destination, apiKey: GEOAPIFY_API_KEY, format: 'json', limit: 1 }
      })
    ]);

    const originCoords = originGeocode.data.results[0];
    const destCoords = destGeocode.data.results[0];

    if (!originCoords || !destCoords) {
      return res.status(404).json({ error: 'Could not geocode origin or destination' });
    }

    // Get routing information from Geoapify
    const routingResponse = await axios.get('https://api.geoapify.com/v1/routing', {
      params: {
        waypoints: `${originCoords.lat},${originCoords.lon}|${destCoords.lat},${destCoords.lon}`,
        mode: 'drive',
        apiKey: GEOAPIFY_API_KEY
      }
    });

    // Transform Geoapify routing response to match Google Directions format
    if (routingResponse.data && routingResponse.data.features && routingResponse.data.features.length > 0) {
      const feature = routingResponse.data.features[0];
      const geometry = feature.geometry.coordinates;
      
      // Convert coordinates to lat/lng format
      const path = geometry.map(coord => ({
        lat: coord[1],
        lng: coord[0]
      }));

      // Encode polyline (simple base64 encoding for compatibility)
      const encodedPolyline = encodePolyline(path);

      const transformedResponse = {
        routes: [{
          overview_polyline: {
            points: encodedPolyline
          },
          legs: [{
            distance: {
              text: `${(feature.properties.distance / 1000).toFixed(1)} km`,
              value: feature.properties.distance
            },
            duration: {
              text: `${Math.round(feature.properties.time / 60)} min`,
              value: feature.properties.time
            },
            start_address: origin,
            end_address: destination,
            start_location: {
              lat: originCoords.lat,
              lng: originCoords.lon
            },
            end_location: {
              lat: destCoords.lat,
              lng: destCoords.lon
            }
          }],
          summary: feature.properties.mode || 'Driving'
        }],
        status: 'OK',
        geoapify_data: {
          coordinates: path // Include raw coordinates for direct use
        }
      };

      res.json(transformedResponse);
    } else {
      res.json({
        routes: [],
        status: 'ZERO_RESULTS'
      });
    }
  } catch (error) {
    console.error('Geoapify routing error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to get directions',
      details: error.response?.data || error.message
    });
  }
});

// Simple polyline encoding function (returns JSON string for now)
function encodePolyline(coordinates) {
  // For simplicity, return JSON string of coordinates
  // Frontend will parse this directly
  return JSON.stringify(coordinates);
}

module.exports = router; 