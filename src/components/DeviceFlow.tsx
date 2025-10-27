// Device flow authentication component
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 20px;
`;

const Card = styled.div`
  background: white;
  color: #24292f;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
`;

const Title = styled.h2`
  margin: 0 0 20px 0;
  color: #24292f;
`;

const Code = styled.div`
  background: #f6f8fa;
  border: 2px solid #0969da;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 4px;
  color: #0969da;
`;

const Instructions = styled.div`
  margin: 20px 0;
  line-height: 1.6;
  
  ol {
    text-align: left;
    padding-left: 20px;
  }
  
  li {
    margin-bottom: 8px;
  }
`;

const Button = styled.button`
  background: #0969da;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  margin: 10px;
  transition: background 0.2s;

  &:hover {
    background: #0860ca;
  }
`;

const SecondaryButton = styled(Button)`
  background: #6e7781;
  
  &:hover {
    background: #656d76;
  }
`;

const Spinner = styled.div`
  border: 3px solid #f3f3f3;
  border-top: 3px solid #0969da;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: ${spin} 1s linear infinite;
  margin: 20px auto;
`;

const Status = styled.div`
  margin: 20px 0;
  font-size: 16px;
  color: #656d76;
`;

interface DeviceFlowProps {
  userCode: string;
  verificationUri: string;
  onCancel: () => void;
  onSuccess: (token: string) => void;
  deviceCode: string;
  clientId: string;
  interval: number;
}

export const DeviceFlow: React.FC<DeviceFlowProps> = ({
  userCode,
  verificationUri,
  onCancel,
  onSuccess,
  deviceCode,
  clientId,
  interval
}) => {
  const [status, setStatus] = useState<'waiting' | 'checking' | 'error'>('waiting');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 60; // 5 minutes

  useEffect(() => {
    // Start polling for authorization
    const pollForToken = async () => {
      if (attempts >= maxAttempts) {
        setStatus('error');
        return;
      }

      try {
        setStatus('checking');
        
        const response = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            device_code: deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
          }),
        });

        const data = await response.json();
        
        if (data.access_token) {
          onSuccess(data.access_token);
          return;
        } else if (data.error === 'authorization_pending') {
          setStatus('waiting');
          setAttempts(prev => prev + 1);
          setTimeout(pollForToken, interval * 1000);
        } else if (data.error === 'slow_down') {
          setStatus('waiting');
          setTimeout(pollForToken, (interval + 5) * 1000);
        } else if (data.error === 'expired_token' || data.error === 'access_denied') {
          setStatus('error');
          return;
        } else {
          setTimeout(pollForToken, interval * 1000);
        }
      } catch (error) {
        console.error('Polling error:', error);
        setAttempts(prev => prev + 1);
        setTimeout(pollForToken, interval * 1000);
      }
    };

    const timer = setTimeout(pollForToken, 2000); // Start after 2 seconds
    return () => clearTimeout(timer);
  }, [attempts, deviceCode, clientId, interval, maxAttempts, onSuccess]);

  const openGitHub = () => {
    window.open(verificationUri, '_blank');
  };

  return (
    <Container>
      <Card>
        <Title>🔐 GitHub Authentication</Title>
        
        <Instructions>
          <p><strong>Please follow these steps to sign in:</strong></p>
          <ol>
            <li>Click the button below to open GitHub</li>
            <li>Enter this code when prompted:</li>
          </ol>
        </Instructions>
        
        <Code>{userCode}</Code>
        
        <Button onClick={openGitHub}>
          Open GitHub Authorization Page
        </Button>
        
        {status === 'waiting' && (
          <Status>
            <Spinner />
            Waiting for you to authorize on GitHub...
            <br />
            <small>Attempt {attempts + 1} of {maxAttempts}</small>
          </Status>
        )}
        
        {status === 'checking' && (
          <Status>
            <Spinner />
            Checking authorization status...
          </Status>
        )}
        
        {status === 'error' && (
          <Status style={{ color: '#d73a49' }}>
            ❌ Authorization failed or timed out.
            <br />
            Please try again.
          </Status>
        )}
        
        <SecondaryButton onClick={onCancel}>
          Cancel
        </SecondaryButton>
      </Card>
    </Container>
  );
};