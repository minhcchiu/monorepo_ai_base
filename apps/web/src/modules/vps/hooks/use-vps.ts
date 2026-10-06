import { useQuery } from '@tanstack/react-query';
import { fetchVpsList, fetchVpsDetail } from '../api';

export function useVpsList() {
  return useQuery({
    queryKey: ['vps', 'list'],
    queryFn: fetchVpsList,
    refetchInterval: 60000,
  });
}

export function useVpsDetail(id: string) {
  return useQuery({
    queryKey: ['vps', 'detail', id],
    queryFn: () => fetchVpsDetail(id),
    refetchInterval: 60000,
  });
}
