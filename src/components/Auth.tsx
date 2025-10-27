// Authentication components for login/logout UI
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { TokenInput } from './TokenInput';
import { DeviceFlow } from './DeviceFlow';
import { Octokit } from '@octokit/rest';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 16px;
  }

  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const LoginButton = styled.button`
  background: #333;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
  transition: background 0.2s;
  min-height: 44px; /* Touch-friendly */
  min-width: 120px;

  &:hover {
    background: #555;
  }

  @media (max-width: 768px) {
    padding: 14px 20px;
    font-size: 16px;
    width: 100%;
    max-width: 300px;
  }

  @media (max-width: 480px) {
    padding: 12px 16px;
    font-size: 15px;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f6f8fa;
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #d0d7de;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    text-align: center;
    order: 2;
  }

  @media (max-width: 480px) {
    padding: 10px;
    gap: 6px;
  }
`;

const Avatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;

  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
  }
`;

const LogoutButton = styled.button`
  background: #da3633;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #b91c1c;
  }
`;

export const LoginPage: React.FC = () => {
  const { setUser, setOctokit } = useAuth();
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [deviceFlowData, setDeviceFlowData] = useState<any>(null);

  // Check if we should use device flow (e.g., after CORS failure)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('use_device_flow') === 'true') {
      initiateDeviceFlow();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const initiateDeviceFlow = async () => {
    const clientId = process.env.REACT_APP_GITHUB_CLIENT_ID;
    
    if (!clientId) {
      alert('GitHub Client ID not configured. Please check your .env file.');
      return;
    }

    try {
      console.log('Starting GitHub Device Flow...');
      
      const response = await fetch('https://github.com/login/device/code', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          scope: 'repo read:user user:email'
        }),
      });

      if (!response.ok) {
        throw new Error(`Device flow request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Device flow initiated successfully:', data);
      setDeviceFlowData(data);

    } catch (error) {
      console.error('Device flow error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to start device flow authentication: ${errorMessage}`);
    }
  };

  if (showTokenInput) {
    return <TokenInput onBack={() => setShowTokenInput(false)} />;
  }

  if (deviceFlowData) {
    return (
      <DeviceFlow
        userCode={deviceFlowData.user_code}
        verificationUri={deviceFlowData.verification_uri}
        deviceCode={deviceFlowData.device_code}
        clientId={process.env.REACT_APP_GITHUB_CLIENT_ID || ''}
        interval={deviceFlowData.interval || 5}
        onCancel={() => setDeviceFlowData(null)}
        onSuccess={async (token: string) => {
          localStorage.setItem('github_token', token);
          
          // Initialize auth state
          const octokitInstance = new Octokit({ auth: token });
          setOctokit(octokitInstance);
          
          try {
            const userResponse = await octokitInstance.rest.users.getAuthenticated();
            setUser(userResponse.data as any);
            console.log('Successfully authenticated user:', userResponse.data.login);
          } catch (error) {
            console.error('Error fetching user data:', error);
            alert('Authentication successful but failed to fetch user data.');
          }
        }}
      />
    );
  }

  const handleLogin = () => {
    const clientId = process.env.REACT_APP_GITHUB_CLIENT_ID;
    
    if (!clientId) {
      alert('GitHub Client ID not configured. Please check your .env file.');
      return;
    }

    // Use standard OAuth flow with redirect
    const scope = 'repo read:user user:email';
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('oauth_state', state);
    
    const redirectUri = `${window.location.origin}/callback`;
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope}&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    console.log('Redirecting to GitHub OAuth:', authUrl);
    
    // Direct redirect - this is the standard way
    window.location.href = authUrl;
  };

  return (
    <LoginContainer>
      <h1>GitHub Network Visualizer</h1>
      <p>Visualize repository networks and commit graphs</p>
      <p>Connect with GitHub to access your repositories</p>
      
      <LoginButton onClick={handleLogin}>
        Sign in with GitHub
      </LoginButton>
      
      <p style={{ 
        marginTop: '16px', 
        fontSize: '14px', 
        color: '#586069',
        textAlign: 'center'
      }}>
        <button
          onClick={initiateDeviceFlow}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#0366d6', 
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '14px'
          }}
        >
          Try Device Flow
        </button>
        {' '} or {' '}
        <button
          onClick={() => setShowTokenInput(true)}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#0366d6', 
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '14px'
          }}
        >
          use a Personal Access Token
        </button>
      </p>
    </LoginContainer>
  );
};

export const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <UserInfo>
      <Avatar src={user.avatar_url} alt={user.name || user.login} />
      <span>{user.name || user.login}</span>
      <LogoutButton onClick={logout}>Logout</LogoutButton>
    </UserInfo>
  );
};