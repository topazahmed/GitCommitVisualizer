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
  handleCallback: (code: string, state: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
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
    
    if (!clientId) {
      console.error('GitHub Client ID not configured');
      alert('GitHub Client ID not configured. Please check your environment variables.');
      return;
    }

    // Use GitHub's standard OAuth Web Application Flow
    // This redirects to GitHub and back to our callback
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const scope = 'repo read:user user:email';
    const state = generateRandomState(); // Generate a random state for security
    
    // Store state in sessionStorage for verification
    sessionStorage.setItem('oauth_state', state);
    
    const authUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${encodeURIComponent(state)}`;
    
    console.log('Redirecting to:', authUrl);
    window.location.href = authUrl;
  };

  const generateRandomState = (): string => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };

  // Handle OAuth callback with authorization code
  const handleCallback = async (code: string, state: string) => {
    console.log('Handling OAuth callback...');
    console.log('Received code:', code.substring(0, 10) + '...');
    console.log('Received state:', state.substring(0, 10) + '...');
    
    // Verify state parameter for security
    const storedState = sessionStorage.getItem('oauth_state');
    console.log('Stored state:', storedState?.substring(0, 10) + '...');
    
    if (!storedState) {
      console.warn('No stored state found - this might be due to page refresh or session loss');
      // Don't throw error for missing stored state, as it might be a legitimate case
    } else if (state !== storedState) {
      console.error('State parameter mismatch - potential security issue');
      console.error('Expected:', storedState);
      console.error('Received:', state);
      throw new Error('Invalid state parameter - potential CSRF attack');
    }
    
    // Clear the stored state
    sessionStorage.removeItem('oauth_state');
    
    // Store that OAuth authorization was successful
    sessionStorage.setItem('oauth_authorized', 'true');
    sessionStorage.setItem('authorization_code', code);
    
    console.log('Authorization code stored successfully');
    
    // Don't redirect immediately - let the OAuthCallback component handle the user experience
  };

  // Login with personal access token
  const loginWithToken = async (token: string): Promise<void> => {
    if (!token.trim()) {
      throw new Error('Token is required');
    }

    setIsLoading(true);
    
    try {
      // Test the token by creating Octokit instance and fetching user
      const octokitInstance = new Octokit({ auth: token.trim() });
      const response = await octokitInstance.rest.users.getAuthenticated();
      
      // If we get here, the token is valid
      localStorage.setItem('github_token', token.trim());
      setOctokit(octokitInstance);
      setUser(response.data as User);
      
      console.log('Successfully authenticated with token:', response.data.login);
    } catch (error) {
      console.error('Token authentication failed:', error);
      throw new Error('Invalid GitHub token. Please check your token and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('github_token');
    sessionStorage.removeItem('oauth_state');
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
    handleCallback,
    loginWithToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};