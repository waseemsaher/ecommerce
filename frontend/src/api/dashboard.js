import client from './client';

export const getUserDashboard = async () => {
  const { data } = await client.get('/v1/dashboard');
  return data;
};
