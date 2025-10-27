import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ApiProvider, useApi } from './contexts/ApiContext';
import { LoginPage, UserProfile } from './components/Auth';
import OAuthCallback from './components/OAuthCallback';
import { RepositorySelector } from './components/RepositorySelector';
import { ResponsiveNetworkView } from './components/ResponsiveNetworkView';
import { AuthDebug } from './components/AuthDebug';
import { Repository, NetworkData } from './services/GitHubApiClient';

const AppContainer = styled.div`
  min-height: 100vh;
  background: #ffffff;
`;

const Header = styled.header`
  background: #24292f;
  color: white;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

const Logo = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const Main = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  font-size: 16px;
  color: #656d76;
`;

const ErrorMessage = styled.div`
  background: #ffebee;
  color: #cf222e;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #ffcdd2;
  margin-bottom: 20px;
  text-align: center;
`;

const SelectedRepoHeader = styled.div`
  background: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #d0d7de;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
`;

const RepoInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const RepoAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
`;

const RepoDetails = styled.div``;

const RepoName = styled.h2`
  margin: 0;
  font-size: 18px;
  color: #24292f;
`;

const RepoDescription = styled.p`
  margin: 4px 0 0 0;
  color: #656d76;
  font-size: 14px;
`;

const BackButton = styled.button`
  background: white;
  color: #24292f;
  border: 1px solid #d0d7de;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
  }
`;

const MainApp: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { apiClient } = useApi();
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null);
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug logging
  console.log('MainApp: Auth state:', { user: !!user, authLoading, userLogin: user?.login });

  const handleSelectRepository = async (repo: Repository) => {
    if (!apiClient) return;

    setSelectedRepository(repo);
    setLoading(true);
    setError(null);
    setNetworkData(null);

    try {
      const data = await apiClient.getNetworkData(repo.owner.login, repo.name);
      setNetworkData(data);
    } catch (err) {
      setError(`Failed to load network data for ${repo.full_name}. Please try again.`);
      console.error('Error fetching network data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedRepository(null);
    setNetworkData(null);
    setError(null);
  };

  if (authLoading) {
    return (
      <AppContainer>
        <LoadingSpinner>Loading...</LoadingSpinner>
      </AppContainer>
    );
  }

  if (!user) {
    return (
      <AppContainer>
        <LoginPage />
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <Header>
        <Logo>GitHub Network Visualizer</Logo>
        <UserProfile />
      </Header>
      
      <Main>
        {selectedRepository && (
          <SelectedRepoHeader>
            <RepoInfo>
              <RepoAvatar 
                src={selectedRepository.owner.avatar_url} 
                alt={selectedRepository.owner.login} 
              />
              <RepoDetails>
                <RepoName>{selectedRepository.full_name}</RepoName>
                {selectedRepository.description && (
                  <RepoDescription>{selectedRepository.description}</RepoDescription>
                )}
              </RepoDetails>
            </RepoInfo>
            <BackButton onClick={handleBack}>
              ← Back to repositories
            </BackButton>
          </SelectedRepoHeader>
        )}

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {!selectedRepository ? (
          <RepositorySelector
            onSelectRepository={handleSelectRepository}
            selectedRepository={selectedRepository || undefined}
          />
        ) : loading ? (
          <LoadingSpinner>Loading network data...</LoadingSpinner>
        ) : networkData ? (
          <ResponsiveNetworkView networkData={networkData} />
        ) : null}
      </Main>
    </AppContainer>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ApiProvider>
          <AuthDebug />
          <Routes>
            <Route path="/callback" element={<OAuthCallback />} />
            <Route path="/" element={<MainApp />} />
          </Routes>
        </ApiProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
