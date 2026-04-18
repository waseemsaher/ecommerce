import '../styles/pages/Auth.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Package } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useRegister } from '../hooks/useAuth';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({});
  const registerMutation = useRegister();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = 'Name is required';
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

    registerMutation.mutate(form, {
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
          <h1 className="auth-card__title">Create an account</h1>
          <p className="auth-card__subtitle">
            Join ShopVault and start shopping today
          </p>
        </div>

        <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
          <Input
            id="register-name"
            label="Full Name"
            name="name"
            type="text"
            placeholder="John Doe"
            icon={User}
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            autoComplete="name"
          />

          <Input
            id="register-email"
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
            id="register-password"
            label="Password"
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
            id="register-confirm"
            label="Confirm Password"
            name="password_confirmation"
            type="password"
            placeholder="Repeat your password"
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
            loading={registerMutation.isPending}
          >
            Create Account
          </Button>
        </form>

        <p className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-card__link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
