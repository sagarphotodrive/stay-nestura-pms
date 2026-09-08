import { useState } from 'react';
import { Download, Upload, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

// Settings Component - Data Export/Import
const SettingsPage = () => {
  const [importStatus, setImportStatus] = useState(null);

  const handleExport = async () => {
    try {
      const res = await api.get('/data/export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `stay-nestura-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click(); URL.revokeObjectURL(url);
    } catch (err) { console.error(err); alert('Export failed'); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!window.confirm(`Import data from "${file.name}"?\n\nThis will REPLACE all current data:\n- ${data.properties?.length || 0} properties\n- ${data.guests?.length || 0} guests\n- ${data.bookings?.length || 0} bookings\n- ${data.expenses?.length || 0} expenses\n\nAre you sure?`)) return;
      const res = await api.post('/data/import', data);
      setImportStatus(res.data);
      alert('Data imported successfully!');
      window.location.reload();
    } catch (err) { console.error(err); alert('Import failed: ' + err.message); }
    e.target.value = '';
  };

  return (
    <div className="settings-page">
      <div className="page-header"><h1>Settings</h1></div>
      <div className="settings-section">
        <h2>Data Management</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>Export your data as a JSON backup file, or import data from a previous backup to migrate between deployments.</p>
        <div className="settings-cards">
          <div className="settings-card">
            <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}><Download size={24} /></div>
            <h3>Export Data</h3>
            <p>Download all properties, bookings, guests, and expenses as a JSON file.</p>
            <button className="btn btn-primary" onClick={handleExport}><Download size={16} /> Export Backup</button>
          </div>
          <div className="settings-card">
            <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}><Upload size={24} /></div>
            <h3>Import Data</h3>
            <p>Upload a previously exported JSON backup file to restore or migrate data.</p>
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}><Upload size={16} /> Import Backup<input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} /></label>
          </div>
        </div>
        {importStatus && (
          <div className="import-result">
            <CheckCircle size={16} /> Imported: {importStatus.imported?.properties || 0} properties, {importStatus.imported?.guests || 0} guests, {importStatus.imported?.bookings || 0} bookings, {importStatus.imported?.expenses || 0} expenses
          </div>
        )}
      </div>

      <div className="settings-section" style={{ marginTop: '20px' }}>
        <h2>CSV Export</h2>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>Download individual data tables as CSV files for use in Excel or Google Sheets.</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['properties', 'bookings', 'guests', 'expenses'].map(type => (
            <a key={type} href={`/api/data/export/csv/${type}`} download className="btn btn-primary" style={{ textDecoration: 'none' }}>
              <Download size={16} /> {type.charAt(0).toUpperCase() + type.slice(1)} CSV
            </a>
          ))}
        </div>
      </div>

      <div className="settings-section" style={{ marginTop: '20px' }}>
        <h2>Sync Data for Deployment</h2>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>Save your current data into the source code so it persists across Render deployments. Run this before committing to Git.</p>
        <button className="btn btn-primary" onClick={async () => {
          if (!window.confirm('This will save all current data into database.js source code.\n\nAfter this, commit and push to Git for deployment.\n\nContinue?')) return;
          try {
            const res = await api.post('/data/sync-to-code');
            alert(res.data.message);
          } catch (err) { alert('Sync failed: ' + err.message); }
        }}><RefreshCw size={16} /> Sync Data to Code</button>
      </div>
    </div>
  );
};

export default SettingsPage;
