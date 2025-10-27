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

const NetworkSvg = styled.svg`
  width: 100%;
  height: 100%;
  background: #fafbfc;
`;

const Tooltip = styled.div<{ visible: boolean; x: number; y: number }>`
  position: absolute;
  background: #24292f;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 1000;
  opacity: ${props => props.visible ? 1 : 0};
  transform: translate(${props => props.x}px, ${props => props.y}px);
  transition: opacity 0.2s;
  max-width: 250px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    content: ''
  });

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

    // Create nodes for commits
    networkData.commits.forEach((commit, index) => {
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
    networkData.commits.forEach(commit => {
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
      .on('mouseover', (event, d) => {
        const [x, y] = d3.pointer(event, container);
        setTooltip({
          visible: true,
          x: x + 10,
          y: y - 10,
          content: `
            <strong>${d.commit.commit.message.split('\n')[0]}</strong><br/>
            Branch: ${d.branch}<br/>
            Author: ${d.commit.commit.author.name}<br/>
            Date: ${new Date(d.commit.commit.author.date).toLocaleDateString()}
          `
        });
      })
      .on('mouseout', () => {
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
    };
  }, [networkData]);

  return (
    <NetworkContainer>
      <NetworkSvg ref={svgRef} />
      <Tooltip
        visible={tooltip.visible}
        x={tooltip.x}
        y={tooltip.y}
        dangerouslySetInnerHTML={{ __html: tooltip.content }}
      />
    </NetworkContainer>
  );
};