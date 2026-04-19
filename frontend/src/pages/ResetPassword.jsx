import '../styles/pages/Auth.css';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, Package, ArrowLeft } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useResetPassword } from '../hooks/useAuth';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const emailFromUrl = searchParams.get('email') || '';

  const [form, setForm] = useState({
    token: tokenFromUrl,
    email: emailFromUrl,
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({});
  const mutation = useResetPassword();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.token) newErrors.token = 'Reset token is missing';
    if (!form.email) newErrors.email = 'Email is required';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8)
      newErrors.password = 'Password must be at least 8 characters';
    if (form.password !== form.password_confirmation)
      newErrors.password_confirmation = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    mutation.mutate(form, {
      onError: (error) => {
        if (error.response?.data?.errors) {
          setErrors(
            Object.fromEntries(
              Object.entries(error.response.data.errors).map(([k, v]) => [k, v[0]])
            )
          );
        }
      },
    });
  };

  const hasTokenAndEmail = form.token && form.email;

  return (
    <div className="auth-page page-enter">
      <div className="auth-page__bg glow-bg" />
      <div className="auth-card glass">
        <div className="auth-card__header">
          <Link to="/" className="auth-card__logo">
            <Package size={28} />
          </Link>
          <h1 className="auth-card__title">Reset your password</h1>
          <p className="auth-card__subtitle">
            {hasTokenAndEmail
              ? 'Enter your new password below to regain access to your account.'
              : 'Please fill in all the fields to reset your password.'}
          </p>
        </div>

        <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
          {/* Show token/email fields only if not pre-filled from URL */}
          {!tokenFromUrl && (
            <Input
              id="reset-token"
              label="Reset Token"
              name="token"
              type="text"
              placeholder="Paste your reset token"
              value={form.token}
              onChange={handleChange}
              error={errors.token}
            />
          )}

          {!emailFromUrl && (
            <Input
              id="reset-email"
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
            />
          )}

          <Input
            id="reset-password"
            label="New Password"
            name="password"
            type="password"
            placeholder="Min. 8 characters"
            icon={Lock}
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="new-password"
          />

          <Input
            id="reset-confirm"
            label="Confirm New Password"
            name="password_confirmation"
            type="password"
            placeholder="Repeat your new password"
            icon={Lock}
            value={form.password_confirmation}
            onChange={handleChange}
            error={errors.password_confirmation}
            autoComplete="new-password"
          />

          {errors.token && tokenFromUrl && (
            <p className="auth-card__error-note">{errors.token}</p>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={mutation.isPending}
          >
            Reset Password
          </Button>
        </form>

        <p className="auth-card__footer">
          <Link to="/login" className="auth-card__link auth-card__back-link">
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
