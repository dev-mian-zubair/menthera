import { useState, useEffect, useCallback, useMemo } from 'react';
import { agentsApi, AgentActivity, PaginatedResponse } from '@/lib/api/agents';
import { isApiSuccess } from '@/lib/api/config';
import { Agent } from '@/lib/types';

export const useAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await agentsApi.getAgents();

      if (isApiSuccess(response)) {
        setAgents(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const refetch = useCallback(() => {
    fetchAgents();
  }, [fetchAgents]);

  return {
    agents,
    loading,
    error,
    refetch,
  };
};

// NOTE: useAgentActivities is deprecated - getAgentActivities API method not implemented
// To use this hook, implement the getAgentActivities method in lib/api/agents.ts
/*
interface UseAgentActivitiesParams {
  page?: number;
  limit?: number;
}

export const useAgentActivities = (agentId: string, params?: UseAgentActivitiesParams) => {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<AgentActivity>['pagination'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize params to prevent infinite re-renders
  const memoizedParams = useMemo(() => params, [
    params?.page,
    params?.limit,
  ]);

  const fetchActivities = useCallback(async () => {
    if (!agentId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await agentsApi.getAgentActivities(agentId, memoizedParams);

      if (isApiSuccess(response)) {
        setActivities((response.data as PaginatedResponse<AgentActivity>).data);
        setPagination((response.data as PaginatedResponse<AgentActivity>).pagination);
      } else {
        setError(response.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [agentId, memoizedParams]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const refetch = useCallback(() => {
    fetchActivities();
  }, [fetchActivities]);

  const loadMore = useCallback(() => {
    if (pagination?.hasNext && !loading) {
      const nextPageParams = {
        ...memoizedParams,
        page: (pagination.page || 1) + 1,
      };

      // For loadMore, we'll append to existing activities
      const fetchMore = async () => {
        setLoading(true);
        try {
          const response = await agentsApi.getAgentActivities(agentId, nextPageParams);
          if (isApiSuccess(response)) {
            setActivities(prev => [...prev, ...(response.data as PaginatedResponse<AgentActivity>).data]);
            setPagination((response.data as PaginatedResponse<AgentActivity>).pagination);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
          setLoading(false);
        }
      };

      fetchMore();
    }
  }, [agentId, pagination, loading, memoizedParams]);

  return {
    activities,
    pagination,
    loading,
    error,
    refetch,
    loadMore,
  };
};
*/