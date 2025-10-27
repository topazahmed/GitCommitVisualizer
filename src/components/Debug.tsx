// Debug component to check environment variables
import React from 'react';

export const Debug: React.FC = () => {
  const clientId = process.env.REACT_APP_GITHUB_CLIENT_ID;
  const hasClientSecret = !!process.env.REACT_APP_GITHUB_CLIENT_SECRET;

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      background: '#f6f8fa', 
      padding: '10px', 
      borderRadius: '6px',
      border: '1px solid #d0d7de',
      fontSize: '12px',
      zIndex: 1000
    }}>
      <div>Client ID: {clientId ? '✅ Set' : '❌ Missing'}</div>
      <div>Client Secret: {hasClientSecret ? '✅ Set' : '❌ Missing'}</div>
      {clientId && <div>ID: {clientId.substring(0, 8)}...</div>}
    </div>
  );
};