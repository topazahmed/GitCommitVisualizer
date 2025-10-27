// Simple debug component to show auth state
import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const DebugPanel = styled.div`
  position: fixed;
  top: 10px;
  right: 10px;
  background: #f6f8fa;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  padding: 12px;
  font-size: 12px;
  z-index: 1000;
  max-width: 250px;
`;

const DebugItem = styled.div`
  margin-bottom: 4px;
`;

const Button = styled.button`
  background: #0969da;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 11px;
  cursor: pointer;
  margin-top: 8px;
`;

export const AuthDebug: React.FC = () => {
  const { user, isLoading } = useAuth();
  const token = localStorage.getItem('github_token');

  const clearAuth = () => {
    localStorage.removeItem('github_token');
    localStorage.removeItem('oauth_state');
    window.location.reload();
  };

  return (
    <DebugPanel>
      <strong>🔍 Auth Debug</strong>
      <DebugItem>Loading: {isLoading ? 'Yes' : 'No'}</DebugItem>
      <DebugItem>User: {user ? user.login : 'None'}</DebugItem>
      <DebugItem>Token: {token ? 'Present' : 'Missing'}</DebugItem>
      <DebugItem>Token length: {token ? token.length : 0}</DebugItem>
      <Button onClick={clearAuth}>Clear Auth</Button>
    </DebugPanel>
  );
};