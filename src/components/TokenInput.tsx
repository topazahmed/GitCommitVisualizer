// Temporary solution: Manual token input for development
import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const Form = styled.div`
  background: white;
  color: #24292f;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 100%;
`;

const Title = styled.h2`
  margin: 0 0 20px 0;
  text-align: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
`;

const Button = styled.button`
  width: 100%;
  background: #0969da;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  
  &:hover {
    background: #0860ca;
  }
  
  &:disabled {
    background: #8b949e;
    cursor: not-allowed;
  }
`;

const Instructions = styled.div`
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.5;
  
  ol {
    padding-left: 20px;
  }
  
  li {
    margin-bottom: 8px;
  }
  
  code {
    background: #f6f8fa;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: monospace;
  }
`;

const BackButton = styled.button`
  background: none;
  color: #0969da;
  border: 1px solid #0969da;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 20px;
  
  &:hover {
    background: #f6f8fa;
  }
`;

interface TokenInputProps {
  onBack: () => void;
}

export const TokenInput: React.FC<TokenInputProps> = ({ onBack }) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();

  const handleSubmit = async () => {
    if (!token.trim()) return;
    
    setLoading(true);
    try {
      // Test the token by making a request to GitHub API
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (response.ok) {
        // Token is valid, store it
        localStorage.setItem('github_token', token);
        localStorage.removeItem('oauth_state');
        window.location.href = '/';
      } else {
        alert('Invalid token. Please check your personal access token.');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      alert('Error validating token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Form>
        <BackButton onClick={onBack}>← Back to OAuth</BackButton>
        
        <Title>Manual Token Setup</Title>
        
        <Instructions>
          <p><strong>Since OAuth requires a backend server, you can use a Personal Access Token for development:</strong></p>
          <ol>
            <li>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">GitHub Settings → Developer settings → Personal access tokens</a></li>
            <li>Click "Generate new token (classic)"</li>
            <li>Give it a name like "GitHub Network Visualizer"</li>
            <li>Select these scopes: <code>repo</code>, <code>read:user</code>, <code>user:email</code></li>
            <li>Click "Generate token"</li>
            <li>Copy the token and paste it below</li>
          </ol>
        </Instructions>
        
        <Input
          type="password"
          placeholder="Paste your GitHub Personal Access Token here"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        
        <Button 
          onClick={handleSubmit} 
          disabled={!token.trim() || loading}
        >
          {loading ? 'Validating...' : 'Use Token'}
        </Button>
      </Form>
    </Container>
  );
};