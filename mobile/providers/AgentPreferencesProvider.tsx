import React, { createContext, useContext } from 'react';
import { useAgentPreferences } from '@/hooks/useAgentPreferences';
import type { AgentPreferences } from '@/hooks/useAgentPreferences';

interface AgentPreferencesContextType {
  preferences: AgentPreferences;
  loading: boolean;
  toggleAgentVisibility: (agentId: string) => Promise<void>;
  isAgentHidden: (agentId: string) => boolean;
  showAllAgents: () => Promise<void>;
  hideAllAgents: (allAgentIds: string[]) => Promise<void>;
  loadPreferences: () => Promise<void>;
  initializeAgentOrder: (allAgentIds: string[]) => Promise<void>;
  reorderAgents: (newOrder: string[]) => Promise<void>;
  getVisibleAgentsInOrder: (allAgents: any[]) => any[];
  toggleUsageCardVisibility: () => Promise<void>;
  selectAgent: (agentId: string | null) => Promise<void>;
  selectedAgentId: string | null;
}

const AgentPreferencesContext = createContext<AgentPreferencesContextType | undefined>(undefined);

export const AgentPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const agentPreferences = useAgentPreferences();

  return (
    <AgentPreferencesContext.Provider value={agentPreferences}>
      {children}
    </AgentPreferencesContext.Provider>
  );
};

export const useAgentPreferencesContext = () => {
  const context = useContext(AgentPreferencesContext);
  if (!context) {
    throw new Error('useAgentPreferencesContext must be used within AgentPreferencesProvider');
  }
  return context;
};
