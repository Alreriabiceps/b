const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'marketplace.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('📁 Connected to SQLite database');
  }
});

// Initialize database tables
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table (both service providers and clients)
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          user_type TEXT NOT NULL CHECK (user_type IN ('service_provider', 'client')),
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          phone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating users table:', err);
        else console.log('✅ Users table ready');
      });

      // Businesses table (for service providers)
      db.run(`
        CREATE TABLE IF NOT EXISTS businesses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          business_name TEXT NOT NULL,
          business_type TEXT NOT NULL,
          description TEXT,
          address TEXT,
          city TEXT,
          state TEXT,
          zip_code TEXT,
          phone TEXT,
          email TEXT,
          website TEXT,
          license_number TEXT,
          years_in_business INTEGER,
          logo_url TEXT,
          is_verified BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) console.error('Error creating businesses table:', err);
        else console.log('✅ Businesses table ready');
      });

      // Service categories table
      db.run(`
        CREATE TABLE IF NOT EXISTS service_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          keywords TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating service_categories table:', err);
        else console.log('✅ Service categories table ready');
      });

      // Services table (what businesses offer)
      db.run(`
        CREATE TABLE IF NOT EXISTS services (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          business_id INTEGER NOT NULL,
          category_id INTEGER NOT NULL,
          service_name TEXT NOT NULL,
          description TEXT,
          base_price DECIMAL(10,2),
          price_unit TEXT,
          estimated_duration INTEGER,
          duration_unit TEXT DEFAULT 'hours',
          is_emergency BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (business_id) REFERENCES businesses (id),
          FOREIGN KEY (category_id) REFERENCES service_categories (id)
        )
      `, (err) => {
        if (err) console.error('Error creating services table:', err);
        else console.log('✅ Services table ready');
      });

      // Service requests table (from clients)
      db.run(`
        CREATE TABLE IF NOT EXISTS service_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          image_url TEXT,
          ai_analysis TEXT,
          detected_service_category TEXT,
          location TEXT,
          urgency TEXT DEFAULT 'normal',
          budget_min DECIMAL(10,2),
          budget_max DECIMAL(10,2),
          status TEXT DEFAULT 'open' CHECK (status IN ('open', 'matched', 'in_progress', 'completed', 'cancelled')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) console.error('Error creating service_requests table:', err);
        else console.log('✅ Service requests table ready');
      });

      // Service matches table (connections between requests and providers)
      db.run(`
        CREATE TABLE IF NOT EXISTS service_matches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          request_id INTEGER NOT NULL,
          business_id INTEGER NOT NULL,
          service_id INTEGER NOT NULL,
          estimated_cost DECIMAL(10,2),
          estimated_time INTEGER,
          time_unit TEXT DEFAULT 'hours',
          match_score DECIMAL(3,2),
          status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'contacted', 'accepted', 'rejected')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (request_id) REFERENCES service_requests (id),
          FOREIGN KEY (business_id) REFERENCES businesses (id),
          FOREIGN KEY (service_id) REFERENCES services (id)
        )
      `, (err) => {
        if (err) console.error('Error creating service_matches table:', err);
        else console.log('✅ Service matches table ready');
      });

      // Insert default service categories
      const categories = [
        { name: 'Carpentry', description: 'Wood work, furniture repair, cabinet installation', keywords: 'door,window,cabinet,furniture,wood,repair,broken' },
        { name: 'Plumbing', description: 'Pipe repair, fixture installation, leak fixes', keywords: 'pipe,leak,faucet,toilet,water,drain,plumbing' },
        { name: 'Electrical', description: 'Wiring, outlet installation, electrical repairs', keywords: 'wire,outlet,switch,electrical,power,light,circuit' },
        { name: 'Painting', description: 'Interior and exterior painting services', keywords: 'paint,wall,ceiling,exterior,interior,color' },
        { name: 'Cleaning', description: 'House cleaning, deep cleaning, maintenance', keywords: 'clean,dirty,mess,house,office,maintenance' },
        { name: 'Landscaping', description: 'Garden maintenance, lawn care, tree services', keywords: 'garden,lawn,tree,grass,plant,landscape' },
        { name: 'Appliance Repair', description: 'Fixing household appliances', keywords: 'refrigerator,washer,dryer,dishwasher,oven,microwave,appliance' },
        { name: 'HVAC', description: 'Heating, ventilation, air conditioning', keywords: 'air,heating,cooling,ventilation,hvac,temperature' },
        { name: 'Roofing', description: 'Roof repair and installation', keywords: 'roof,shingle,leak,gutter,tile' },
        { name: 'Flooring', description: 'Floor installation and repair', keywords: 'floor,tile,carpet,hardwood,laminate' }
      ];

      const stmt = db.prepare('INSERT OR IGNORE INTO service_categories (name, description, keywords) VALUES (?, ?, ?)');
      categories.forEach(category => {
        stmt.run(category.name, category.description, category.keywords);
      });
      stmt.finalize();

      console.log('✅ Database initialization complete');
      resolve();
    });
  });
}

// Database helper functions
const dbHelpers = {
  // User operations
  createUser: (userData) => {
    return new Promise((resolve, reject) => {
      const { email, password, userType, firstName, lastName, phone } = userData;
      const stmt = db.prepare(`
        INSERT INTO users (email, password, user_type, first_name, last_name, phone)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(email, password, userType, firstName, lastName, phone, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, email, userType, firstName, lastName });
      });
      stmt.finalize();
    });
  },

  getUserByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  getUserById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Business operations
  createBusiness: (businessData) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO businesses (user_id, business_name, business_type, description, address, city, state, zip_code, phone, email, website, license_number, years_in_business)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        businessData.userId,
        businessData.businessName,
        businessData.businessType,
        businessData.description,
        businessData.address,
        businessData.city,
        businessData.state,
        businessData.zipCode,
        businessData.phone,
        businessData.email,
        businessData.website,
        businessData.licenseNumber,
        businessData.yearsInBusiness,
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...businessData });
        }
      );
      stmt.finalize();
    });
  },

  getBusinessByUserId: (userId) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM businesses WHERE user_id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Service operations
  createService: (serviceData) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO services (business_id, category_id, service_name, description, base_price, price_unit, estimated_duration, duration_unit, is_emergency)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        serviceData.businessId,
        serviceData.categoryId,
        serviceData.serviceName,
        serviceData.description,
        serviceData.basePrice,
        serviceData.priceUnit,
        serviceData.estimatedDuration,
        serviceData.durationUnit,
        serviceData.isEmergency,
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...serviceData });
        }
      );
      stmt.finalize();
    });
  },

  getServicesByBusinessId: (businessId) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT s.*, sc.name as category_name 
        FROM services s 
        JOIN service_categories sc ON s.category_id = sc.id 
        WHERE s.business_id = ?
      `, [businessId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Service category operations
  getAllServiceCategories: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM service_categories ORDER BY name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Service request operations
  createServiceRequest: (requestData) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO service_requests (client_id, title, description, image_url, ai_analysis, detected_service_category, location, urgency, budget_min, budget_max)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        requestData.clientId,
        requestData.title,
        requestData.description,
        requestData.imageUrl,
        requestData.aiAnalysis,
        requestData.detectedServiceCategory,
        requestData.location,
        requestData.urgency,
        requestData.budgetMin,
        requestData.budgetMax,
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...requestData });
        }
      );
      stmt.finalize();
    });
  },

  getServiceRequestsByClientId: (clientId) => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM service_requests WHERE client_id = ? ORDER BY created_at DESC', [clientId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Service matching operations
  findMatchingServices: (category, location) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT s.*, b.business_name, b.city, b.state, b.phone, b.email, sc.name as category_name
        FROM services s
        JOIN businesses b ON s.business_id = b.id
        JOIN service_categories sc ON s.category_id = sc.id
        WHERE sc.name = ? OR sc.keywords LIKE ?
        ORDER BY b.city, s.base_price
      `, [category, `%${category}%`], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  createServiceMatch: (matchData) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO service_matches (request_id, business_id, service_id, estimated_cost, estimated_time, time_unit, match_score)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        matchData.requestId,
        matchData.businessId,
        matchData.serviceId,
        matchData.estimatedCost,
        matchData.estimatedTime,
        matchData.timeUnit,
        matchData.matchScore,
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...matchData });
        }
      );
      stmt.finalize();
    });
  },

  getServiceMatchesByRequestId: (requestId) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT sm.*, b.business_name, b.city, b.state, b.phone, b.email, s.service_name, s.description
        FROM service_matches sm
        JOIN businesses b ON sm.business_id = b.id
        JOIN services s ON sm.service_id = s.id
        WHERE sm.request_id = ?
        ORDER BY sm.match_score DESC
      `, [requestId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

module.exports = {
  db,
  initializeDatabase,
  dbHelpers
}; 