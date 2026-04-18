import client from './client';

export const getCart = async () => {
  const { data } = await client.get('/cart');
  return data;
};

export const addToCart = async ({ product_id, quantity }) => {
  const { data } = await client.post('/cart/items', { product_id, quantity });
  return data;
};

export const updateCartItem = async ({ productId, quantity }) => {
  const { data } = await client.put(`/cart/items/${productId}`, { quantity });
  return data;
};

export const removeCartItem = async (productId) => {
  const { data } = await client.delete(`/cart/items/${productId}`);
  return data;
};

export const clearCart = async () => {
  const { data } = await client.delete('/cart');
  return data;
};
