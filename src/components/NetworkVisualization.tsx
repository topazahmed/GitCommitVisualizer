// Network visualization component using D3
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import styled from 'styled-components';
import { NetworkData, Commit } from '../services/GitHubApiClient';

const NetworkContainer = styled.div`
  width: 100%;
  height: 600px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  overflow: hidden;
  position: relative;

  @media (max-width: 768px) {
    height: 400px;
  }
`;

const SearchControls = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 50;
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #d0d7de;
  min-width: 280px;

  @media (max-width: 768px) {
    min-width: 240px;
    top: 12px;
    left: 12px;
    right: 12px;
    width: auto;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 8px;

  &:focus {
    outline: none;
    border-color: #0969da;
    box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
  }
`;

const FilterButtons = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ active: boolean }>`
  padding: 4px 8px;
  border: 1px solid #d0d7de;
  background: ${props => props.active ? '#0969da' : 'white'};
  color: ${props => props.active ? 'white' : '#24292f'};
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.active ? '#0860ca' : '#f6f8fa'};
  }
`;

const NetworkSvg = styled.svg`
  width: 100%;
  height: 100%;
  background: #fafbfc;
`;

const Tooltip = styled.div<{ visible: boolean; x: number; y: number }>`
  position: absolute;
  background: #24292f;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  pointer-events: none;
  z-index: 1000;
  opacity: ${props => props.visible ? 1 : 0};
  transform: translate(${props => props.x}px, ${props => props.y}px);
  transition: opacity 0.2s;
  max-width: 300px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  line-height: 1.4;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 20px;
    border: 6px solid transparent;
    border-top-color: #24292f;
  }
`;

const CommitDetailsPanel = styled.div<{ visible: boolean }>`
  position: absolute;
  top: 0;
  right: 0;
  width: 350px;
  height: 100%;
  background: white;
  border-left: 1px solid #d0d7de;
  box-shadow: -4px 0 8px rgba(0, 0, 0, 0.1);
  transform: translateX(${props => props.visible ? '0' : '100%'});
  transition: transform 0.3s ease-in-out;
  z-index: 100;
  overflow-y: auto;
  padding: 20px;
  
  @media (max-width: 768px) {
    width: 100%;
    top: 50%;
    height: 50%;
    border-left: none;
    border-top: 1px solid #d0d7de;
    box-shadow: 0 -4px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(${props => props.visible ? '0' : '100%'});
  }
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e1e4e8;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #656d76;
  padding: 4px;
  border-radius: 4px;
  min-height: 32px;
  min-width: 32px;
  
  &:hover {
    background: #f6f8fa;
    color: #24292f;
  }
`;

const CommitInfo = styled.div`
  margin-bottom: 16px;
`;

const CommitMessage = styled.h3`
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #24292f;
  line-height: 1.3;
`;

const MetaInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: #656d76;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  strong {
    color: #24292f;
    min-width: 60px;
  }
`;

const CommitSha = styled.code`
  background: #f6f8fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  font-family: 'SFMono-Regular', 'Consolas', monospace;
`;

