const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { dbHelpers } = require('./database');

// JWT secret key (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is service provider
const requireServiceProvider = (req, res, next) => {
  console.log('🔍 Checking user type for service provider:', req.user);
  // Check both userType and user_type for compatibility
  const userType = req.user.userType || req.user.user_type;
  if (userType !== 'service_provider') {
    console.log('❌ Access denied - user type:', userType);
    return res.status(403).json({ error: 'Service provider access required' });
  }
  console.log('✅ Service provider access granted');
  next();
};

// Middleware to check if user is client
const requireClient = (req, res, next) => {
  console.log('🔍 Checking user type for client:', req.user);
  // Check both userType and user_type for compatibility
  const userType = req.user.userType || req.user.user_type;
  if (userType !== 'client') {
    console.log('❌ Access denied - user type:', userType);
    return res.status(403).json({ error: 'Client access required' });
  }
  console.log('✅ Client access granted');
  next();
};

// Helper functions
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      userType: user.user_type || user.userType,
      user_type: user.user_type || user.userType, // Keep both for compatibility
      firstName: user.first_name || user.firstName,
      lastName: user.last_name || user.lastName
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register user
const registerUser = async (req, res) => {
  try {
    const { email, password, userType, firstName, lastName, phone } = req.body;

    // Validate required fields
    if (!email || !password || !userType || !firstName || !lastName) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Validate user type
    if (!['service_provider', 'client'].includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    // Check if user already exists
    const existingUser = await dbHelpers.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await dbHelpers.createUser({
      email,
      password: hashedPassword,
      userType,
      firstName,
      lastName,
      phone
    });

    // Generate token
    console.log('🔐 Creating token for new user:', { 
      id: newUser.id, 
      email: newUser.email, 
      userType: newUser.userType 
    });
    
    const token = generateToken({ 
      id: newUser.id, 
      email: newUser.email, 
      userType: newUser.userType,
      user_type: newUser.userType,
      first_name: newUser.firstName,
      last_name: newUser.lastName
    });

    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      userType: newUser.userType,
      firstName: newUser.firstName,
      lastName: newUser.lastName
    };

    console.log('📤 Sending registration response:', userResponse);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await dbHelpers.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    console.log('🔐 Creating token for login user:', {
      id: user.id,
      email: user.email,
      userType: user.user_type
    });
    
    const token = generateToken(user);

    const userResponse = {
      id: user.id,
      email: user.email,
      userType: user.user_type,
      firstName: user.first_name,
      lastName: user.last_name
    };

    console.log('📤 Sending login response:', userResponse);

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    const user = await dbHelpers.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      userType: user.user_type,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      createdAt: user.created_at
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

// Logout user (client-side token removal)
const logoutUser = (req, res) => {
  res.json({ message: 'Logout successful' });
};

module.exports = {
  authenticateToken,
  requireServiceProvider,
  requireClient,
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  hashPassword,
  comparePassword,
  generateToken
}; 