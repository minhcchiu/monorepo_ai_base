import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchInfrastructureOverview, diagnoseVpsNode } from '../api';
import { INFRASTRUCTURE_QUERY_KEYS } from './query-keys';
import { toast } from 'sonner';

export function useInfrastructureOverview() {
  return useQuery({
    queryKey: INFRASTRUCTURE_QUERY_KEYS.OVERVIEW,
    queryFn: fetchInfrastructureOverview,
    refetchInterval: 60000,
  });
}

export function useDiagnoseVpsNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nodeId: string) => diagnoseVpsNode(nodeId),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: INFRASTRUCTURE_QUERY_KEYS.OVERVIEW });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to diagnose VPS node');
    },
  });
}
