import client from './client';

export const getAnalyticsSummary = async () => {
  const { data } = await client.get('/v1/admin/analytics/summary');
  return data;
};

export const getTopProducts = async () => {
  const { data } = await client.get('/v1/admin/analytics/top-products');
  return data.data;
};

export const getUserGrowth = async () => {
  const { data } = await client.get('/v1/admin/analytics/user-growth');
  return data.data;
};

export const getAdminOrders = async (params = {}) => {
  const { data } = await client.get('/v1/admin/orders', { params });
  return data;
};

export const getAdminOrder = async (id) => {
  const { data } = await client.get(`/v1/admin/orders/${id}`);
  return data.data;
};

export const updateOrderStatus = async (id, status) => {
  const { data } = await client.patch(`/v1/admin/orders/${id}/status`, { status });
  return data.data;
};

export const getAdminProducts = async (params = {}) => {
  const { data } = await client.get('/v1/admin/products', { params });
  return data;
};

export const getAdminProduct = async (id) => {
  const { data } = await client.get(`/v1/admin/products/${id}`);
  return data.data;
};

export const createProduct = async (productData) => {
  const { data } = await client.post('/v1/admin/products', productData);
  return data.data;
};

export const updateProduct = async (id, productData) => {
  const { data } = await client.put(`/v1/admin/products/${id}`, productData);
  return data.data;
};

export const toggleProductActive = async (id) => {
  const { data } = await client.patch(`/v1/admin/products/${id}/toggle-active`);
  return data.data;
};
