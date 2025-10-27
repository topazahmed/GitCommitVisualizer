// Authentication context for managing GitHub OAuth state
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Octokit } from '@octokit/rest';

interface User {
  login: string;
  name: string;
  avatar_url: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  octokit: Octokit | null;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setOctokit: (octokit: Octokit | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [octokit, setOctokit] = useState<Octokit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Checking authentication state...');
    // Check if user is already authenticated
    const token = localStorage.getItem('github_token');
    console.log('AuthProvider: Token found:', !!token);
    console.log('AuthProvider: Token value:', token ? token.substring(0, 10) + '...' : 'null');
    
    if (token) {
      console.log('AuthProvider: Creating Octokit instance...');
      const octokitInstance = new Octokit({ auth: token });
      setOctokit(octokitInstance);
      
      // Fetch user data
      console.log('AuthProvider: Fetching user data...');
      octokitInstance.rest.users.getAuthenticated()
        .then(response => {
          console.log('AuthProvider: User data received:', response.data.login);
          setUser(response.data as User);
        })
        .catch((error) => {
          console.error('AuthProvider: Error fetching user data:', error);
          // Token might be invalid, remove it
          localStorage.removeItem('github_token');
        })
        .finally(() => {
          console.log('AuthProvider: Setting isLoading to false');
          setIsLoading(false);
        });
    } else {
      console.log('AuthProvider: No token found, setting isLoading to false');
      setIsLoading(false);
    }
  }, []);

  const login = () => {
    const clientId = process.env.REACT_APP_GITHUB_CLIENT_ID;
    console.log('Starting GitHub OAuth login...');
    console.log('Client ID:', clientId ? 'Configured' : 'Missing');
    console.log('Raw Client ID:', clientId);
    
    if (!clientId) {
      console.error('GitHub Client ID not configured');
      alert('GitHub Client ID not configured. Please check your .env file.');
      return;
    }

    // Use GitHub's Device Flow for client-side authentication
    // This is the recommended approach for desktop/mobile apps
    initiateDeviceFlow(clientId);
  };

  const initiateDeviceFlow = async (clientId: string) => {
    try {
      console.log('Starting GitHub Device Flow...');
      
      // Step 1: Request device and user codes
      const deviceResponse = await fetch('https://github.com/login/device/code', {
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

      if (!deviceResponse.ok) {
        throw new Error(`Device flow request failed: ${deviceResponse.status}`);
      }

      const deviceData = await deviceResponse.json();
      console.log('Device flow data:', deviceData);

      // Step 2: Show user the verification URL and code
      const userCode = deviceData.user_code;
      const verificationUri = deviceData.verification_uri;
      const deviceCode = deviceData.device_code;
      const interval = deviceData.interval || 5;

      // Open GitHub authorization page
      window.open(verificationUri, '_blank');
      
      // Show user the code they need to enter
      alert(`Please enter this code on GitHub: ${userCode}\n\nThe authorization page should have opened in a new tab.`);

      // Step 3: Poll for authorization
      pollForAuthorization(clientId, deviceCode, interval);

    } catch (error) {
      console.error('Device flow error:', error);
      alert('Failed to start GitHub authentication. Please try again.');
    }
  };

  const pollForAuthorization = async (clientId: string, deviceCode: string, interval: number) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        alert('Authorization timed out. Please try again.');
        return;
      }

      attempts++;

      try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
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

        const tokenData = await tokenResponse.json();
        console.log('Token response:', tokenData);

        if (tokenData.access_token) {
          // Success! Store the token
          localStorage.setItem('github_token', tokenData.access_token);
          
          // Initialize auth state
          const octokitInstance = new Octokit({ auth: tokenData.access_token });
          setOctokit(octokitInstance);
          
          try {
            const userResponse = await octokitInstance.rest.users.getAuthenticated();
            setUser(userResponse.data as User);
            console.log('Successfully authenticated user:', userResponse.data.login);
          } catch (userError) {
            console.error('Error fetching user data:', userError);
            alert('Authentication successful but failed to fetch user data.');
          }
          
          return; // Stop polling
        } else if (tokenData.error === 'authorization_pending') {
          // User hasn't authorized yet, continue polling
          setTimeout(poll, interval * 1000);
        } else if (tokenData.error === 'slow_down') {
          // Rate limited, increase interval
          setTimeout(poll, (interval + 5) * 1000);
        } else if (tokenData.error === 'expired_token') {
          alert('Authorization code expired. Please try logging in again.');
          return;
        } else if (tokenData.error === 'access_denied') {
          alert('Authorization denied. Please try logging in again.');
          return;
        } else {
          console.error('Unexpected token response:', tokenData);
          alert('Unexpected response from GitHub. Please try again.');
          return;
        }
      } catch (error) {
        console.error('Polling error:', error);
        setTimeout(poll, interval * 1000);
      }
    };

    poll();
  };

  const logout = () => {
    localStorage.removeItem('github_token');
    localStorage.removeItem('oauth_state');
    setUser(null);
    setOctokit(null);
  };

  const value: AuthContextType = {
    user,
    octokit,
    login,
    logout,
    isLoading,
    setUser,
    setOctokit,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};