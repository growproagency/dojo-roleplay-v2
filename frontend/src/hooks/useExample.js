// hooks/useExample.js
// TanStack Query hooks for the "example" resource.
// Components import these — they never call the API layer directly.
//
// Gives you: automatic caching, deduplication, background refetch,
// loading/error state, and automatic cache invalidation after mutations.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exampleApi } from '../api/example.api';

// ── Query keys ────────────────────────────────────────────────────────────────
// Centralise query keys so invalidation is consistent everywhere.
export const exampleKeys = {
  all:    () => ['examples'],
  list:   (page, limit) => ['examples', 'list', { page, limit }],
  detail: (id) => ['examples', 'detail', id],
};

// ── Queries (reads) ───────────────────────────────────────────────────────────
export const useExamples = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: exampleKeys.list(page, limit),
    queryFn:  () => exampleApi.getAll(page, limit),
    staleTime: 1000 * 60 * 5, // consider fresh for 5 minutes
  });
};

export const useExample = (id) => {
  return useQuery({
    queryKey: exampleKeys.detail(id),
    queryFn:  () => exampleApi.getById(id),
    enabled:  !!id, // don't run if id is undefined
  });
};

// ── Mutations (writes) ────────────────────────────────────────────────────────
export const useCreateExample = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => exampleApi.create(data),
    onSuccess: () => {
      // Invalidate all example list queries → triggers automatic refetch
      queryClient.invalidateQueries({ queryKey: exampleKeys.all() });
    },
  });
};

export const useUpdateExample = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => exampleApi.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: exampleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: exampleKeys.all() });
    },
  });
};

export const useDeleteExample = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => exampleApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exampleKeys.all() });
    },
  });
};