interface NetworkNode {
  id: string;
  commit: Commit;
  branch: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface NetworkLink {
  source: string | NetworkNode;
  target: string | NetworkNode;
}

interface NetworkVisualizationProps {
  networkData: NetworkData;
}

export const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({ networkData }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<NetworkNode, undefined> | null>(null);
  const nodesRef = useRef<d3.Selection<SVGCircleElement, NetworkNode, SVGGElement, unknown> | null>(null);
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    content: ''
  });
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set());

  // Helper function to calculate time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    if (!svgRef.current || !networkData.commits.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svgRef.current.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create nodes and links from commits and branches
    const nodes: NetworkNode[] = [];
    const links: NetworkLink[] = [];
    const commitMap = new Map<string, NetworkNode>();

    // Filter commits based on search term and selected branches
    const filteredCommits = networkData.commits.filter(commit => {
      const branchName = networkData.branches.find(branch => 
        branch.commit.sha === commit.sha
      )?.name || 'main';

      const matchesSearch = !searchTerm || 
        commit.commit.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commit.commit.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commit.sha.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBranch = selectedBranches.size === 0 || selectedBranches.has(branchName);

      return matchesSearch && matchesBranch;
    });

    // Create nodes for filtered commits
    filteredCommits.forEach((commit, index) => {
      const branchName = networkData.branches.find(branch => 
        branch.commit.sha === commit.sha
      )?.name || 'main';

      const node: NetworkNode = {
        id: commit.sha,
        commit,
        branch: branchName,
      };

      nodes.push(node);
      commitMap.set(commit.sha, node);
    });

    // Create links between parent and child commits
    filteredCommits.forEach(commit => {
      commit.parents.forEach(parent => {
        if (commitMap.has(parent.sha)) {
          links.push({
            source: parent.sha,
            target: commit.sha,
          });
        }
      });
    });

    // Color scale for different branches
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Create force simulation
    const simulation = d3.forceSimulation<NetworkNode>(nodes)
      .force('link', d3.forceLink<NetworkNode, NetworkLink>(links)
        .id(d => d.id)
        .distance(80)
        .strength(0.8)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(20));

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create container group
    const g = svg.append('g');

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 8)
      .attr('fill', d => colorScale(d.branch))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s ease')
      .on('mouseover', (event, d) => {
        const [x, y] = d3.pointer(event, container);
        setHoveredNode(d.id);
        
        // Enhanced tooltip content
        const commitDate = new Date(d.commit.commit.author.date);
        const timeAgo = getTimeAgo(commitDate);
        
        setTooltip({
          visible: true,
          x: x + 15,
          y: y - 10,
          content: `
            <div style="font-weight: 600; margin-bottom: 8px; color: #ffffff;">
              ${d.commit.commit.message.split('\n')[0]}
            </div>
            <div style="margin-bottom: 4px;">
              <strong>Branch:</strong> ${d.branch}
            </div>
            <div style="margin-bottom: 4px;">
              <strong>Author:</strong> ${d.commit.commit.author.name}
            </div>
            <div style="margin-bottom: 4px;">
              <strong>Date:</strong> ${timeAgo}
            </div>
            <div style="margin-bottom: 4px;">
              <strong>SHA:</strong> <code style="background: rgba(255,255,255,0.2); padding: 1px 3px; border-radius: 2px;">${d.commit.sha.substring(0, 7)}</code>
            </div>
            <div style="font-size: 11px; color: #c9d1d9; margin-top: 8px;">
              Click for details
            </div>
          `
        });
      })
      .on('mouseout', () => {
        setHoveredNode(null);
        setTooltip(prev => ({ ...prev, visible: false }));
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedCommit(d.commit);
        setTooltip(prev => ({ ...prev, visible: false }));
      })
      .call(d3.drag<SVGCircleElement, NetworkNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Store nodes reference for updates
    nodesRef.current = node;

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as NetworkNode).x!)
        .attr('y1', d => (d.source as NetworkNode).y!)
        .attr('x2', d => (d.target as NetworkNode).x!)
        .attr('y2', d => (d.target as NetworkNode).y!);

      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);
    });

    // Add legend
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(20, 20)`);

    const branches = Array.from(new Set(nodes.map(d => d.branch)));
    
    legend.selectAll('.legend-item')
      .data(branches)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`)
      .each(function(d) {
        const g = d3.select(this);
        g.append('circle')
          .attr('r', 6)
          .attr('fill', colorScale(d))
          .attr('stroke', '#fff')
          .attr('stroke-width', 1);
        
        g.append('text')
          .attr('x', 15)
          .attr('y', 0)
          .attr('dy', '0.35em')
          .style('font-size', '12px')
          .style('fill', '#24292f')
          .text(d);
      });

    // Cleanup function
    return () => {
      simulation.stop();
      simulationRef.current = null;
      nodesRef.current = null;
    };
  }, [networkData, searchTerm, selectedBranches]);

  // Separate effect for hover updates - this doesn't recreate the entire visualization
  useEffect(() => {
    if (nodesRef.current) {
      nodesRef.current
        .attr('r', d => hoveredNode === d.id ? 12 : 8)
        .attr('stroke', d => hoveredNode === d.id ? '#0969da' : '#fff')
        .attr('stroke-width', d => hoveredNode === d.id ? 3 : 2)
        .style('filter', d => hoveredNode === d.id ? 'drop-shadow(0 0 8px rgba(9, 105, 218, 0.5))' : 'none');
    }
  }, [hoveredNode]);

  // Get available branches for filtering
  const availableBranches = Array.from(new Set(
    networkData.commits.map(commit => 
      networkData.branches.find(branch => branch.commit.sha === commit.sha)?.name || 'main'
    )
  ));

  const toggleBranch = (branch: string) => {
    setSelectedBranches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(branch)) {
        newSet.delete(branch);
      } else {
        newSet.add(branch);
      }
      return newSet;
    });
  };

  return (
    <NetworkContainer>
      <SearchControls>
        <SearchInput
          type="text"
          placeholder="Search commits, authors, or SHA..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FilterButtons>
          {availableBranches.map(branch => (
            <FilterButton
              key={branch}
              active={selectedBranches.has(branch)}
              onClick={() => toggleBranch(branch)}
            >
              {branch}
            </FilterButton>
          ))}
          {selectedBranches.size > 0 && (
            <FilterButton
              active={false}
              onClick={() => setSelectedBranches(new Set())}
              style={{ marginLeft: '8px', borderColor: '#da3633', color: '#da3633' }}
            >
              Clear
            </FilterButton>
          )}
        </FilterButtons>
      </SearchControls>

      <NetworkSvg ref={svgRef} />
      <Tooltip
        visible={tooltip.visible}
        x={tooltip.x}
        y={tooltip.y}
        dangerouslySetInnerHTML={{ __html: tooltip.content }}
      />
      
      <CommitDetailsPanel visible={!!selectedCommit}>
        {selectedCommit && (
          <>
            <PanelHeader>
              <div>
                <CommitMessage>
                  {selectedCommit.commit.message.split('\n')[0]}
                </CommitMessage>
                {selectedCommit.commit.message.split('\n').length > 1 && (
                  <div style={{ color: '#656d76', fontSize: '13px', marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                    {selectedCommit.commit.message.split('\n').slice(1).join('\n').trim()}
                  </div>
                )}
              </div>
              <CloseButton onClick={() => setSelectedCommit(null)}>
                ×
              </CloseButton>
            </PanelHeader>

            <CommitInfo>
              <MetaInfo>
                <MetaRow>
                  <strong>SHA:</strong>
                  <CommitSha>{selectedCommit.sha.substring(0, 7)}</CommitSha>
                </MetaRow>
                <MetaRow>
                  <strong>Author:</strong>
                  <span>{selectedCommit.commit.author.name}</span>
                </MetaRow>
                <MetaRow>
                  <strong>Email:</strong>
                  <span>{selectedCommit.commit.author.email}</span>
                </MetaRow>
                <MetaRow>
                  <strong>Date:</strong>
                  <span>{getTimeAgo(new Date(selectedCommit.commit.author.date))}</span>
                </MetaRow>
                <MetaRow>
                  <strong>Full Date:</strong>
                  <span>{new Date(selectedCommit.commit.author.date).toLocaleString()}</span>
                </MetaRow>
                {selectedCommit.parents.length > 0 && (
                  <MetaRow>
                    <strong>Parents:</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {selectedCommit.parents.map(parent => (
                        <CommitSha key={parent.sha}>{parent.sha.substring(0, 7)}</CommitSha>
                      ))}
                    </div>
                  </MetaRow>
                )}
              </MetaInfo>
            </CommitInfo>

            {/* File changes section removed temporarily as it's not available in the current Commit type */}
            
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e1e4e8' }}>
              <a 
                href={`https://github.com/${networkData.repository.full_name}/commit/${selectedCommit.sha}`}
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  background: '#0969da',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                View on GitHub →
              </a>
            </div>
          </>
        )}
      </CommitDetailsPanel>
    </NetworkContainer>
  );
};