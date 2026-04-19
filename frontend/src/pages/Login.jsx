import '../styles/pages/Auth.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Package } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useLogin } from '../hooks/useAuth';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const loginMutation = useLogin();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = 'Email is required';
    if (!form.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    loginMutation.mutate(form, {
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

  return (
    <div className="auth-page page-enter">
      <div className="auth-page__bg glow-bg" />
      <div className="auth-card glass">
        <div className="auth-card__header">
          <Link to="/" className="auth-card__logo">
            <Package size={28} />
          </Link>
          <h1 className="auth-card__title">Welcome back</h1>
          <p className="auth-card__subtitle">
            Sign in to your account to continue shopping
          </p>
        </div>

        <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
          <Input
            id="login-email"
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
            id="login-password"
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            icon={Lock}
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="current-password"
          />

          <div className="auth-card__options">
            <Link to="/forgot-password" className="auth-card__forgot-link">
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loginMutation.isPending}
          >
            Sign In
          </Button>
        </form>

        <p className="auth-card__footer">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="auth-card__link">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
