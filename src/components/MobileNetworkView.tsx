// Mobile-friendly network view component
import React, { useState } from 'react';
import styled from 'styled-components';
import { NetworkData, Commit, Branch } from '../services/GitHubApiClient';

const MobileContainer = styled.div`
  width: 100%;
  max-height: 600px;
  overflow-y: auto;
  border: 1px solid #d0d7de;
  border-radius: 6px;
`;

const BranchSelector = styled.div`
  display: flex;
  gap: 8px;
  padding: 16px;
  background: #f6f8fa;
  border-bottom: 1px solid #d0d7de;
  overflow-x: auto;
`;

const BranchTab = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  border: 1px solid ${props => props.active ? '#0969da' : '#d0d7de'};
  background: ${props => props.active ? '#0969da' : 'white'};
  color: ${props => props.active ? 'white' : '#24292f'};
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.active ? '#0860ca' : '#f3f4f6'};
  }
`;

const CommitList = styled.div`
  padding: 16px;
`;

const CommitItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7ea;

  &:last-child {
    border-bottom: none;
  }
`;

const CommitDot = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.color};
  border: 2px solid white;
  box-shadow: 0 0 0 2px ${props => props.color};
  margin-top: 4px;
  flex-shrink: 0;
`;

const CommitContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const CommitMessage = styled.div`
  font-weight: 600;
  color: #24292f;
  margin-bottom: 4px;
  word-wrap: break-word;
  line-height: 1.4;
`;

const CommitMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #656d76;
`;

const CommitAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const AuthorAvatar = styled.img`
  width: 16px;
  height: 16px;
  border-radius: 50%;
`;

const CommitSha = styled.code`
  background: #f6f8fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 11px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #656d76;
`;

interface MobileNetworkViewProps {
  networkData: NetworkData;
}

export const MobileNetworkView: React.FC<MobileNetworkViewProps> = ({ networkData }) => {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  // Group commits by branch
  const commitsByBranch = React.useMemo(() => {
    const groups: Record<string, Commit[]> = { all: networkData.commits };

    networkData.branches.forEach(branch => {
      groups[branch.name] = networkData.commits.filter(commit =>
        commit.sha === branch.commit.sha ||
        networkData.commits.some(c =>
          c.parents.some(parent => parent.sha === commit.sha)
        )
      );
    });

    return groups;
  }, [networkData]);

  const displayCommits = commitsByBranch[selectedBranch] || [];

  // Color mapping for branches
  const branchColors = React.useMemo(() => {
    const colors = [
      '#0969da', '#cf222e', '#1a7f37', '#8250df', '#fb8500',
      '#d1242f', '#0550ae', '#6f42c1', '#d73a49', '#28a745'
    ];
    const colorMap: Record<string, string> = { all: '#6e7781' };

    networkData.branches.forEach((branch, index) => {
      colorMap[branch.name] = colors[index % colors.length];
    });

    return colorMap;
  }, [networkData.branches]);

  return (
    <MobileContainer>
      <BranchSelector>
        <BranchTab
          active={selectedBranch === 'all'}
          onClick={() => setSelectedBranch('all')}
        >
          All ({networkData.commits.length})
        </BranchTab>
        {networkData.branches.map(branch => (
          <BranchTab
            key={branch.name}
            active={selectedBranch === branch.name}
            onClick={() => setSelectedBranch(branch.name)}
          >
            {branch.name} ({commitsByBranch[branch.name]?.length || 0})
          </BranchTab>
        ))}
      </BranchSelector>

      <CommitList>
        {displayCommits.length === 0 ? (
          <EmptyState>
            No commits found for this branch
          </EmptyState>
        ) : (
          displayCommits
            .sort((a, b) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime())
            .map(commit => (
              <CommitItem key={commit.sha}>
                <CommitDot color={branchColors[selectedBranch] || '#6e7781'} />
                <CommitContent>
                  <CommitMessage>
                    {commit.commit.message.split('\n')[0]}
                  </CommitMessage>
                  <CommitMeta>
                    <CommitAuthor>
                      {commit.author && (
                        <>
                          <AuthorAvatar
                            src={commit.author.avatar_url}
                            alt={commit.author.login}
                          />
                          {commit.author.login}
                        </>
                      )}
                      {!commit.author && commit.commit.author.name}
                      <span>•</span>
                      <time>
                        {new Date(commit.commit.author.date).toLocaleDateString()}
                      </time>
                    </CommitAuthor>
                    <div>
                      <CommitSha>{commit.sha.substring(0, 7)}</CommitSha>
                      {commit.parents.length > 1 && (
                        <span style={{ marginLeft: '8px', fontSize: '11px' }}>
                          Merge commit
                        </span>
                      )}
                    </div>
                  </CommitMeta>
                </CommitContent>
              </CommitItem>
            ))
        )}
      </CommitList>
    </MobileContainer>
  );
};