require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON Parsing
app.use(cors());
app.use(express.json());

// -----------------------------------------------------------------------------
// PostgreSQL Database Connection Pool Setup
// -----------------------------------------------------------------------------
// Hardcoded fallback credentials prevent node-postgres from defaulting to "HP"
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com') 
    ? { rejectUnauthorized: false } 
    : false
});

// Auto-initialize MRV Schema on Server Startup
const initDb = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS mrv_projects (
      id SERIAL PRIMARY KEY,
      project_name VARCHAR(255) NOT NULL,
      methodology VARCHAR(100) NOT NULL,
      location VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mrv_measurements (
      id SERIAL PRIMARY KEY,
      project_id INT REFERENCES mrv_projects(id),
      batch_date DATE NOT NULL,
      feedstock_weight_tonnes NUMERIC NOT NULL,
      biochar_yield_tonnes NUMERIC NOT NULL,
      calculated_tco2e NUMERIC NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(queryText);
    console.log('✓ PostgreSQL connected and Carbon MRV schema verified.');
  } catch (err) {
    console.error('✗ Database schema initialization error:', err.message);
  }
};

initDb();

// -----------------------------------------------------------------------------
// API ENDPOINTS
// -----------------------------------------------------------------------------

// Root Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Kenya Carbon MRV Backend API is fully operational.'
  });
});

// Health Check & Database Connection Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS current_time, current_database() AS db_name, version() AS db_version');
    res.status(200).json({
      status: 'success',
      message: 'Database connected successfully!',
      serverTime: new Date().toISOString(),
      databaseDetails: {
        currentTime: result.rows[0].current_time,
        databaseName: result.rows[0].db_name,
        postgresqlVersion: result.rows[0].db_version
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Create Carbon Project
app.post('/api/projects', async (req, res) => {
  const { project_name, methodology, location } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO mrv_projects (project_name, methodology, location) VALUES ($1, $2, $3) RETURNING *',
      [project_name, methodology, location]
    );
    res.status(201).json({ status: 'success', project: result.rows[0] });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Log MRV Activity Data & Compute Carbon Credits (tCO2e)
app.post('/api/mrv/measurements', async (req, res) => {
  const { project_id, batch_date, feedstock_weight_tonnes, biochar_yield_tonnes } = req.body;
  
  // Standard sequestration factor: ~2.5 tCO2e per tonne of biochar
  const TCO2E_FACTOR = 2.5;
  const calculated_tco2e = parseFloat(biochar_yield_tonnes) * TCO2E_FACTOR;

  try {
    const result = await pool.query(
      `INSERT INTO mrv_measurements 
        (project_id, batch_date, feedstock_weight_tonnes, biochar_yield_tonnes, calculated_tco2e) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [project_id, batch_date, feedstock_weight_tonnes, biochar_yield_tonnes, calculated_tco2e]
    );
    
    res.status(201).json({
      status: 'success',
      message: 'MRV record logged and tCO2e generated successfully.',
      record: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// -----------------------------------------------------------------------------
// Server Initialization
// -----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`Carbon MRV Server running on http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=================================================`);
});
const express = require('express');
const app = express();

// ... Keep your existing routes, middlewares (cors, json), and DB imports ...

// Export the Express app as a module handler for Vercel
module.exports = app;

// Only listen on a port if running locally outside Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for hosted PostgreSQL (Render/Neon/Supabase)
  },
  max: 1, // Restrict pool size per serverless invocation
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = pool;