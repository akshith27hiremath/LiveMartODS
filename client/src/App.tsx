import React, { useEffect, useState } from 'react';

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  database: {
    connected: boolean;
    status: string;
    host?: string;
    database?: string;
  };
  environment: string;
}

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then(res => res.json())
      .then(data => {
        setHealth(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '10px'
        }}>
          Live MART
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#666',
          marginBottom: '40px'
        }}>
          E-commerce Platform - Development Mode
        </p>

        {loading && (
          <div style={{ textAlign: 'center', color: '#667eea' }}>
            Loading backend status...
          </div>
        )}

        {error && (
          <div style={{
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            padding: '16px',
            color: '#c33'
          }}>
            <strong>❌ Backend Connection Error:</strong>
            <br />
            {error}
            <br />
            <small>Make sure the backend server is running on port 5000</small>
          </div>
        )}

        {health && (
          <div>
            <div style={{
              background: health.status === 'healthy' ? '#d4edda' : '#f8d7da',
              border: `1px solid ${health.status === 'healthy' ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>
                {health.status === 'healthy' ? '✅' : '❌'} Backend Status: <strong>{health.status}</strong>
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Environment: {health.environment}
              </div>
            </div>

            <div style={{
              background: health.database.connected ? '#d1ecf1' : '#f8d7da',
              border: `1px solid ${health.database.connected ? '#bee5eb' : '#f5c6cb'}`,
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                {health.database.connected ? '🗄️' : '❌'} Database Status
              </div>
              <div style={{ fontSize: '14px' }}>
                <div><strong>Status:</strong> {health.database.status}</div>
                <div><strong>Connected:</strong> {health.database.connected ? 'Yes' : 'No'}</div>
                {health.database.host && <div><strong>Host:</strong> {health.database.host}</div>}
                {health.database.database && <div><strong>Database:</strong> {health.database.database}</div>}
              </div>
            </div>

            <div style={{
              background: '#e7f3ff',
              border: '1px solid #b3d9ff',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '14px', color: '#004085' }}>
                <div><strong>⏱️ Uptime:</strong> {Math.floor(health.uptime)} seconds</div>
                <div><strong>🕐 Timestamp:</strong> {new Date(health.timestamp).toLocaleString()}</div>
              </div>
            </div>

            <div style={{
              marginTop: '30px',
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px' }}>🎯 Phase 2.1 Completed!</h3>
              <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                <li>✅ Database connection established</li>
                <li>✅ User models created (Customer, Retailer, Wholesaler)</li>
                <li>✅ Backend API running</li>
                <li>✅ Frontend connected to backend</li>
              </ul>
              <div style={{
                marginTop: '20px',
                fontSize: '14px',
                color: '#666'
              }}>
                <strong>Test the models:</strong><br />
                <a
                  href="http://localhost:5000/api/test/models"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#667eea' }}
                >
                  http://localhost:5000/api/test/models
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
