import React, { useState } from 'react';

const AdminDashboard = () => {
  const [stats] = useState({
    totalStoves: 1250,
    totalBiomassSavedKg: 450000,
    totalEmissionReductions: 691.8,
    activeCounties: 4
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Kenya Carbon MRV - Executive & Admin Dashboard</h2>
      <p>AMS-II.G Compliance & Regional Aggregations</p>
      
      <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
        <div style={cardStyle}>
          <h3>{stats.totalStoves}</h3>
          <p>Stoves Deployed</p>
        </div>
        <div style={cardStyle}>
          <h3>{stats.totalBiomassSavedKg.toLocaleString()} kg</h3>
          <p>Biomass Saved</p>
        </div>
        <div style={cardStyle}>
          <h3>{stats.totalEmissionReductions} tCO₂e</h3>
          <p>Verified Carbon Offsets</p>
        </div>
        <div style={cardStyle}>
          <h3>{stats.activeCounties}</h3>
          <p>Active Project Areas</p>
        </div>
      </div>
    </div>
  );
};

const cardStyle = {
  border: '1px solid #ccc',
  borderRadius: '8px',
  padding: '15px',
  minWidth: '180px',
  textAlign: 'center',
  background: '#f9f9f9'
};

export default AdminDashboard;