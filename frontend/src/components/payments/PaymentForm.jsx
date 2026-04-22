import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';

const CARD_OPTIONS = {
  style: {
    base: {
      color: '#f0f0f8',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
      '::placeholder': {
        color: '#5a5a72',
      },
    },
    invalid: {
      color: '#ff6b6b',
    },
  },
  hidePostalCode: true,
};

export default function PaymentForm({ clientSecret, orderNumber, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setLocalError('Stripe has not finished loading yet.');
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
          setSuccessMessage('Payment already confirmed. Waiting for order confirmation.');
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
      setSuccessMessage('Payment submitted successfully. Waiting for order confirmation.');
      onSuccess?.(result.paymentIntent);
    } else {
      setLocalError(`Payment intent status: ${result.paymentIntent?.status || 'unknown'}`);
      onError?.(`Payment intent status: ${result.paymentIntent?.status || 'unknown'}`);
    }

    setLoading(false);
  };

  return (
    <form className="payment-form" onSubmit={handleSubmit}>
      <div className="payment-form__field">
        <label className="payment-form__label">Card details</label>
        <div className="payment-form__card">
          <CardElement options={CARD_OPTIONS} />
        </div>
      </div>

      <div className="payment-form__hint">
        <ShieldCheck size={14} />
        Use Stripe test card <strong>4242 4242 4242 4242</strong>, any future expiry,
        any CVC, and any ZIP.
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