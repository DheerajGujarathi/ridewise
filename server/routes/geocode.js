const express = require('express');
const axios = require('axios');
const router = express.Router();

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;

// Forward geocoding endpoint using Geoapify (convert address to coordinates)
router.get('/geocode', async (req, res) => {
  const { address } = req.query;
  
  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  if (!GEOAPIFY_API_KEY) {
    return res.status(500).json({ error: 'Geoapify API key not configured' });
  }

  try {
    const response = await axios.get('https://api.geoapify.com/v1/geocode/search', {
      params: { 
        text: address,
        apiKey: GEOAPIFY_API_KEY,
        format: 'json'
      }
    });

    // Transform Geoapify response to match Google Maps format
    if (response.data && response.data.results && response.data.results.length > 0) {
      const transformedResults = response.data.results.map(result => ({
        formatted_address: result.formatted || result.address_line1 || '',
        address_components: [],
        geometry: {
          location: {
            lat: result.lat,
            lng: result.lon
          }
        },
        place_id: result.place_id || '',
        types: result.result_type ? [result.result_type] : []
      }));

      res.json({
        results: transformedResults,
        status: 'OK'
      });
    } else {
      res.json({
        results: [],
        status: 'ZERO_RESULTS'
      });
    }
  } catch (error) {
    console.error('Geoapify geocoding error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to geocode address',
      details: error.response?.data || error.message
    });
  }
});

// Reverse geocoding endpoint using Geoapify (convert lat/lng to address)
router.get('/geocode/reverse', async (req, res) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  if (!GEOAPIFY_API_KEY) {
    return res.status(500).json({ error: 'Geoapify API key not configured' });
  }

  try {
    // Using Geoapify Reverse Geocoding API
    const response = await axios.get('https://api.geoapify.com/v1/geocode/reverse', {
      params: { 
        lat: lat,
        lon: lng,
        apiKey: GEOAPIFY_API_KEY,
        format: 'json'
      }
    });

    // Transform Geoapify response to match Google Maps format for compatibility
    if (response.data && response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      const transformedResponse = {
        results: [{
          formatted_address: result.formatted || result.address_line1 || `${result.lat}, ${result.lon}`,
          address_components: [],
          geometry: {
            location: {
              lat: parseFloat(lat),
              lng: parseFloat(lng)
            }
          },
          place_id: result.place_id || '',
          types: result.result_type ? [result.result_type] : []
        }],
        status: 'OK'
      };
      res.json(transformedResponse);
    } else {
      res.json({
        results: [],
        status: 'ZERO_RESULTS'
      });
    }
  } catch (error) {
    console.error('Geoapify reverse geocoding error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to get address from coordinates',
      details: error.response?.data || error.message
    });
  }
});

// Autocomplete endpoint using Geoapify
router.get('/geocode/autocomplete', async (req, res) => {
  const { input } = req.query;
  
  if (!input) {
    return res.status(400).json({ error: 'Input text is required' });
  }

  if (!GEOAPIFY_API_KEY) {
    return res.status(500).json({ error: 'Geoapify API key not configured' });
  }

  try {
    const response = await axios.get('https://api.geoapify.com/v1/geocode/autocomplete', {
      params: { 
        text: input,
        apiKey: GEOAPIFY_API_KEY,
        format: 'json',
        filter: 'countrycode:in', // Filter for India
        limit: 5
      }
    });

    // Transform Geoapify response to match Google Places Autocomplete format
    if (response.data && response.data.results) {
      const predictions = response.data.results.map(result => ({
        description: result.formatted || result.address_line1,
        place_id: result.place_id || '',
        structured_formatting: {
          main_text: result.name || result.address_line1 || '',
          secondary_text: result.address_line2 || ''
        }
      }));

      res.json({
        predictions: predictions,
        status: 'OK'
      });
    } else {
      res.json({
        predictions: [],
        status: 'ZERO_RESULTS'
      });
    }
  } catch (error) {
    console.error('Geoapify autocomplete error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to get autocomplete suggestions',
      details: error.response?.data || error.message
    });
  }
});

module.exports = router; 