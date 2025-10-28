import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  max-width: 500px;
  margin: 0 auto;
`;

const Title = styled.h2`
  color: var(--text-primary);
  margin: 0;
  text-align: center;
`;

const Description = styled.p`
  color: var(--text-secondary);
  text-align: center;
  margin: 0;
  line-height: 1.5;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  width: 100%;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 1rem;
  min-width: 200px;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px var(--accent-color-alpha);
  }
  
  &::placeholder {
    color: var(--text-secondary);
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover:not(:disabled) {
    background-color: var(--accent-hover);
    transform: translateY(-1px);
  }
  
  &:disabled {
    background-color: var(--text-secondary);
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  color: var(--error-color);
  background-color: var(--error-bg);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  width: 100%;
  text-align: center;
  font-size: 0.9rem;
`;

const ExampleUrls = styled.div`
  color: var(--text-secondary);
  font-size: 0.85rem;
  text-align: center;
  
  h4 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
  }
  
  div {
    margin: 0.25rem 0;
    font-family: monospace;
    background-color: var(--bg-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    display: inline-block;
  }
`;

interface PublicRepoInputProps {
  onRepoAccess: (owner: string, repo: string) => void;
}

export const PublicRepoInput: React.FC<PublicRepoInputProps> = ({ onRepoAccess }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState('');
  const { accessPublicRepo, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!repoUrl.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    try {
      const { owner, repo } = await accessPublicRepo(repoUrl.trim());
      onRepoAccess(owner, repo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to access repository');
    }
  };

  return (
    <Container>
      <Title>Explore Public Repository</Title>
      <Description>
        Enter a GitHub repository URL to visualize its commit history and network without logging in.
        Only public repositories are accessible in this mode.
      </Description>
      
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <InputGroup>
          <Input
            type="text"
            placeholder="https://github.com/facebook/react"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !repoUrl.trim()}>
            {isLoading ? 'Accessing...' : 'Explore'}
          </Button>
        </InputGroup>
      </form>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <ExampleUrls>
        <h4>Example formats:</h4>
        <div>https://github.com/facebook/react</div>
        <div>facebook/react</div>
        <div>https://github.com/microsoft/vscode.git</div>
      </ExampleUrls>
    </Container>
  );
};