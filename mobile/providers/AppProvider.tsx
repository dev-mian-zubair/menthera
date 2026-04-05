import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Agent, Conversation, CallHistory } from '@/lib/types';

// App State Interface
export interface AppState {
  agents: Agent[];
  conversations: Conversation[];
  callHistory: CallHistory[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
}

// Action Types
export type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ACTIVE_CONVERSATION'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: { conversationId: string; message: any } }
  | { type: 'UPDATE_CONVERSATION'; payload: Conversation }
  | { type: 'ADD_CALL_HISTORY'; payload: CallHistory };

// Initial State
const initialState: AppState = {
  agents: [],
  conversations: [],
  callHistory: [],
  activeConversationId: null,
  isLoading: false,
  error: null,
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_ACTIVE_CONVERSATION':
      return { ...state, activeConversationId: action.payload };

    case 'ADD_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.conversationId
            ? { ...conv, messages: [...conv.messages, action.payload.message] }
            : conv
        ),
      };

    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.id ? action.payload : conv
        ),
      };

    case 'ADD_CALL_HISTORY':
      return {
        ...state,
        callHistory: [action.payload, ...state.callHistory],
      };

    default:
      return state;
  }
};

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider Props
interface AppProviderProps {
  children: ReactNode;
}

// Provider Component
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom Hook
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};