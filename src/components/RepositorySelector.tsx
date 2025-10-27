// Repository selection component
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Repository } from '../services/GitHubApiClient';
import { useApi } from '../contexts/ApiContext';

const Container = styled.div`
  margin-bottom: 24px;
`;

const SearchContainer = styled.div`
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  font-size: 16px;
  background: white;
  min-height: 44px; /* Touch-friendly */
  
  &:focus {
    outline: 2px solid #0969da;
    outline-offset: 2px;
    border-color: #0969da;
  }

  @media (max-width: 768px) {
    padding: 14px 16px;
  }

  @media (max-width: 480px) {
    padding: 12px 14px;
    font-size: 16px; /* Prevent zoom on iOS */
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 8px;
  }

  @media (max-width: 480px) {
    gap: 6px;
  }
`;

const FilterButton = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  border: 1px solid ${props => props.active ? '#0969da' : '#d0d7de'};
  background: ${props => props.active ? '#0969da' : 'white'};
  color: ${props => props.active ? 'white' : '#24292f'};
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  min-height: 44px; /* Touch-friendly */
  white-space: nowrap;

  &:hover {
    background: ${props => props.active ? '#0860ca' : '#f3f4f6'};
  }

  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 14px;
  }

  @media (max-width: 480px) {
    padding: 8px 12px;
    font-size: 13px;
    flex: 1;
    min-width: 0;
  }
`;

const RepositoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  @media (max-width: 480px) {
    gap: 10px;
  }
`;

const RepositoryCard = styled.div`
  border: 1px solid #d0d7de;
  border-radius: 6px;
  padding: 16px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #0969da;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 14px;
  }

  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const RepoHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;

  @media (max-width: 480px) {
    gap: 10px;
  }
`;

const RepoAvatar = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;

  @media (max-width: 480px) {
    width: 18px;
    height: 18px;
  }
`;

const RepoName = styled.h3`
  margin: 0;
  font-size: 16px;
  color: #0969da;
  font-weight: 600;
  word-break: break-word;
  overflow-wrap: break-word;

  @media (max-width: 768px) {
    font-size: 15px;
  }

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const RepoDescription = styled.p`
  margin: 8px 0;
  color: #656d76;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
  overflow-wrap: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (max-width: 768px) {
    font-size: 13px;
    -webkit-line-clamp: 2;
  }

  @media (max-width: 480px) {
    font-size: 12px;
    margin: 6px 0;
  }
`;

const RepoMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #656d76;
  margin-top: 12px;

  @media (max-width: 768px) {
    gap: 12px;
  }

  @media (max-width: 480px) {
    gap: 8px;
    font-size: 11px;
    margin-top: 8px;
  }
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  font-size: 16px;
  color: #656d76;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #656d76;
`;

interface RepositorySelectorProps {
  onSelectRepository: (repo: Repository) => void;
  selectedRepository?: Repository;
}

export const RepositorySelector: React.FC<RepositorySelectorProps> = ({
  onSelectRepository,
  selectedRepository,
}) => {
  const { apiClient } = useApi();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'own' | 'forks'>('all');

  useEffect(() => {
    const loadRepositories = async () => {
      if (!apiClient) return;

      try {
        setLoading(true);
        setError(null);
        const repos = await apiClient.getUserRepositories(1, 100);
        setRepositories(repos);
      } catch (err) {
        setError('Failed to load repositories. Please try again.');
        console.error('Error loading repositories:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRepositories();
  }, [apiClient]);

  useEffect(() => {
    let filtered = repositories;

    // Apply filter
    if (filter === 'own') {
      filtered = filtered.filter(repo => !repo.fork);
    } else if (filter === 'forks') {
      filtered = filtered.filter(repo => repo.fork);
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(repo =>
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repo.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredRepos(filtered);
  }, [repositories, searchTerm, filter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner>Loading repositories...</LoadingSpinner>;
  }

  if (error) {
    return (
      <Container>
        <EmptyState>
          <p>{error}</p>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="Search repositories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchContainer>

      <FilterContainer>
        <FilterButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          All ({repositories.length})
        </FilterButton>
        <FilterButton
          active={filter === 'own'}
          onClick={() => setFilter('own')}
        >
          Own ({repositories.filter(r => !r.fork).length})
        </FilterButton>
        <FilterButton
          active={filter === 'forks'}
          onClick={() => setFilter('forks')}
        >
          Forks ({repositories.filter(r => r.fork).length})
        </FilterButton>
      </FilterContainer>

      {filteredRepos.length === 0 ? (
        <EmptyState>
          <p>No repositories found matching your criteria.</p>
        </EmptyState>
      ) : (
        <RepositoryGrid>
          {filteredRepos.map((repo) => (
            <RepositoryCard
              key={repo.id}
              onClick={() => onSelectRepository(repo)}
            >
              <RepoHeader>
                <RepoAvatar
                  src={repo.owner.avatar_url}
                  alt={repo.owner.login}
                />
                <RepoName>{repo.name}</RepoName>
              </RepoHeader>
              
              {repo.description && (
                <RepoDescription>{repo.description}</RepoDescription>
              )}
              
              <RepoMeta>
                <MetaItem>
                  ⭐ {repo.stargazers_count}
                </MetaItem>
                <MetaItem>
                  🍴 {repo.forks_count}
                </MetaItem>
                <MetaItem>
                  📅 {formatDate(repo.updated_at)}
                </MetaItem>
                {repo.fork && (
                  <MetaItem>
                    🔗 Fork
                  </MetaItem>
                )}
              </RepoMeta>
            </RepositoryCard>
          ))}
        </RepositoryGrid>
      )}
    </Container>
  );
};