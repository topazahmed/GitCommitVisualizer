// Responsive network view that switches between desktop and mobile layouts
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { NetworkData } from '../services/GitHubApiClient';
import { NetworkVisualization } from './NetworkVisualization';
import { MobileNetworkView } from './MobileNetworkView';

const Container = styled.div`
  width: 100%;
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding: 4px;
  background: #f6f8fa;
  border-radius: 6px;
  border: 1px solid #d0d7de;

  @media (min-width: 769px) {
    display: none;
  }

  @media (max-width: 480px) {
    gap: 4px;
    margin-bottom: 12px;
    padding: 3px;
  }
`;

const ToggleButton = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 8px 16px;
  border: none;
  background: ${props => props.active ? 'white' : 'transparent'};
  color: ${props => props.active ? '#24292f' : '#656d76'};
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: ${props => props.active ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'};
  min-height: 44px; /* Touch-friendly */

  &:hover {
    background: ${props => props.active ? 'white' : 'rgba(255, 255, 255, 0.5)'};
  }

  @media (max-width: 480px) {
    padding: 10px 12px;
    font-size: 13px;
  }
`;

const DesktopView = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileViewContainer = styled.div`
  @media (min-width: 769px) {
    display: none;
  }
`;

const NetworkStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f6f8fa;
  border-radius: 6px;
  border: 1px solid #d0d7de;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 12px;
    margin-bottom: 16px;
  }

  @media (max-width: 480px) {
    gap: 8px;
    padding: 10px;
    margin-bottom: 12px;
  }
`;

const StatItem = styled.div`
  text-align: center;

  @media (max-width: 480px) {
    padding: 4px;
  }
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #24292f;
  margin-bottom: 4px;

  @media (max-width: 768px) {
    font-size: 20px;
  }

  @media (max-width: 480px) {
    font-size: 18px;
    margin-bottom: 2px;
  }
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #656d76;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  @media (max-width: 480px) {
    font-size: 11px;
    letter-spacing: 0.3px;
  }
`;

interface ResponsiveNetworkViewProps {
  networkData: NetworkData;
}

export const ResponsiveNetworkView: React.FC<ResponsiveNetworkViewProps> = ({ networkData }) => {
  const [mobileView, setMobileView] = useState<'graph' | 'list'>('list');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const stats = {
    commits: networkData.commits.length,
    branches: networkData.branches.length,
    forks: networkData.forks.length,
    contributors: new Set(networkData.commits.map(c => c.commit.author.email)).size,
  };

  return (
    <Container>
      <NetworkStats>
        <StatItem>
          <StatValue>{stats.commits}</StatValue>
          <StatLabel>Commits</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{stats.branches}</StatValue>
          <StatLabel>Branches</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{stats.forks}</StatValue>
          <StatLabel>Forks</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{stats.contributors}</StatValue>
          <StatLabel>Contributors</StatLabel>
        </StatItem>
      </NetworkStats>

      {isMobile && (
        <ViewToggle>
          <ToggleButton
            active={mobileView === 'list'}
            onClick={() => setMobileView('list')}
          >
            List View
          </ToggleButton>
          <ToggleButton
            active={mobileView === 'graph'}
            onClick={() => setMobileView('graph')}
          >
            Graph View
          </ToggleButton>
        </ViewToggle>
      )}

      <DesktopView>
        <NetworkVisualization networkData={networkData} />
      </DesktopView>

      <MobileViewContainer>
        {mobileView === 'list' ? (
          <MobileNetworkView networkData={networkData} />
        ) : (
          <NetworkVisualization networkData={networkData} />
        )}
      </MobileViewContainer>
    </Container>
  );
};