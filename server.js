const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Import our modules
const { initializeDatabase, dbHelpers } = require('./database');
const { 
  authenticateToken, 
  requireServiceProvider, 
  requireClient,
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser
} = require('./auth');
const { processServiceRequest, detectServiceCategory } = require('./serviceMatching');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// Initialize database on startup
initializeDatabase().then(() => {
  console.log('✅ Database initialized successfully');
}).catch(err => {
  console.error('❌ Database initialization failed:', err);
});

// =================== AUTHENTICATION ROUTES ===================

// Register new user
app.post('/api/auth/register', registerUser);

// Login user
app.post('/api/auth/login', loginUser);

// Get current user profile
app.get('/api/auth/profile', authenticateToken, getCurrentUser);

// Logout user
app.post('/api/auth/logout', authenticateToken, logoutUser);

// =================== SERVICE PROVIDER ROUTES ===================

// Register business (service providers only)
app.post('/api/business/register', authenticateToken, requireServiceProvider, async (req, res) => {
  try {
    const {
      businessName,
      businessType,
      description,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      website,
      licenseNumber,
      yearsInBusiness
    } = req.body;

    // Check if business already exists for this user
    const existingBusiness = await dbHelpers.getBusinessByUserId(req.user.id);
    if (existingBusiness) {
      return res.status(409).json({ error: 'Business already registered for this user' });
    }

    // Create business
    const business = await dbHelpers.createBusiness({
      userId: req.user.id,
      businessName,
      businessType,
      description,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      website,
      licenseNumber,
      yearsInBusiness
    });

    res.status(201).json({
      message: 'Business registered successfully',
      business
    });

  } catch (error) {
    console.error('Business registration error:', error);
    res.status(500).json({ error: 'Business registration failed' });
  }
});

