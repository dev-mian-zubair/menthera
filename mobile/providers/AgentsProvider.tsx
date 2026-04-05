import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Agent } from '@/lib/types';
import { agentsApi } from '@/lib/api/agents';
import { isApiSuccess } from '@/lib/api/config';
import { logger } from '@/lib/utils/logger';

// Storage key for agents
const AGENTS_STORAGE_KEY = 'app_agents_data';

// Storage helpers
const saveAgentsToStorage = async (agents: Agent[]): Promise<void> => {
  try {
    const dataToStore = {
      agents,
      timestamp: new Date().toISOString(),
    };
    await AsyncStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(dataToStore));
  } catch (error) {
    logger.warn('Failed to save agents to storage:', error);
  }
};

const loadAgentsFromStorage = async (): Promise<Agent[] | null> => {
  try {
    const stored = await AsyncStorage.getItem(AGENTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.agents || null;
    }
    return null;
  } catch (error) {
    logger.warn('Failed to load agents from storage:', error);
    return null;
  }
};

// Agents State Interface
export interface AgentsState {
  agents: Agent[];
  isLoading: boolean;
  error: string | null;
  lastFetched: Date | null;
  isInitialized: boolean; // Track if we've loaded from storage
}

// Action Types
export type AgentsAction =
  | { type: 'LOAD_FROM_STORAGE'; payload: Agent[] }
  | { type: 'FETCH_AGENTS_START' }
  | { type: 'FETCH_AGENTS_SUCCESS'; payload: Agent[] }
  | { type: 'FETCH_AGENTS_ERROR'; payload: string }
  | { type: 'UPDATE_AGENT'; payload: Agent }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_INITIALIZED' };

// Initial State
const initialState: AgentsState = {
  agents: [],
  isLoading: false,
  error: null,
  lastFetched: null,
  isInitialized: false,
};

// Reducer
const agentsReducer = (state: AgentsState, action: AgentsAction): AgentsState => {
  switch (action.type) {
    case 'LOAD_FROM_STORAGE':
      return {
        ...state,
        agents: action.payload,
        isInitialized: true,
        lastFetched: new Date(), // Consider it as fetched from storage
      };

    case 'SET_INITIALIZED':
      return {
        ...state,
        isInitialized: true,
      };

    case 'FETCH_AGENTS_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'FETCH_AGENTS_SUCCESS':
      return {
        ...state,
        agents: action.payload,
        isLoading: false,
        error: null,
        lastFetched: new Date(),
        isInitialized: true,
      };

    case 'FETCH_AGENTS_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        isInitialized: true, // Still mark as initialized even on error
      };

    case 'UPDATE_AGENT':
      return {
        ...state,
        agents: state.agents.map(agent =>
          agent.id === action.payload.id ? action.payload : agent
        ),
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Context Interface
interface AgentsContextType {
  state: AgentsState;
  dispatch: React.Dispatch<AgentsAction>;
  fetchAgents: () => Promise<void>;
  refetchAgents: () => Promise<void>;
  getAgentById: (id: string) => Agent | undefined;
  clearError: () => void;
  loadFromStorage: () => Promise<void>;
}

// Context
const AgentsContext = createContext<AgentsContextType | null>(null);

// Provider Props
interface AgentsProviderProps {
  children: ReactNode;
}

// Provider Component
export const AgentsProvider: React.FC<AgentsProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(agentsReducer, initialState);
  const isFetchingRef = React.useRef(false);

  // Load agents from storage - called externally
  const loadFromStorage = useCallback(async () => {
    try {
      const storedAgents = await loadAgentsFromStorage();
      if (storedAgents && storedAgents.length > 0) {
        dispatch({ type: 'LOAD_FROM_STORAGE', payload: storedAgents });
      } else {
        dispatch({ type: 'SET_INITIALIZED' });
      }
    } catch (error) {
      logger.warn('Failed to load agents from storage:', error);
      dispatch({ type: 'SET_INITIALIZED' });
    }
  }, []);

  // Fetch agents from API and update both state and storage
  const fetchAgents = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      logger.debug('[AgentsProvider] ⏭️  Fetch already in progress, skipping duplicate request');
      return;
    }

    logger.debug('[AgentsProvider] 🔄 Starting agent fetch...');
    isFetchingRef.current = true;
    dispatch({ type: 'FETCH_AGENTS_START' });

    try {
      logger.debug('[AgentsProvider] Calling agentsApi.getAgents()...');
      const response = await agentsApi.getAgents();

      logger.debug('[AgentsProvider] Response received:', {
        success: isApiSuccess(response),
        dataLength: isApiSuccess(response) ? response.data?.length : 'N/A',
        error: !isApiSuccess(response) ? response.error : 'N/A',
      });

      if (isApiSuccess(response)) {
        logger.debug('[AgentsProvider] ✓ Success - Dispatching success action with', response.data.length, 'agents');
        dispatch({ type: 'FETCH_AGENTS_SUCCESS', payload: response.data });

        // Save to storage in background
        logger.debug('[AgentsProvider] Saving agents to AsyncStorage...');
        saveAgentsToStorage(response.data);
        logger.debug('[AgentsProvider] ✓ Saved to storage');
      } else {
        logger.error('[AgentsProvider] ✗ Error response:', response.error);
        dispatch({ type: 'FETCH_AGENTS_ERROR', payload: response.error });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('[AgentsProvider] ✗ Exception during fetch:', errorMessage, error);
      dispatch({ type: 'FETCH_AGENTS_ERROR', payload: errorMessage });
    } finally {
      isFetchingRef.current = false;
    }
  }, []);


  // Refetch agents (for manual refresh) - same as fetchAgents
  const refetchAgents = useCallback(async () => {
    await fetchAgents();
  }, [fetchAgents]);

  // Get agent by ID helper
  const getAgentById = useCallback((id: string): Agent | undefined => {
    return state.agents.find(agent => agent.id === id);
  }, [state.agents]);

  // Clear error helper
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);


  const contextValue: AgentsContextType = {
    state,
    dispatch,
    fetchAgents,
    refetchAgents,
    getAgentById,
    clearError,
    loadFromStorage,
  };

  return (
    <AgentsContext.Provider value={contextValue}>
      {children}
    </AgentsContext.Provider>
  );
};

// Custom Hook
export const useAgentsContext = () => {
  const context = useContext(AgentsContext);
  if (!context) {
    throw new Error('useAgentsContext must be used within an AgentsProvider');
  }
  return context;
};

// Convenience hooks for common use cases
export const useAgentsState = () => {
  const { state } = useAgentsContext();
  return state;
};

export const useAgentsActions = () => {
  const { fetchAgents, refetchAgents, getAgentById, clearError, dispatch, loadFromStorage } = useAgentsContext();
  return { fetchAgents, refetchAgents, getAgentById, clearError, dispatch, loadFromStorage };
};