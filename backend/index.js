require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Serve static frontend assets from backend directory
app.use(express.static(__dirname));

// Resolve Database Connection String
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

// Initialize PostgreSQL Pool safely
let pool;
if (connectionString) {
  pool = new Pool({
    connectionString: connectionString.trim().replace(/^["']|["']$/g, ''),
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

// Serve UI at Root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API Health Check
app.get('/api/health', async (req, res) => {
  if (!pool) {
    return res.status(500).json({
      status: 'error',
      message: 'DATABASE_URL is not configured in Vercel Environment Variables.'
    });
  }

  try {
    const result = await pool.query('SELECT NOW() AS current_time');
    res.status(200).json({
      status: 'success',
      message: 'Database connected successfully!',
      time: result.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// POST /api/init-db - Create Clean Cooking MRV Tables
app.post('/api/init-db', async (req, res) => {
  if (!pool) {
    return res.status(500).json({
      status: 'error',
      message: 'DATABASE_URL is missing in environment variables.'
    });
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mrv_projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        project_type VARCHAR(255) NOT NULL,
        fuel_type VARCHAR(100),
        target_households INTEGER,
        description TEXT,
        developer VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS mrv_measurements (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES mrv_projects(id) ON DELETE CASCADE,
        fuel_saved_tons NUMERIC(10, 2),
        co2_reduced_tons NUMERIC(10, 2),
        verification_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    res.status(200).json({
      status: 'success',
      message: 'Clean cooking MRV tables initialized successfully!'
    });
  } catch (error) {
    console.error('Database Init Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to initialize database tables',
      error: error.message
    });
  }
});

// POST /api/projects - Register Clean Cooking Project
app.post('/api/projects', async (req, res) => {
  if (!pool) {
    return res.status(500).json({
      status: 'error',
      message: 'DATABASE_URL is missing in environment variables.'
    });
  }

  const { name, location, project_type, fuel_type, target_households, description, developer } = req.body;

  if (!name || !project_type) {
    return res.status(400).json({
      status: 'error',
      message: 'Name and project_type are required fields.'
    });
  }

  try {
    const query = `
      INSERT INTO mrv_projects (name, location, project_type, fuel_type, target_households, description, developer)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [name, location, project_type, fuel_type, target_households, description, developer];
    const result = await pool.query(query, values);

    res.status(201).json({
      status: 'success',
      message: 'Clean cooking project registered successfully',
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

// GET /api/projects - Query Registered Projects
app.get('/api/projects', async (req, res) => {
  if (!pool) {
    return res.status(500).json({
      status: 'error',
      message: 'DATABASE_URL is missing in environment variables.'
    });
  }

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

module.exports = app;
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// Get connection string safely
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

let pool = null;
if (connectionString) {
  pool = new Pool({
    connectionString: connectionString.trim().replace(/^["']|["']$/g, ''),
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

// Serve UI on Root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// GET /api/health
app.get('/api/health', async (req, res) => {
  if (!pool) {
    return res.status(500).json({
      status: 'error',
      message: 'DATABASE_URL environment variable is missing on Vercel.'
    });
  }

  try {
    const result = await pool.query('SELECT NOW() AS current_time;');
    res.status(200).json({
      status: 'success',
      message: 'Database connected successfully!',
      time: result.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// POST /api/init-db
app.post('/api/init-db', async (req, res) => {
  if (!pool) {
    return res.status(500).json({
      status: 'error',
      message: 'DATABASE_URL is missing in Vercel environment variables.'
    });
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mrv_projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        project_type VARCHAR(255) NOT NULL,
        fuel_type VARCHAR(100),
        target_households INTEGER,
        description TEXT,
        developer VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    res.status(200).json({
      status: 'success',
      message: 'Clean cooking MRV tables initialized successfully!'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to initialize database tables',
      error: error.message
    });
  }
});

module.exports = app;