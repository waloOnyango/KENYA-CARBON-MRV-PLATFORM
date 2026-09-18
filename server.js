require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Enable CORS and JSON Parsing
app.use(cors());
app.use(express.json());

// Prevent Favicon 404/500 logging noise
app.get('/favicon.ico', (req, res) => res.status(204).end());

// -----------------------------------------------------------------------------
// PostgreSQL Database Connection Pool Setup
// -----------------------------------------------------------------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// -----------------------------------------------------------------------------
// API ENDPOINTS
// -----------------------------------------------------------------------------

// Root Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Kenya Carbon MRV Backend API is operational on Vercel.'
  });
});

// Health Check & Database Connection Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS current_time, current_database() AS db_name');
    res.status(200).json({
      status: 'success',
      message: 'Database connected successfully!',
      serverTime: new Date().toISOString(),
      databaseDetails: {
        currentTime: result.rows[0].current_time,
        databaseName: result.rows[0].db_name
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

// Optional: Manual One-Time Database Init Endpoint
app.get('/api/init-db', async (req, res) => {
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
    res.status(200).json({ status: 'success', message: 'Schema created successfully.' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
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

// Log MRV Activity Data & Compute Carbon Credits (tCO2e) by Mahlon
app.post('/api/mrv/measurements', async (req, res) => {
  const { project_id, batch_date, feedstock_weight_tonnes, biochar_yield_tonnes } = req.body;
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

module.exports = app;
// Wrap pool initialization safely
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: process.env.DATABASE_URL || process.env.POSTGRES_URL ? { rejectUnauthorized: false } : false,
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
} catch (err) {
  console.error("Failed to create PG pool:", err);
}