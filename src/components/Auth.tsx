// Authentication components for login/logout UI
import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

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

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }

  @media (max-width: 480px) {
    font-size: 1.75rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  max-width: 600px;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }

  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const AuthOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 500px;
  width: 100%;
`;

const TokenSection = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
`;

const TokenInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  margin-bottom: 1rem;
  min-height: 44px;
  box-sizing: border-box;

  &:focus {
    outline: 2px solid #0969da;
    outline-offset: 2px;
    border-color: #0969da;
  }

  &::placeholder {
    color: #666;
  }
`;

const Button = styled.button`
  background: #333;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 44px;
  min-width: 120px;

  &:hover {
    background: #555;
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  opacity: 0.7;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.3);
  }
`;

const OAuthSection = styled.div`
  text-align: center;
`;

const HelpText = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
  margin-top: 1rem;
  line-height: 1.5;
`;

const Link = styled.a`
  color: #fff;
  text-decoration: underline;
  
  &:hover {
    opacity: 0.8;
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
  const { login, loginWithToken } = useAuth();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      alert('Please enter a valid GitHub Personal Access Token');
      return;
    }

    setLoading(true);
    
    try {
      await loginWithToken(token);
      // Success - user will be redirected by the auth context
    } catch (error) {
      console.error('Token authentication failed:', error);
      alert(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = () => {
    login();
  };

  return (
    <LoginContainer>
      <Title>🌐 GitHub Network Visualizer</Title>
      <Subtitle>
        Visualize and explore Git repository networks, commits, and contributor relationships
      </Subtitle>

      <AuthOptions>
        <TokenSection>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>
            🔑 Personal Access Token (Recommended)
          </h3>
          <form onSubmit={handleTokenSubmit}>
            <TokenInput
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !token.trim()}>
              {loading ? '🔄 Authenticating...' : '🚀 Login with Token'}
            </Button>
          </form>
          <HelpText>
            Create a token at{' '}
            <Link 
              href="https://github.com/settings/tokens/new" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              GitHub Settings
            </Link>
            <br />
            Required scopes: <code>repo</code>, <code>read:user</code>, <code>user:email</code>
          </HelpText>
        </TokenSection>

        <OrDivider>
          <span>OR</span>
        </OrDivider>

        <OAuthSection>
          <h3 style={{ marginBottom: '1rem' }}>🔗 OAuth Login</h3>
          <Button onClick={handleOAuthLogin}>
            Login with GitHub OAuth
          </Button>
          <HelpText>
            Uses GitHub's standard OAuth flow. You'll be redirected to GitHub to authorize the app.
          </HelpText>
        </OAuthSection>
      </AuthOptions>
    </LoginContainer>
  );
};

export const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <UserInfo>
      <Avatar src={user.avatar_url} alt={user.login} />
      <span>{user.name || user.login}</span>
      <LogoutButton onClick={logout}>Logout</LogoutButton>
    </UserInfo>
  );
};