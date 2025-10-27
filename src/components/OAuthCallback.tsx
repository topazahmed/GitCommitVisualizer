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

const Message = styled.div`
  font-size: 18px;
  margin-bottom: 20px;
  max-width: 600px;
  line-height: 1.5;
`;

const Button = styled.button`
  background: #333;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  margin: 10px;
  transition: background 0.2s;
  min-height: 44px;

  &:hover {
    background: #555;
  }
`;

const InfoBox = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 16px;
  border-radius: 8px;
  margin: 20px 0;
  font-size: 14px;
  line-height: 1.5;
  max-width: 500px;
`;

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { handleCallback } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing GitHub authorization...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        console.log('OAuth callback received:', { code, state, error, errorDescription });

        // Check for errors first
        if (error) {
          const errorMsg = errorDescription || error;
          console.error('OAuth error:', errorMsg);
          setStatus('error');
          setMessage(`GitHub authentication failed: ${errorMsg}`);
          return;
        }

        if (!code || !state) {
          console.error('Missing code or state parameter');
          setStatus('error');
          setMessage('Authentication failed: Missing required parameters');
          return;
        }

        // Use the new handleCallback method from AuthContext
        await handleCallback(code, state);
        
        setStatus('success');
        setMessage('GitHub authorization received successfully!');

      } catch (error) {
        console.error('Callback processing error:', error);
        setStatus('error');
        setMessage(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    processCallback();
  }, [handleCallback]);

  const handleContinue = () => {
    navigate('/');
  };

  return (
    <Container>
      <Message>{message}</Message>
      
      {status === 'success' && (
        <>
          <InfoBox>
            <strong>Next Step: Use Personal Access Token</strong>
            <br /><br />
            For security in client-side applications, we recommend using Personal Access Tokens:
            <br /><br />
            1. Go to GitHub Settings → Developer settings → Personal access tokens
            <br />
            2. Click "Generate new token (classic)"
            <br />
            3. Select scopes: <code>repo</code>, <code>read:user</code>, <code>user:email</code>
            <br />
            4. Copy the token and paste it in the app
          </InfoBox>
          <Button onClick={handleContinue}>
            Continue to App
          </Button>
        </>
      )}
      
      {status === 'error' && (
        <Button onClick={handleContinue}>
          Back to App
        </Button>
      )}
      
      {status === 'processing' && (
        <div>⏳ Please wait...</div>
      )}
    </Container>
  );
};

export default OAuthCallback;