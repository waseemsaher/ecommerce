import client from './client';

export const checkout = async ({ idempotencyKey }) => {
  const { data } = await client.post(
    '/v1/checkout',
    {},
    {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    }
  );

  return data;
};

export const getOrders = async ({ cursor } = {}) => {
  const params = {};

  if (cursor) {
    params.cursor = cursor;
  }

  const { data } = await client.get('/v1/orders', { params });
  return data;
};

export const getOrder = async (id) => {
  const { data } = await client.get(`/v1/orders/${id}`);
  return data;
};