import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAnalyticsSummary,
  getTopProducts,
  getUserGrowth,
  getAdminOrders,
  getAdminOrder,
  updateOrderStatus,
  getAdminProducts,
  getAdminProduct,
  createProduct,
  updateProduct,
  toggleProductActive,
} from '../api/admin';

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: getAnalyticsSummary,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopProducts() {
  return useQuery({
    queryKey: ['admin', 'top-products'],
    queryFn: getTopProducts,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserGrowth() {
  return useQuery({
    queryKey: ['admin', 'user-growth'],
    queryFn: getUserGrowth,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminOrders(params) {
  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: () => getAdminOrders(params),
    keepPreviousData: true,
  });
}

export function useAdminOrder(id) {
  return useQuery({
    queryKey: ['admin', 'orders', id],
    queryFn: () => getAdminOrder(id),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
  });
}

export function useAdminProducts(params) {
  return useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: () => getAdminProducts(params),
    keepPreviousData: true,
  });
}

export function useAdminProduct(id) {
  return useQuery({
    queryKey: ['admin', 'products', id],
    queryFn: () => getAdminProduct(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useToggleProductActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleProductActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}