// Get business profile
app.get('/api/business/profile', authenticateToken, requireServiceProvider, async (req, res) => {
  try {
    const business = await dbHelpers.getBusinessByUserId(req.user.id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json(business);
  } catch (error) {
    console.error('Get business profile error:', error);
    res.status(500).json({ error: 'Failed to get business profile' });
  }
});

// Add service to business
app.post('/api/business/services', authenticateToken, requireServiceProvider, async (req, res) => {
  try {
    const {
      categoryId,
      serviceName,
      description,
      basePrice,
      priceUnit,
      estimatedDuration,
      durationUnit,
      isEmergency
    } = req.body;

    // Get business ID for the user
    const business = await dbHelpers.getBusinessByUserId(req.user.id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found. Please register your business first.' });
    }

    // Create service
    const service = await dbHelpers.createService({
      businessId: business.id,
      categoryId,
      serviceName,
      description,
      basePrice,
      priceUnit,
      estimatedDuration,
      durationUnit,
      isEmergency
    });

    res.status(201).json({
      message: 'Service added successfully',
      service
    });

  } catch (error) {
    console.error('Add service error:', error);
    res.status(500).json({ error: 'Failed to add service' });
  }
});

// Get business services
app.get('/api/business/services', authenticateToken, requireServiceProvider, async (req, res) => {
  try {
    const business = await dbHelpers.getBusinessByUserId(req.user.id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const services = await dbHelpers.getServicesByBusinessId(business.id);
    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Failed to get services' });
  }
});

// =================== CLIENT ROUTES ===================

// Anonymous image analysis (no authentication required)
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    const {
      title = 'Anonymous Service Request',
      description = 'Analyze this image and find matching service providers',
      location = 'Not specified',
      urgency = 'normal'
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Image is required for service analysis' });
    }

    console.log('📸 Processing anonymous image analysis with enhanced MVP system:', req.file.filename);

    // Process service request with enhanced AI analysis
    const result = await processServiceRequest({
      clientId: null, // Anonymous request
      title,
      description,
      imageUrl: req.file.path,
      location,
      urgency,
      budgetMin: null,
      budgetMax: null
    }, req.file.path);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'Enhanced image analysis completed successfully',
      request: { id: 'anonymous', anonymous: true },
      
      // Frontend compatibility
      analysis: {
        analysis: result.analysis.fullAnalysis,
        confidence: result.analysisSuccess ? 0.8 : 0.3,
        detectedCategory: detectServiceCategory(result.analysis.fullAnalysis, result.detectedItem)
      },
      
      // Enhanced MVP response data
      detectedItem: result.detectedItem,
      detectedProblem: result.detectedProblem,
      detectedBrand: result.detectedBrand,
      severity: result.severity,
      difficulty: result.difficulty,
      estimatedTime: result.estimatedTime,
      analysisSuccess: result.analysisSuccess,
      fallbackUsed: result.fallbackUsed,
      estimates: result.estimates,
      
      // Service provider matches
      matchingProviders: result.providers.map(provider => ({
        ...provider,
        // Include dynamic pricing if available
        estimated_cost_range: result.estimates ? {
          min: result.estimates.costMin,
          max: result.estimates.costMax,
          currency: result.estimates.currency
        } : null,
        estimated_time_range: result.estimates ? {
          min: result.estimates.timeMin,
          max: result.estimates.timeMax,
          unit: result.estimates.timeUnit
        } : null
      })),
      
      totalMatches: result.providers.length,
      
      // Additional MVP data
      serviceCategory: detectServiceCategory(result.analysis.fullAnalysis, result.detectedItem),
      repairDifficulty: result.estimates?.difficulty || 'Medium',
      
      // Summary for user
      summary: {
        item: result.detectedItem || 'Unknown Device',
        problem: result.detectedProblem || 'General Issue',
        brand: result.detectedBrand || 'Unknown Brand',
        severity: result.severity || 'Moderate',
        estimatedCost: result.estimates ? `PHP ${result.estimates.costMin} - ${result.estimates.costMax}` : 'Quote needed',
        estimatedTime: result.estimates ? `${result.estimates.timeMin} - ${result.estimates.timeMax} ${result.estimates.timeUnit}` : 'Time varies',
        difficulty: result.estimates?.difficulty || 'Medium',
        providersFound: result.providers.length
      }
    });

  } catch (error) {
    console.error('Anonymous image analysis error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

// Submit service request with image analysis
app.post('/api/client/service-request', authenticateToken, requireClient, upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      urgency,
      budgetMin,
      budgetMax
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Image is required for service analysis' });
    }

    console.log('📸 Processing authenticated service request with enhanced MVP system:', req.file.filename);

    // Process service request with enhanced AI analysis
    const result = await processServiceRequest({
      clientId: req.user.id,
      title,
      description,
      imageUrl: req.file.path,
      location,
      urgency,
      budgetMin: budgetMin ? parseFloat(budgetMin) : null,
      budgetMax: budgetMax ? parseFloat(budgetMax) : null
    }, req.file.path);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'Enhanced service request processed successfully',
      request: result.request,
      
      // Frontend compatibility
      analysis: {
        analysis: result.analysis.fullAnalysis,
        confidence: result.analysisSuccess ? 0.8 : 0.3,
        detectedCategory: detectServiceCategory(result.analysis.fullAnalysis, result.detectedItem)
      },
      
      // Enhanced MVP response data
      detectedItem: result.detectedItem,
      detectedProblem: result.detectedProblem,
      detectedBrand: result.detectedBrand,
      severity: result.severity,
      difficulty: result.difficulty,
      estimatedTime: result.estimatedTime,
      analysisSuccess: result.analysisSuccess,
      fallbackUsed: result.fallbackUsed,
      estimates: result.estimates,
      
      // Service provider matches with enhanced scoring
      matchingProviders: result.providers.map(provider => ({
        ...provider,
        // Include dynamic pricing if available
        estimated_cost_range: result.estimates ? {
          min: result.estimates.costMin,
          max: result.estimates.costMax,
          currency: result.estimates.currency
        } : null,
        estimated_time_range: result.estimates ? {
          min: result.estimates.timeMin,
          max: result.estimates.timeMax,
          unit: result.estimates.timeUnit
        } : null
      })),
      
      totalMatches: result.providers.length,
      serviceMatches: result.matches,
      
      // Additional MVP data
      serviceCategory: detectServiceCategory(result.analysis.fullAnalysis, result.detectedItem),
      repairDifficulty: result.estimates?.difficulty || 'Medium',
      
      // Summary for user
      summary: {
        item: result.detectedItem || 'Unknown Device',
        problem: result.detectedProblem || 'General Issue',
        brand: result.detectedBrand || 'Unknown Brand',
        severity: result.severity || 'Moderate',
        estimatedCost: result.estimates ? `PHP ${result.estimates.costMin} - ${result.estimates.costMax}` : 'Quote needed',
        estimatedTime: result.estimates ? `${result.estimates.timeMin} - ${result.estimates.timeMax} ${result.estimates.timeUnit}` : 'Time varies',
        difficulty: result.estimates?.difficulty || 'Medium',
        providersFound: result.providers.length,
        averageMatchScore: result.matches ? 
          (result.matches.reduce((sum, match) => sum + match.matchScore, 0) / result.matches.length).toFixed(2) : 
          null
      }
    });

  } catch (error) {
    console.error('Service request error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: 'Failed to process service request' });
  }
});

// Get client's service requests
app.get('/api/client/service-requests', authenticateToken, requireClient, async (req, res) => {
  try {
    const requests = await dbHelpers.getServiceRequestsByClientId(req.user.id);
    res.json(requests);
  } catch (error) {
    console.error('Get service requests error:', error);
    res.status(500).json({ error: 'Failed to get service requests' });
  }
});

