const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Carbon Calculation Constants (AMS-II.G Methodology)
const F_NRB = 0.88; 
const EF_WOODY = 0.001747; // tCO2e/kg

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'Kenya Carbon MRV API' });
});

// Submit / Ingest Field Audits
app.post('/api/projects/cookstoves/submit', async (req, res) => {
  try {
    const { records } = req.body;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Invalid payload: records array required.' });
    }

    let processedCount = 0;

    for (const record of records) {
      const fuelwoodSavedKg = parseFloat(record.fuelwoodSavedKg) || 0;
      
      // Calculate annual carbon credits saved (tCO2e/year)
      const annualWoodSavedKg = fuelwoodSavedKg * 365;
      const calculatedTco2e = Number((annualWoodSavedKg * F_NRB * EF_WOODY).toFixed(4));

      const query = `
        INSERT INTO field_audits (household_id, county, fuelwood_saved_kg, calculated_tco2e, latitude, longitude)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (household_id) DO UPDATE 
        SET fuelwood_saved_kg = EXCLUDED.fuelwood_saved_kg, calculated_tco2e = EXCLUDED.calculated_tco2e;
      `;

      await db.query(query, [
        record.householdId,
        record.county || 'Nakuru',
        fuelwoodSavedKg,
        calculatedTco2e,
        record.latitude || -0.3031,
        record.longitude || 36.0800
      ]);

      processedCount++;
      console.log(`Ingested record: ${record.householdId} | Est. Offset: ${calculatedTco2e} tCO2e/yr`);
    }

    res.status(200).json({ success: true, count: processedCount });
  } catch (err) {
    console.error('Database insertion error:', err);
    res.status(500).json({ error: 'Failed to process field audit records.' });
  }
});

// Summary Endpoint for Dashboard Metrics
app.get('/api/projects/cookstoves/summary', async (req, res) => {
  try {
    const totalQuery = 'SELECT COUNT(*) as total_households, COALESCE(SUM(calculated_tco2e), 0) as total_tco2e FROM field_audits;';
    const countyQuery = 'SELECT county, COUNT(*) as households, COALESCE(SUM(calculated_tco2e), 0) as total_tco2e FROM field_audits GROUP BY county;';

    const totalRes = await db.query(totalQuery);
    const countyRes = await db.query(countyQuery);

    res.json({
      summary: totalRes.rows[0],
      byCounty: countyRes.rows
    });
  } catch (err) {
    console.error('Summary query error:', err);
    res.status(500).json({ error: 'Failed to fetch project summary.' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`MRV Backend API running on http://localhost:${PORT}`);
});