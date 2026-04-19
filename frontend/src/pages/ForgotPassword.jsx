import '../styles/pages/Auth.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Package, ArrowLeft, CheckCircle } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useForgotPassword } from '../hooks/useAuth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const mutation = useForgotPassword();

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    mutation.mutate(
      { email },
      {
        onSuccess: () => setSent(true),
        onError: (error) => {
          if (error.response?.data?.errors) {
            setErrors(
              Object.fromEntries(
                Object.entries(error.response.data.errors).map(([k, v]) => [k, v[0]])
              )
            );
          }
        },
      }
    );
  };

  return (
    <div className="auth-page page-enter">
      <div className="auth-page__bg glow-bg" />
      <div className="auth-card glass">
        <div className="auth-card__header">
          <Link to="/" className="auth-card__logo">
            <Package size={28} />
          </Link>

          {sent ? (
            <>
              <div className="auth-card__success-icon">
                <CheckCircle size={48} />
              </div>
              <h1 className="auth-card__title">Check your email</h1>
              <p className="auth-card__subtitle">
                If an account exists for <strong>{email}</strong>, we&apos;ve
                sent a password reset link. It may take a minute to arrive.
              </p>
            </>
          ) : (
            <>
              <h1 className="auth-card__title">Forgot password?</h1>
              <p className="auth-card__subtitle">
                No worries — enter your email and we&apos;ll send you a reset link.
              </p>
            </>
          )}
        </div>

        {!sent && (
          <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
            <Input
              id="forgot-email"
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({});
              }}
              error={errors.email}
              autoComplete="email"
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={mutation.isPending}
            >
              Send Reset Link
            </Button>
          </form>
        )}

        {sent && (
          <div className="auth-card__form">
            <Button
              fullWidth
              size="lg"
              variant="ghost"
              onClick={() => {
                setSent(false);
                setEmail('');
              }}
            >
              Try a different email
            </Button>
          </div>
        )}

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
