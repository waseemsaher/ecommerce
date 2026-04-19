import client from './client';

export const register = async ({ name, email, password, password_confirmation }) => {
  const { data } = await client.post('/auth/register', {
    name,
    email,
    password,
    password_confirmation,
  });
  return data;
};

export const login = async ({ email, password }) => {
  const { data } = await client.post('/auth/login', { email, password });
  return data;
};

export const logout = async () => {
  const { data } = await client.post('/auth/logout');
  return data;
};

export const forgotPassword = async ({ email }) => {
  const { data } = await client.post('/auth/password/forgot', { email });
  return data;
};

export const resetPassword = async ({ token, email, password, password_confirmation }) => {
  const { data } = await client.post('/auth/password/reset', {
    token,
    email,
    password,
    password_confirmation,
  });
  return data;
};
