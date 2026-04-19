import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as authApi from '../api/auth';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';

function getApiErrorMessage(error, fallbackMessage) {
  const apiMessage = error?.response?.data?.message;
  const apiErrors = error?.response?.data?.errors;

  if (apiErrors) {
    const firstFieldErrors = Object.values(apiErrors)[0];
    if (Array.isArray(firstFieldErrors) && firstFieldErrors.length > 0) {
      const firstValidationMessage = firstFieldErrors[0];
      if (typeof firstValidationMessage === 'string') {
        if (firstValidationMessage.toLowerCase().includes('already')) {
          return 'Email already registered.';
        }
        return firstValidationMessage;
      }
    }
  }

  return apiMessage || fallbackMessage;
}

export function useLogin() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/products');
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, 'Login failed. Please try again.');
      toast.error(message);
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      toast.success('Account created! Welcome aboard 🎉');
      navigate('/products');
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, 'Registration failed.');
      toast.error(message);
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const resetCount = useCartStore((s) => s.resetCount);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuth();
      resetCount();
      queryClient.clear();
      toast.success('Logged out successfully');
      navigate('/');
    },
    onError: () => {
      // Even on error, clear local state
      clearAuth();
      resetCount();
      queryClient.clear();
      navigate('/');
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
    onError: (error) => {
      const message = getApiErrorMessage(error, 'Something went wrong. Please try again.');
      toast.error(message);
    },
  });
}

export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, 'Password reset failed. The link may have expired.');
      toast.error(message);
    },
  });
}
