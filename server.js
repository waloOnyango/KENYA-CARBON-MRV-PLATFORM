require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Handle favicon requests to reduce log noise
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Connection string handling for Neon / Vercel
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

// Instantiate PostgreSQL Connection Pool ONCE
const pool = new Pool({
  connectionString: connectionString || 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  ssl: connectionString ? { rejectUnauthorized: false } : false,
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Root Landing Route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Kenya Carbon MRV Backend API is operational.',
    hasDbUrl: Boolean(connectionString)
  });
});

// Health Check & Database Connection Verification
app.get('/api/health', async (req, res) => {
  if (!connectionString) {
    return res.status(500).json({
      status: 'error',
      message: 'DATABASE_URL environment variable is missing on Vercel.'
    });
  }

  try {
    const result = await pool.query('SELECT NOW() AS current_time, current_database() AS db_name');
    res.status(200).json({
      status: 'success',
      message: 'Database connected successfully!',
      dbTime: result.rows[0].current_time,
      database: result.rows[0].db_name
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// POST /api/init-db - Create required tables with GIS coordinate columns
app.post('/api/init-db', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mrv_projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        project_type VARCHAR(255) NOT NULL,
        co2_reduced NUMERIC(12, 2) DEFAULT 0.00,
        latitude NUMERIC(10, 6),
        longitude NUMERIC(10, 6),
        description TEXT,
        developer VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    res.status(200).json({
      status: 'success',
      message: 'Database tables initialized successfully with spatial attributes!'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to initialize database tables',
      error: error.message
    });
  }
});

// GET /api/projects - Fetch all projects
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM mrv_projects ORDER BY id DESC;');
    res.status(200).json({
      status: 'success',
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve projects',
      error: error.message
    });
  }
});

// POST /api/projects - Register a new project with GIS coordinates
app.post('/api/projects', async (req, res) => {
  const { name, location, project_type, co2_reduced, latitude, longitude, description, developer } = req.body;

  if (!name || !project_type) {
    return res.status(400).json({
      status: 'error',
      message: 'Name and project_type are required fields.'
    });
  }

  try {
    const query = `
      INSERT INTO mrv_projects (name, location, project_type, co2_reduced, latitude, longitude, description, developer)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [name, location, project_type, co2_reduced || 0, latitude || null, longitude || null, description, developer];
    const result = await pool.query(query, values);

    res.status(201).json({
      status: 'success',
      message: 'Project registered successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error inserting project:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to register project',
      error: error.message
    });
  }
});

// Local development server runner
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running locally on port ${PORT}`));
}

// Export module for Vercel Serverless Function Execution MUST be at the very bottom
module.exports = app;