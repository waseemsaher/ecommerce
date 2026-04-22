import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';

function getCssVar(name, fallback) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function buildCardOptions() {
  return {
    style: {
      base: {
        color: getCssVar('--text-primary', '#0b1220'),
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '16px',
        iconColor: getCssVar('--text-secondary', '#334155'),
        '::placeholder': {
          color: getCssVar('--text-muted', '#64748b'),
        },
      },
      invalid: {
        color: getCssVar('--danger', '#ff6b6b'),
      },
    },
    hidePostalCode: true,
  };
}

export default function PaymentForm({ clientSecret, orderNumber, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cardOptions, setCardOptions] = useState(buildCardOptions);

  useEffect(() => {
    const updateOptions = () => {
      setCardOptions(buildCardOptions());
    };

    updateOptions();

    const observer = new MutationObserver((mutations) => {
      const hasThemeUpdate = mutations.some(
        (mutation) => mutation.attributeName === 'data-theme'
      );

      if (hasThemeUpdate) {
        updateOptions();
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setLocalError('Payment is still loading. Please try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setLocalError('Card input is unavailable.');
      return;
    }

    setLoading(true);
    setLocalError('');
    setSuccessMessage('');

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: `Order ${orderNumber}`,
        },
      },
    });

    if (result.error) {
      if (result.error.code === 'payment_intent_unexpected_state') {
        const current = await stripe.retrievePaymentIntent(clientSecret);
        const currentIntent = current?.paymentIntent;

        if (['succeeded', 'processing', 'requires_capture'].includes(currentIntent?.status)) {
          setSuccessMessage('Payment already confirmed. Finalizing your order.');
          onSuccess?.(currentIntent);
          setLoading(false);
          return;
        }
      }

      const details = [
        result.error.code ? `code: ${result.error.code}` : null,
        result.error.decline_code ? `decline: ${result.error.decline_code}` : null,
      ].filter(Boolean).join(' | ');
      const message = result.error.message || 'Payment confirmation failed.';
      const fullMessage = details ? `${message} (${details})` : message;

      setLocalError(fullMessage);
      onError?.(fullMessage);
      setLoading(false);
      return;
    }

    if (result.paymentIntent?.status === 'succeeded') {
      setSuccessMessage('Payment submitted successfully. Finalizing your order.');
      onSuccess?.(result.paymentIntent);
    } else {
      setLocalError('Payment could not be confirmed yet. Please try again.');
      onError?.('Payment could not be confirmed yet. Please try again.');
    }

    setLoading(false);
  };

  return (
    <form className="payment-form" onSubmit={handleSubmit}>
      <div className="payment-form__field">
        <label className="payment-form__label">Card details</label>
        <div className="payment-form__card">
          <CardElement options={cardOptions} />
        </div>
      </div>

      <div className="payment-form__hint">
        <ShieldCheck size={14} />
        Your payment details are secured and encrypted by Stripe.
      </div>

      {localError && (
        <div className="payment-form__message payment-form__message--error">
          <AlertTriangle size={14} />
          <span>{localError}</span>
        </div>
      )}

      {successMessage && (
        <div className="payment-form__message payment-form__message--success">
          <CheckCircle2 size={14} />
          <span>{successMessage}</span>
        </div>
      )}

      <Button type="submit" fullWidth size="lg" loading={loading} disabled={!stripe || !elements}>
        Confirm payment
      </Button>
    </form>
  );
}