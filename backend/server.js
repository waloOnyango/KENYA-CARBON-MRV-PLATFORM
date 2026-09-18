require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Enable CORS and JSON Body Parsing
app.use(cors());
app.use(express.json());

// Prevent Favicon noise
app.get('/favicon.ico', (req, res) => res.status(204).end());

// -----------------------------------------------------------------------------
// PostgreSQL Connection Pool
// -----------------------------------------------------------------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.DATABASE_URL || process.env.POSTGRES_URL ? { rejectUnauthorized: false } : false,
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// -----------------------------------------------------------------------------
// API ENDPOINTS
// -----------------------------------------------------------------------------

// Root Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Kenya Carbon MRV Backend API is fully operational on Vercel.'
  });
});

// Health Check Endpoint
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

// One-Time DB Schema Setup Endpoint
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
    res.status(200).json({ status: 'success', message: 'MRV schema verified and created.' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Local Development Fallback
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Local server running on port ${PORT}`));
}

module.exports = app;app.get('/api/init-db', async (req, res) => { ... });
// Add or update this route in backend/server.js
app.get('/api/projects', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM mrv_projects ORDER BY created_at DESC');
    res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});
// Ensure fallback to process.env.POSTGRES_URL if DATABASE_URL is unset
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("FATAL: Neither DATABASE_URL nor POSTGRES_URL is set in environment variables.");
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: connectionString ? { rejectUnauthorized: false } : false,
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});