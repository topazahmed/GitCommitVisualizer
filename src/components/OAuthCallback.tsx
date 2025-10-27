// OAuth callback handler component
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setOctokit } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        console.log('OAuth callback received:', { code, state, error, errorDescription });

        // Check for errors first
        if (error) {
          const message = errorDescription || error;
          console.error('OAuth error:', message);
          alert(`GitHub authentication failed: ${message}`);
          navigate('/');
          return;
        }

        // Verify state matches
        const savedState = localStorage.getItem('oauth_state');
        if (state !== savedState) {
          console.error('State mismatch - possible CSRF attack');
          alert('Authentication failed: Invalid state parameter');
          navigate('/');
          return;
        }

        if (!code) {
          console.error('No authorization code received');
          alert('Authentication failed: No authorization code received');
          navigate('/');
          return;
        }

        console.log('Exchanging authorization code for access token...');

        // Exchange authorization code for access token
        // We'll use a proxy service or GitHub's CORS-enabled endpoint
        const clientId = process.env.REACT_APP_GITHUB_CLIENT_ID;
        const clientSecret = process.env.REACT_APP_GITHUB_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          throw new Error('GitHub OAuth credentials not configured');
        }

        // Option 1: Try GitHub's CORS-enabled endpoint (if available)
        // Option 2: Use a public CORS proxy (not recommended for production)
        // Option 3: Use GitHub's device flow (which we already implemented)
        
        // For now, let's try the GitHub API directly with a CORS workaround
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            state: state,
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error(`Token exchange failed: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();
        console.log('Token exchange response:', tokenData);

        if (tokenData.access_token) {
          // Store the token and initialize auth
          localStorage.setItem('github_token', tokenData.access_token);
          localStorage.removeItem('oauth_state');

          // Initialize Octokit and get user data
          const { Octokit } = await import('@octokit/rest');
          const octokitInstance = new Octokit({ auth: tokenData.access_token });
          setOctokit(octokitInstance);

          const userResponse = await octokitInstance.rest.users.getAuthenticated();
          setUser(userResponse.data as any);

          console.log('Successfully authenticated user:', userResponse.data.login);
          navigate('/');
        } else {
          throw new Error('No access token received from GitHub');
        }

      } catch (error) {
        console.error('OAuth callback error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // If the standard OAuth flow fails due to CORS, suggest alternatives
        if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
          alert('OAuth flow blocked by CORS policy. Redirecting to device flow authentication...');
          // Redirect back to login with device flow
          navigate('/?use_device_flow=true');
        } else {
          alert(`Authentication failed: ${errorMessage}`);
          navigate('/');
        }
      }
    };

    handleCallback();
  }, [navigate, setUser, setOctokit]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Processing GitHub Authentication...</h2>
        <p>Please wait while we complete the login process.</p>
        <div style={{ 
          margin: '20px auto',
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #0366d6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default OAuthCallback;