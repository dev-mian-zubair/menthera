import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/lib/utils/logger';

const AGENT_PREFERENCES_KEY = '@menthera_agent_preferences';

export interface AgentPreferences {
  hiddenAgentIds: string[];
  agentOrder: string[]; // Order of visible agents
  showUsageCard: boolean; // Whether to show usage card on home screen
  selectedAgentId: string | null; // Currently selected agent for chat
  lastUpdated: number;
}

export const useAgentPreferences = () => {
  const [preferences, setPreferences] = useState<AgentPreferences>({
    hiddenAgentIds: [],
    agentOrder: [],
    showUsageCard: true,
    selectedAgentId: null,
    lastUpdated: Date.now(),
  });
  const [loading, setLoading] = useState(true);

  // Load preferences from AsyncStorage
  const loadPreferences = useCallback(async () => {
    try {
      logger.debug('[AgentPreferences] Loading from AsyncStorage...');
      const stored = await AsyncStorage.getItem(AGENT_PREFERENCES_KEY);

      if (stored) {
        const parsed = JSON.parse(stored) as AgentPreferences;

        // Sanitize preferences - ensure all required fields exist with defaults
        const sanitized: AgentPreferences = {
          hiddenAgentIds: parsed.hiddenAgentIds || [],
          agentOrder: parsed.agentOrder || [],
          showUsageCard: parsed.showUsageCard !== undefined ? parsed.showUsageCard : true,
          selectedAgentId: parsed.selectedAgentId || null,
          lastUpdated: parsed.lastUpdated || Date.now(),
        };

        logger.debug('[AgentPreferences] ✓ Loaded preferences:', {
          hiddenCount: sanitized.hiddenAgentIds.length,
          hiddenIds: sanitized.hiddenAgentIds,
          orderCount: sanitized.agentOrder.length,
          agentOrder: sanitized.agentOrder,
          showUsageCard: sanitized.showUsageCard,
        });
        setPreferences(sanitized);
      } else {
        logger.debug('[AgentPreferences] No stored preferences, using defaults');
        setPreferences({
          hiddenAgentIds: [],
          agentOrder: [],
          showUsageCard: true,
          selectedAgentId: null,
          lastUpdated: Date.now(),
        });
      }
    } catch (error) {
      logger.error('[AgentPreferences] Error loading preferences:', error);
      setPreferences({
        hiddenAgentIds: [],
        agentOrder: [],
        showUsageCard: true,
        selectedAgentId: null,
        lastUpdated: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Save preferences to AsyncStorage
  const savePreferences = useCallback(async (newPrefs: AgentPreferences) => {
    try {
      logger.debug('[AgentPreferences] Saving to AsyncStorage...', {
        hiddenCount: newPrefs.hiddenAgentIds.length,
        hiddenIds: newPrefs.hiddenAgentIds,
      });
      const updated = {
        ...newPrefs,
        lastUpdated: Date.now(),
      };
      await AsyncStorage.setItem(AGENT_PREFERENCES_KEY, JSON.stringify(updated));
      setPreferences(updated);
      logger.debug('[AgentPreferences] ✓ Preferences saved:', {
        hiddenIds: updated.hiddenAgentIds,
      });
    } catch (error) {
      logger.error('[AgentPreferences] Error saving preferences:', error);
    }
  }, []);

  // Toggle agent visibility (prevent hiding the only visible agent)
  const toggleAgentVisibility = useCallback(
    async (agentId: string) => {
      const isHidden = preferences.hiddenAgentIds.includes(agentId);

      // If trying to hide this agent, check if it's the only visible one
      if (!isHidden) {
        const orderLength = preferences.agentOrder?.length || 0;
        const visibleCount = orderLength - preferences.hiddenAgentIds.length;
        if (visibleCount <= 1) {
          logger.debug(`[AgentPreferences] Cannot hide last visible agent: ${agentId}`);
          return;
        }
      }

      const newHiddenIds = isHidden
        ? preferences.hiddenAgentIds.filter(id => id !== agentId)
        : [...preferences.hiddenAgentIds, agentId];

      logger.debug(`[AgentPreferences] Toggle agent ${agentId}:`, {
        wasHidden: isHidden,
        nowHidden: !isHidden,
        newHiddenIds: newHiddenIds,
      });

      await savePreferences({
        ...preferences,
        hiddenAgentIds: newHiddenIds,
      });
    },
    [preferences, savePreferences]
  );

  // Check if agent is hidden
  const isAgentHidden = useCallback(
    (agentId: string) => preferences.hiddenAgentIds.includes(agentId),
    [preferences.hiddenAgentIds]
  );

  // Show all agents
  const showAllAgents = useCallback(async () => {
    logger.debug('[AgentPreferences] Showing all agents');
    await savePreferences({
      ...preferences,
      hiddenAgentIds: [],
    });
  }, [savePreferences, preferences]);

  // Hide all agents
  const hideAllAgents = useCallback(
    async (allAgentIds: string[]) => {
      logger.debug('[AgentPreferences] Hiding all agents');
      await savePreferences({
        ...preferences,
        hiddenAgentIds: allAgentIds,
      });
    },
    [savePreferences, preferences]
  );

  // Initialize agent order (called when agents are first loaded)
  const initializeAgentOrder = useCallback(
    async (allAgentIds: string[]) => {
      // Only initialize if order is empty
      if (preferences.agentOrder.length === 0) {
        logger.debug('[AgentPreferences] Initializing agent order with IDs:', allAgentIds);
        await savePreferences({
          ...preferences,
          agentOrder: allAgentIds,
        });
      } else {
        logger.debug('[AgentPreferences] Agent order already initialized:', preferences.agentOrder);
      }
    },
    [preferences, savePreferences]
  );

  // Reorder agents
  const reorderAgents = useCallback(
    async (newOrder: string[]) => {
      logger.debug('[AgentPreferences] Reordering agents:', newOrder);
      await savePreferences({
        ...preferences,
        agentOrder: newOrder,
      });
    },
    [preferences, savePreferences]
  );

  // Toggle usage card visibility
  const toggleUsageCardVisibility = useCallback(async () => {
    logger.debug('[AgentPreferences] Toggling usage card visibility:', {
      currentState: preferences.showUsageCard,
      newState: !preferences.showUsageCard,
    });
    await savePreferences({
      ...preferences,
      showUsageCard: !preferences.showUsageCard,
    });
  }, [preferences, savePreferences]);

  // Select agent for chat
  const selectAgent = useCallback(async (agentId: string | null) => {
    logger.debug('[AgentPreferences] Selecting agent:', agentId);
    await savePreferences({
      ...preferences,
      selectedAgentId: agentId,
    });
  }, [preferences, savePreferences]);

  // Get visible agents in order
  const getVisibleAgentsInOrder = useCallback(
    (allAgents: any[]) => {
      // Safety check: if agentOrder is not defined or empty, return all visible agents as-is
      if (!preferences.agentOrder || preferences.agentOrder.length === 0) {
        return allAgents.filter(agent => !preferences.hiddenAgentIds.includes(agent.id));
      }

      // Return agents in custom order, filtering out hidden ones
      return preferences.agentOrder
        .map(id => allAgents.find(agent => agent.id === id))
        .filter((agent): agent is any => agent !== undefined && !preferences.hiddenAgentIds.includes(agent.id));
    },
    [preferences.agentOrder, preferences.hiddenAgentIds]
  );

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Log preferences changes (for debugging)
  useEffect(() => {
    logger.debug('[AgentPreferences] Preferences state changed:', {
      hiddenIds: preferences.hiddenAgentIds,
      orderCount: preferences.agentOrder.length,
    });
  }, [preferences.hiddenAgentIds, preferences.agentOrder]);

  return {
    preferences,
    loading,
    toggleAgentVisibility,
    isAgentHidden,
    showAllAgents,
    hideAllAgents,
    loadPreferences,
    initializeAgentOrder,
    reorderAgents,
    getVisibleAgentsInOrder,
    toggleUsageCardVisibility,
    selectAgent,
    selectedAgentId: preferences.selectedAgentId,
  };
};
