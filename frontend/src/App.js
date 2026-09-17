import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const API_BASE_URL = 'http://localhost:5000';

// --- SHARED GIS MAP COMPONENT ---
const GISMap = ({ submissions }) => {
  const kenyaCenter = [-1.286389, 36.817223];

  return (
    <div style={{ height: '450px', width: '100%', borderRadius: '10px', overflow: 'hidden', border: '2px solid #2e7d32', marginTop: '15px' }}>
      <MapContainer center={kenyaCenter} zoom={6} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {submissions.map((item) => (
          <CircleMarker
            key={item.id}
            center={[parseFloat(item.latitude), parseFloat(item.longitude)]}
            radius={10}
            pathOptions={{
              color: item.verification_status === 'Verified' ? '#1b5e20' : '#e65100',
              fillColor: item.verification_status === 'Verified' ? '#4caf50' : '#ff9800',
              fillOpacity: 0.8
            }}
          >
            <Popup>
              <strong>Stove ID:</strong> {item.stove_id}<br />
              <strong>County:</strong> {item.county}<br />
              <strong>Biomass Saved:</strong> {item.biomass_saved_kg} kg<br />
              <strong>Status:</strong> {item.verification_status}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

// --- FIELD AGENT LOGIN PAGE ---
const AgentLogin = ({ setAgentUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'agent_nairobi' && password === 'agent123') {
      const user = { username, role: 'field_agent' };
      setAgentUser(user);
      navigate('/agent/dashboard');
    } else {
      setError('Invalid Agent Credentials. Use: agent_nairobi / agent123');
    }
  };

  return (
    <div style={formCardStyle}>
      <h2 style={{ color: '#2e7d32' }}>Field Agent Portal Access</h2>
      <p>Log in to register cookstoves & update regional deployment logs.</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <input type="text" placeholder="Agent Username" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
        <button type="submit" style={btnGreenStyle}>Log In as Field Agent</button>
      </form>
    </div>
  );
};

// --- ADMIN LOGIN PAGE ---
const AdminLogin = ({ setAdminUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin_kenya' && password === 'admin123') {
      const user = { username, role: 'admin' };
      setAdminUser(user);
      navigate('/admin/dashboard');
    } else {
      setError('Invalid Admin Credentials. Use: admin_kenya / admin123');
    }
  };

  return (
    <div style={formCardStyle}>
      <h2 style={{ color: '#0288d1' }}>Administrator Portal Access</h2>
      <p>Log in to view aggregate emissions reductions, add remarks & print reports.</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <input type="text" placeholder="Admin Username" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
        <button type="submit" style={btnBlueStyle}>Log In as Administrator</button>
      </form>
    </div>
  );
};

// --- FIELD AGENT DASHBOARD ---
const AgentDashboard = ({ agentUser, submissions, setSubmissions }) => {
  const [formData, setFormData] = useState({
    stove_id: '',
    county: 'Nairobi',
    latitude: '',
    longitude: '',
    biomass_saved_kg: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newEntry = {
      id: Date.now(),
      stove_id: formData.stove_id,
      county: formData.county,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      biomass_saved_kg: parseFloat(formData.biomass_saved_kg),
      verification_status: 'Pending Review',
      remarks: ''
    };
    setSubmissions([newEntry, ...submissions]);
    setFormData({ stove_id: '', county: 'Nairobi', latitude: '', longitude: '', biomass_saved_kg: '' });
  };

  return (
    <div>
      <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Welcome, Agent ({agentUser.username})</h3>
        <p>Record stove installation parameters and spatial baseline coordinates.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* FIELD AGENT DATA ENTRY FORM */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3>Stove Installation Form</h3>
          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>Stove Serial ID</label>
            <input type="text" placeholder="e.g. KCS-NRB-015" value={formData.stove_id} onChange={(e) => setFormData({ ...formData, stove_id: e.target.value })} style={inputStyle} required />

            <label style={labelStyle}>County</label>
            <select value={formData.county} onChange={(e) => setFormData({ ...formData, county: e.target.value })} style={inputStyle}>
              <option value="Nairobi">Nairobi</option>
              <option value="Kisumu">Kisumu</option>
              <option value="Nakuru">Nakuru</option>
              <option value="Kiambu">Kiambu</option>
            </select>

            <label style={labelStyle}>GPS Latitude</label>
            <input type="number" step="any" placeholder="-1.2863" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} style={inputStyle} required />

            <label style={labelStyle}>GPS Longitude</label>
            <input type="number" step="any" placeholder="36.8172" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} style={inputStyle} required />

            <label style={labelStyle}>Biomass Saved (kg/yr)</label>
            <input type="number" placeholder="450" value={formData.biomass_saved_kg} onChange={(e) => setFormData({ ...formData, biomass_saved_kg: e.target.value })} style={inputStyle} required />

            <button type="submit" style={btnGreenStyle}>Submit Field Record</button>
          </form>
        </div>

        {/* GIS HOTSPOT MAP */}
        <div>
          <h3>Coverage & Regional Hotspots (Field Agent View)</h3>
          <GISMap submissions={submissions} />
        </div>
      </div>
    </div>
  );
};

// --- ADMIN DASHBOARD ---
const AdminDashboard = ({ adminUser, submissions, setSubmissions }) => {
  const [selectedCounty, setSelectedCounty] = useState('All');

  const filtered = selectedCounty === 'All' ? submissions : submissions.filter(s => s.county === selectedCounty);

  // AMS-II.G Emissions Reductions Formula
  const totalBiomass = filtered.reduce((acc, curr) => acc + curr.biomass_saved_kg, 0);
  const totalOffsets = (totalBiomass * 0.88 * 0.001747).toFixed(4);

  const updateRemark = (id, text) => {
    setSubmissions(submissions.map(item => item.id === id ? { ...item, remarks: text } : item));
  };

  const updateStatus = (id, newStatus) => {
    setSubmissions(submissions.map(item => item.id === id ? { ...item, verification_status: newStatus } : item));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2>Administrator Executive Portal</h2>
        <button onClick={() => window.print()} style={btnBlueStyle}>🖨️ Print Regional Summary Report</button>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={metricCardStyle}>
          <h3>{filtered.length}</h3>
          <p>Total Stoves</p>
        </div>
        <div style={metricCardStyle}>
          <h3>{totalBiomass.toLocaleString()} kg</h3>
          <p>Biomass Saved</p>
        </div>
        <div style={{ ...metricCardStyle, background: '#e3f2fd', border: '1px solid #90caf9' }}>
          <h3>{totalOffsets} tCO₂e</h3>
          <p>Verified Carbon Offsets (AMS-II.G)</p>
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Filter by County: </label>
        <select value={selectedCounty} onChange={(e) => setSelectedCounty(e.target.value)} style={{ padding: '8px', borderRadius: '4px' }}>
          <option value="All">All Regions (National Baseline)</option>
          <option value="Nairobi">Nairobi</option>
          <option value="Kisumu">Kisumu</option>
          <option value="Nakuru">Nakuru</option>
          <option value="Kiambu">Kiambu</option>
        </select>
      </div>

      <h3>GIS Hotspot & Distribution Map (Admin View)</h3>
      <GISMap submissions={filtered} />

      <h3 style={{ marginTop: '25px' }}>Audit Trail, Approvals & Remarks</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr style={{ background: '#f4f4f4', textAlign: 'left' }}>
            <th style={cellStyle}>Stove ID</th>
            <th style={cellStyle}>County</th>
            <th style={cellStyle}>Coordinates</th>
            <th style={cellStyle}>Biomass (kg)</th>
            <th style={cellStyle}>Status</th>
            <th style={cellStyle}>Admin Remarks</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item) => (
            <tr key={item.id}>
              <td style={cellStyle}>{item.stove_id}</td>
              <td style={cellStyle}>{item.county}</td>
              <td style={cellStyle}>{item.latitude}, {item.longitude}</td>
              <td style={cellStyle}>{item.biomass_saved_kg}</td>
              <td style={cellStyle}>
                <select value={item.verification_status} onChange={(e) => updateStatus(item.id, e.target.value)} style={{ padding: '5px' }}>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Verified">Verified</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </td>
              <td style={cellStyle}>
                <input
                  type="text"
                  value={item.remarks}
                  placeholder="Enter evaluation notes..."
                  onChange={(e) => updateRemark(item.id, e.target.value)}
                  style={{ width: '95%', padding: '5px' }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- MAIN APP ENTRY COMPONENT ---
export default function App() {
  const [agentUser, setAgentUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);

  // Shared state for submissions across maps and forms
  const [submissions, setSubmissions] = useState([
    { id: 1, stove_id: 'KCS-NRB-001', county: 'Nairobi', latitude: -1.286389, longitude: 36.817223, biomass_saved_kg: 500, verification_status: 'Verified', remarks: 'GPS verified on-site' },
    { id: 2, stove_id: 'KCS-KSM-004', county: 'Kisumu', latitude: -0.091702, longitude: 34.767956, biomass_saved_kg: 850, verification_status: 'Pending Review', remarks: 'Awaiting biomass check' }
  ]);

  return (
    <Router basename="/KENYA-CARBON-MRV-PLATFORM">
      <div style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
        
        {/* USER FRIENDLY NAVIGATION BAR */}
        <header style={{ background: '#1b5e20', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
          <h1 style={{ color: '#ffffff', margin: 0, fontSize: '20px' }}>🌿 Kenya Carbon MRV Platform</h1>
          <div style={{ display: 'flex', gap: '15px' }}>
            <Link to="/agent/login"><button style={navBtnStyle}>📱 Field Agent Access</button></Link>
            <Link to="/admin/login"><button style={navBtnAdminStyle}>📊 Admin Portal Access</button></Link>
          </div>
        </header>

        <main style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/agent/login" replace />} />
            
            {/* AGENT ROUTES */}
            <Route path="/agent/login" element={<AgentLogin setAgentUser={setAgentUser} />} />
            <Route path="/agent/dashboard" element={agentUser ? <AgentDashboard agentUser={agentUser} submissions={submissions} setSubmissions={setSubmissions} /> : <Navigate to="/agent/login" replace />} />

            {/* ADMIN ROUTES */}
            <Route path="/admin/login" element={<AdminLogin setAdminUser={setAdminUser} />} />
            <Route path="/admin/dashboard" element={adminUser ? <AdminDashboard adminUser={adminUser} submissions={submissions} setSubmissions={setSubmissions} /> : <Navigate to="/admin/login" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// --- STYLES ---
const formCardStyle = { maxWidth: '400px', margin: '40px auto', background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
const inputStyle = { width: '100%', padding: '10px', margin: '8px 0 15px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' };
const labelStyle = { fontWeight: 'bold', fontSize: '14px' };
const btnGreenStyle = { width: '100%', padding: '12px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const btnBlueStyle = { width: '100%', padding: '12px', background: '#0288d1', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const navBtnStyle = { padding: '10px 18px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' };
const navBtnAdminStyle = { padding: '10px 18px', background: '#0288d1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' };
const metricCardStyle = { flex: 1, border: '1px solid #ddd', padding: '15px', borderRadius: '8px', textAlign: 'center', background: '#fff' };
const cellStyle = { padding: '12px', borderBottom: '1px solid #eee' };