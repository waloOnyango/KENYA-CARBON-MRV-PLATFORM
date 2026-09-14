import React, { useState, useEffect } from 'react';

function App() {
  const [formData, setFormData] = useState({
    householdId: '',
    county: 'Nakuru',
    stoveModel: 'Jiko Smart',
    fuelwoodSavedKg: 4.5,
  });

  const [localSubmissions, setLocalSubmissions] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    const cached = JSON.parse(localStorage.getItem('mrv_field_data') || '[]');
    setLocalSubmissions(cached);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const unsyncedCount = localSubmissions.filter((item) => !item.synced).length;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newRecord = {
      ...formData,
      id: Date.now(),
      synced: false,
    };

    const updated = [newRecord, ...localSubmissions];
    setLocalSubmissions(updated);
    localStorage.setItem('mrv_field_data', JSON.stringify(updated));
    setFormData({ ...formData, householdId: '' });
    setSyncStatus({ type: 'success', text: 'Audit saved locally to device.' });
  };

  const syncData = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const unsynced = localSubmissions.filter((item) => !item.synced);
      const response = await fetch('http://localhost:5000/api/projects/cookstoves/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: unsynced }),
      });

      if (response.ok) {
        const markedSynced = localSubmissions.map((item) => ({ ...item, synced: true }));
        setLocalSubmissions(markedSynced);
        localStorage.setItem('mrv_field_data', JSON.stringify(markedSynced));
        setSyncStatus({ type: 'success', text: 'All field records synced to server!' });
      } else {
        setSyncStatus({ type: 'error', text: 'Server error during sync.' });
      }
    } catch (err) {
      setSyncStatus({ type: 'error', text: 'Sync failed: Cannot reach backend server (http://localhost:5000).' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '20px auto', fontFamily: 'system-ui, sans-serif', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      
      {/* Network & App Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Kenya Carbon MRV</h2>
          <small style={{ color: '#64748b' }}>Field Audit Ingestion</small>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px', backgroundColor: isOnline ? '#166534' : '#991b1b', color: 'white' }}>
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      {/* SYNC PANEL WIDGET */}
      <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Unsynced Audits</span>
          <strong style={{ fontSize: '18px', color: unsyncedCount > 0 ? '#ea580c' : '#16a34a' }}>{unsyncedCount} Pending</strong>
        </div>
        
        {/* SYNC BUTTON */}
        <button
          onClick={syncData}
          disabled={!isOnline || unsyncedCount === 0 || isSyncing}
          style={{
            backgroundColor: isOnline && unsyncedCount > 0 ? '#2563eb' : '#cbd5e1',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: isOnline && unsyncedCount > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {syncStatus && (
        <div style={{ padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', backgroundColor: syncStatus.type === 'success' ? '#dcfce7' : '#fee2e2', color: syncStatus.type === 'success' ? '#15803d' : '#b91c1c' }}>
          {syncStatus.text}
        </div>
      )}

      {/* Audit Entry Form */}
      <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1e293b' }}>New Household Audit</h3>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Household ID</label>
          <input
            type="text"
            placeholder="e.g. HH-NAKURU-101"
            value={formData.householdId}
            onChange={(e) => setFormData({ ...formData, householdId: e.target.value })}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>County</label>
          <select
            value={formData.county}
            onChange={(e) => setFormData({ ...formData, county: e.target.value })}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          >
            <option value="Nakuru">Nakuru</option>
            <option value="Narok">Narok</option>
            <option value="Kajiado">Kajiado</option>
          </select>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Wood Saved (kg / day)</label>
          <input
            type="number"
            step="0.1"
            value={formData.fuelwoodSavedKg}
            onChange={(e) => setFormData({ ...formData, fuelwoodSavedKg: parseFloat(e.target.value) })}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
          />
        </div>

        <button type="submit" style={{ width: '100%', backgroundColor: '#0f172a', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          + Save Audit Record
        </button>
      </form>

      {/* Record List */}
      <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#475569' }}>Local Device Records ({localSubmissions.length})</h4>
        {localSubmissions.length === 0 ? (
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>No records saved on device.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {localSubmissions.map((sub) => (
              <li key={sub.id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span><strong>{sub.householdId}</strong> ({sub.county})</span>
                <span style={{ color: sub.synced ? '#16a34a' : '#ea580c', fontWeight: 'bold', fontSize: '11px' }}>
                  {sub.synced ? '● SYNCED' : '● PENDING'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}

export default App;