export const INFRASTRUCTURE_QUERY_KEYS = {
  OVERVIEW: ['infrastructure', 'overview'] as const,
  VPS_DETAILS: (id: string) => ['infrastructure', 'vps', id] as const,
};
