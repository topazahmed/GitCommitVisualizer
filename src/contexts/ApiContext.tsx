// API context for managing GitHub API client
import React, { createContext, useContext, ReactNode } from 'react';
import { GitHubApiClient } from '../services/GitHubApiClient';
import { useAuth } from './AuthContext';

interface ApiContextType {
  apiClient: GitHubApiClient | null;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const useApi = () => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

interface ApiProviderProps {
  children: ReactNode;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({ children }) => {
  const { octokit } = useAuth();

  const apiClient = octokit ? new GitHubApiClient(octokit) : null;

  const value: ApiContextType = {
    apiClient,
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};