// Get service matches for a request
app.get('/api/client/service-request/:id/matches', authenticateToken, requireClient, async (req, res) => {
  try {
    const { id } = req.params;
    const matches = await dbHelpers.getServiceMatchesByRequestId(id);
    res.json(matches);
  } catch (error) {
    console.error('Get service matches error:', error);
    res.status(500).json({ error: 'Failed to get service matches' });
  }
});

// =================== GENERAL ROUTES ===================

// Get all service categories
app.get('/api/service-categories', async (req, res) => {
  try {
    const categories = await dbHelpers.getAllServiceCategories();
    res.json(categories);
  } catch (error) {
    console.error('Get service categories error:', error);
    res.status(500).json({ error: 'Failed to get service categories' });
  }
});

// Get all service providers (for client browsing)
app.get('/api/service-providers', authenticateToken, requireClient, async (req, res) => {
  try {
    const providers = await dbHelpers.getAllServiceProviders();
    
    // Group services by business
    const businessMap = new Map();
    
    providers.forEach(row => {
      const businessId = row.business_id;
      
      if (!businessMap.has(businessId)) {
        businessMap.set(businessId, {
          id: businessId,
          business_name: row.business_name,
          business_type: row.business_type,
          description: row.business_description,
          city: row.city,
          state: row.state,
          phone: row.phone,
          email: row.email,
          website: row.website,
          years_in_business: row.years_in_business,
          is_verified: row.is_verified,
          services: []
        });
      }
      
      // Add service if it exists
      if (row.service_id) {
        businessMap.get(businessId).services.push({
          id: row.service_id,
          service_name: row.service_name,
          description: row.service_description,
          base_price: row.base_price,
          price_unit: row.price_unit,
          estimated_duration: row.estimated_duration,
          duration_unit: row.duration_unit,
          is_emergency: row.is_emergency,
          category_name: row.category_name,
          category_id: row.category_id
        });
      }
    });
    
    const formattedProviders = Array.from(businessMap.values());
    res.json(formattedProviders);
  } catch (error) {
    console.error('Get service providers error:', error);
    res.status(500).json({ error: 'Failed to get service providers' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    service: 'Marketplace Backend'
  });
});

// Debug endpoint
app.get('/debug/config', (req, res) => {
  res.json({
    port: PORT,
    nodeEnv: process.env.NODE_ENV,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    uploadsDir: fs.existsSync('uploads'),
    databaseExists: fs.existsSync('marketplace.db'),
    timestamp: new Date().toISOString()
  });
});

// Legacy image analysis endpoint (for backwards compatibility)
app.post('/api/vision/describe-image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Gemini API key not configured',
        message: 'Please add your GEMINI_API_KEY to the .env file'
      });
    }

    console.log('🔍 Legacy image analysis:', req.file.filename);

    // Read the image file and convert to base64
    const imageData = fs.readFileSync(req.file.path);
    const base64Image = imageData.toString('base64');

    // Prepare the request for Gemini API
    const requestData = {
      contents: [{
        parts: [
          {
            text: "Analyze this image and provide a detailed description of what you see. Include objects, people, settings, actions, colors, and any other notable details."
          },
          {
            inline_data: {
              mime_type: req.file.mimetype,
              data: base64Image
            }
          }
        ]
      }]
    };

    // Make request to Gemini API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    // Extract the analysis from the response
    const analysis = response.data.candidates[0].content.parts[0].text;

    console.log('✅ Legacy analysis successful');

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      text: analysis,
      filename: req.file.filename,
      filesize: req.file.size,
      service: 'Google Gemini Vision'
    });

  } catch (error) {
    console.error('❌ Legacy vision API error:', error.response?.data || error.message);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (error.response?.status === 400) {
      return res.status(400).json({
        error: 'Invalid API request',
        message: 'Check your Gemini API key and request format'
      });
    }

    if (error.response?.status === 403) {
      return res.status(403).json({
        error: 'Gemini API access denied',
        message: 'Your API key may not have access to Gemini Vision API'
      });
    }

    res.status(500).json({
      error: 'Vision analysis failed',
      message: 'Failed to analyze image with Gemini API'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 10MB'
      });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Marketplace Backend Server running on port ${PORT}`);
  console.log(`🔑 Gemini API configured: ${process.env.GEMINI_API_KEY ? '✅ Yes' : '❌ No'}`);
  console.log(`📁 Database file: ${fs.existsSync('marketplace.db') ? '✅ Connected' : '❌ Not found'}`);
  console.log(`📁 Uploads directory: ${fs.existsSync('uploads') ? '✅ Ready' : '❌ Will be created'}`);
  console.log(`💼 Service: Business Marketplace Platform`);
}); 