import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';
import { updateProfile } from '../api/auth';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Profile() {
  usePageTitle('My Profile');
  const { user, setAuth, getToken } = useAuthStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      setAuth(data.user, getToken());
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Profile updated successfully.');
      setForm((prev) => ({ ...prev, password: '', password_confirmation: '' }));
    },
    onError: (error) => {
      const apiErrors = error?.response?.data?.errors;
      if (apiErrors) {
        setErrors(
          Object.fromEntries(
            Object.entries(apiErrors).map(([k, v]) => [k, v[0]])
          )
        );
      }
      toast.error(error?.response?.data?.message || 'Failed to update profile.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {};
    if (form.name !== user?.name) payload.name = form.name;
    if (form.email !== user?.email) payload.email = form.email;
    if (form.password) {
      payload.password = form.password;
      payload.password_confirmation = form.password_confirmation;
    }
    if (Object.keys(payload).length === 0) {
      toast('No changes to save.');
      return;
    }
    mutation.mutate(payload);
  };

  return (
    <div className="auth-page page-enter">
      <div className="auth-page__bg glow-bg" />
      <div className="auth-card glass" style={{ maxWidth: '480px' }}>
        <div className="auth-card__header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <User size={32} />
          </div>
          <h1 className="auth-card__title">Your Profile</h1>
          <p className="auth-card__subtitle">Update your name, email, or password</p>
        </div>

        <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
          <Input
            id="profile-name"
            label="Name"
            name="name"
            type="text"
            placeholder="Your full name"
            icon={User}
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            autoComplete="name"
          />

          <Input
            id="profile-email"
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
          />

          <Input
            id="profile-password"
            label="New Password"
            name="password"
            type="password"
            placeholder="Leave blank to keep current"
            icon={Lock}
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="new-password"
          />

          <Input
            id="profile-password-confirm"
            label="Confirm New Password"
            name="password_confirmation"
            type="password"
            placeholder="Repeat new password"
            icon={Lock}
            value={form.password_confirmation}
            onChange={handleChange}
            error={errors.password_confirmation}
            autoComplete="new-password"
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            icon={Save}
            loading={mutation.isPending}
          >
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
}
