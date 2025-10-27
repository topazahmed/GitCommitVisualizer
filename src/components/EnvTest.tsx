// Environment verification component
import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  margin: 20px 0;
  padding: 20px;
  border: 2px solid #e1e4e8;
  border-radius: 8px;
  background: #f6f8fa;
`;

const Title = styled.h3`
  margin: 0 0 16px 0;
  color: #24292f;
`;

const EnvCheck = styled.div<{ valid: boolean }>`
  padding: 8px 12px;
  margin: 8px 0;
  border-radius: 4px;
  background: ${props => props.valid ? '#d4edda' : '#f8d7da'};
  color: ${props => props.valid ? '#155724' : '#721c24'};
  border: 1px solid ${props => props.valid ? '#c3e6cb' : '#f5c6cb'};
`;

const TestButton = styled.button`
  background: #0969da;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  margin-top: 12px;
  cursor: pointer;
  
  &:hover {
    background: #0860ca;
  }
`;

export const EnvTest: React.FC = () => {
  const clientId = process.env.REACT_APP_GITHUB_CLIENT_ID;
  const clientSecret = process.env.REACT_APP_GITHUB_CLIENT_SECRET;
  
  const testOAuthUrl = () => {
    if (!clientId) {
      alert('Client ID is missing!');
      return;
    }
    
    const testUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo&redirect_uri=http://localhost:3000/callback`;
    console.log('Test URL:', testUrl);
    alert(`Test URL generated: ${testUrl}\n\nCheck console for full URL. If this looks correct, your OAuth app should work.`);
  };

  return (
    <Container>
      <Title>🔧 Environment Configuration Check</Title>
      
      <EnvCheck valid={!!clientId && clientId !== 'your_github_client_id_here'}>
        Client ID: {clientId ? 
          (clientId === 'your_github_client_id_here' ? '❌ Placeholder value' : `✅ ${clientId.substring(0, 8)}...`) 
          : '❌ Missing'}
      </EnvCheck>
      
      <EnvCheck valid={!!clientSecret && clientSecret !== 'your_github_client_secret_here'}>
        Client Secret: {clientSecret ? 
          (clientSecret === 'your_github_client_secret_here' ? '❌ Placeholder value' : '✅ Configured') 
          : '❌ Missing'}
      </EnvCheck>
      
      <TestButton onClick={testOAuthUrl}>
        Test OAuth URL Generation
      </TestButton>
      
      <div style={{ marginTop: '12px', fontSize: '14px', color: '#656d76' }}>
        If you see placeholder values, edit the .env file with your actual GitHub OAuth credentials.
      </div>
    </Container>
  );
};