import client from './client';

export const getProducts = async (params = {}) => {
  const { data } = await client.get('/v1/products', { params });
  return data;
};

export const getProduct = async (slug) => {
  const { data } = await client.get(`/v1/products/${slug}`);
  return data;
};
