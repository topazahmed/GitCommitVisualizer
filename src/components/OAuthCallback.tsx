// OAuth callback handler component
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const Title = styled.h1`
  font-size: 28px;
  margin-bottom: 20px;
  color: #4CAF50;
`;

const Message = styled.div`
  font-size: 18px;
  margin-bottom: 20px;
  max-width: 700px;
  line-height: 1.6;
`;

const Button = styled.button`
  background: #4CAF50;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  margin: 10px;
  transition: all 0.2s;
  min-height: 44px;

  &:hover {
    background: #45a049;
    transform: translateY(-1px);
  }

  &.secondary {
    background: #666;
    
    &:hover {
      background: #777;
    }
  }
`;

const InfoBox = styled.div`
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 20px;
  border-radius: 12px;
  margin: 20px 0;
  font-size: 14px;
  line-height: 1.6;
  max-width: 600px;
  text-align: left;
`;

const StepList = styled.ol`
  text-align: left;
  margin: 10px 0;
  padding-left: 20px;
  
  li {
    margin: 8px 0;
  }
`;

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { handleCallback } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        console.log('OAuth callback received:', { 
          code: code?.substring(0, 10) + '...', 
          state: state?.substring(0, 10) + '...', 
          error, 
          errorDescription 
        });

        // Check for GitHub OAuth errors first
        if (error) {
          const errorMsg = errorDescription || error;
          console.error('GitHub OAuth error:', errorMsg);
          setStatus('error');
          return;
        }

        if (!code || !state) {
          console.error('Missing code or state parameter', { hasCode: !!code, hasState: !!state });
          setStatus('error');
          return;
        }

        // Check if we have a stored state for comparison
        const storedState = sessionStorage.getItem('oauth_state');
        console.log('State comparison:', { 
          received: state?.substring(0, 10) + '...', 
          stored: storedState?.substring(0, 10) + '...',
          match: state === storedState 
        });

        // Use the new handleCallback method from AuthContext
        await handleCallback(code, state);
        
        console.log('OAuth callback processed successfully');
        setStatus('success');

      } catch (error) {
        console.error('Callback processing error:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        setStatus('error');
      }
    };

    processCallback();
  }, [handleCallback]);

  const handleContinue = () => {
    navigate('/');
  };

  const openTokenPage = () => {
    window.open('https://github.com/settings/tokens/new?scopes=repo,read:user,user:email&description=GitCommitVisualizer', '_blank');
  };

  if (status === 'processing') {
    return (
      <Container>
        <Title>🔄 Processing Authorization...</Title>
        <Message>Please wait while we process your GitHub authorization.</Message>
      </Container>
    );
  }

  if (status === 'error') {
    return (
      <Container>
        <Title>❌ Authorization Error</Title>
        <Message>There was an error processing your GitHub authorization.</Message>
        <InfoBox>
          <strong>What happened?</strong><br />
          The GitHub OAuth flow encountered an error. This could be due to:
          <ul>
            <li>Network connectivity issues</li>
            <li>Invalid OAuth configuration</li>
            <li>Expired or invalid authorization request</li>
          </ul>
        </InfoBox>
        <Button onClick={handleContinue} className="secondary">
          Go Back to App
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      <Title>✅ GitHub Authorization Successful!</Title>
      <Message>
        Great! GitHub has authorized our application to access your repositories. 
        However, there's one more step to complete the login process.
      </Message>

      <InfoBox>
        <strong>🔐 Why do you need a Personal Access Token?</strong><br /><br />
        
        For security reasons, client-side applications (like this one) cannot safely store GitHub's client secret. 
        This means we can't exchange the authorization code for an access token directly in your browser.
        
        <br /><br />
        
        <strong>📝 Quick Setup (takes 30 seconds):</strong>
        <StepList>
          <li>Click "Generate Token" below (opens GitHub in new tab)</li>
          <li>Give your token a name like "GitCommitVisualizer"</li>
          <li>The required scopes are already pre-selected</li>
          <li>Click "Generate token" at the bottom</li>
          <li>Copy the token and paste it in our app</li>
        </StepList>
        
        The token gives you full control - you can revoke it anytime from GitHub settings.
      </InfoBox>

      <div>
        <Button onClick={openTokenPage}>
          🔗 Generate Personal Access Token
        </Button>
        <Button onClick={handleContinue} className="secondary">
          Continue to App
        </Button>
      </div>

      <InfoBox style={{ marginTop: '20px', fontSize: '12px', opacity: 0.8 }}>
        💡 <strong>Pro tip:</strong> Personal Access Tokens are actually more secure than OAuth for client-side apps 
        because you maintain full control and can easily revoke access if needed.
      </InfoBox>
    </Container>
  );
};

export default OAuthCallback;