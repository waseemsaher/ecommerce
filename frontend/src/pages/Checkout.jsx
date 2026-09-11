import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  ShieldCheck,
  Lock,
  Package,
  Truck,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { getOrder, checkout } from '../api/orders';
import { getCart } from '../api/cart';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import { usePageTitle } from '../hooks/usePageTitle';
import PaymentForm from '../components/payments/PaymentForm';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import '../styles/pages/Checkout.css';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_KEY ||
  'pk_test_51TMkS317ebcf88FjfH77SORY8FYoyjVZVCV8RSUtAgTX6r51PQ44Gfe3TR8LpULJyHdDrv8YiHGzhWsVIblP8MgW00ATOfPUK8'
);

export default function Checkout() {
  usePageTitle('Checkout');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const setItemCount = useCartStore((s) => s.setItemCount);

  const orderIdParam = searchParams.get('order');
  const [activeOrderId, setActiveOrderId] = useState(orderIdParam ? parseInt(orderIdParam, 10) : null);
  const [clientSecret, setClientSecret] = useState(null);
  const [deliveryNote, setDeliveryNote] = useState('');

  // ── Fetch Cart (if no active order) ───────────────────────────
  const { data: cartResponse, isLoading: loadingCart } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled: !activeOrderId,
  });

  // ── Fetch Order (if active order) ──────────────────────────────
  const { data: orderResponse, isLoading: loadingOrder, refetch: refetchOrder } = useQuery({
    queryKey: ['order', activeOrderId],
    queryFn: () => getOrder(activeOrderId),
    enabled: !!activeOrderId,
  });

  const currentOrder = orderResponse?.data;
  const cartData = cartResponse?.data;
  const cartItems = cartData?.items || [];

  // Check client_secret from order or sessionStorage
  useEffect(() => {
    if (activeOrderId) {
      const storedSecret = sessionStorage.getItem(`cs_order_${activeOrderId}`);
      if (currentOrder?.payment?.client_secret) {
        setClientSecret(currentOrder.payment.client_secret);
      } else if (storedSecret) {
        setClientSecret(storedSecret);
      }
    }
  }, [activeOrderId, currentOrder]);

  // ── Create Order from Cart ─────────────────────────────────────
  const createOrderMutation = useMutation({
    mutationFn: () => {
      const idempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `checkout-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      return checkout({ idempotencyKey });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setItemCount(0);
      const newOrder = res?.data;
      if (newOrder?.id) {
        setActiveOrderId(newOrder.id);
        if (newOrder.client_secret) {
          sessionStorage.setItem(`cs_order_${newOrder.id}`, newOrder.client_secret);
          setClientSecret(newOrder.client_secret);
        }
        navigate(`/checkout?order=${newOrder.id}`, { replace: true });
        toast.success('Order created! Please enter card details.');
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to initialize checkout');
    },
  });

  const handlePaymentSuccess = () => {
    toast.success('Payment confirmed! Thank you for your order.');
    if (activeOrderId) {
      navigate(`/orders/${activeOrderId}/success`);
    } else {
      navigate('/orders');
    }
  };

  const handlePaymentError = (msg) => {
    toast.error(msg || 'Payment failed. Please try again.');
  };

  // If already paid, redirect to success
  useEffect(() => {
    if (currentOrder && (currentOrder.status === 'completed' || currentOrder.payment_status === 'paid')) {
      navigate(`/orders/${currentOrder.id}/success`, { replace: true });
    }
  }, [currentOrder, navigate]);

  const isLoading = activeOrderId ? loadingOrder : loadingCart;

  // Calculate totals
  let lineItems = [];
  let subtotal = 0;
  let tax = 0;
  let total = 0;
  let orderNumber = currentOrder?.order_number || '';

  if (activeOrderId && currentOrder) {
    lineItems = currentOrder.items || [];
    subtotal = Number(currentOrder.subtotal || 0);
    tax = Number(currentOrder.tax || 0);
    total = Number(currentOrder.total || 0);
  } else if (cartItems.length > 0) {
    lineItems = cartItems.map((item) => ({
      id: item.id,
      product_name: item.product?.name || 'Product',
      price: Number(item.price || item.product?.price || 0),
      quantity: item.quantity,
      total: Number(item.subtotal || (item.price * item.quantity) || 0),
      product: item.product,
    }));
    subtotal = lineItems.reduce((acc, i) => acc + i.total, 0);
    tax = subtotal * 0.1;
    total = subtotal + tax;
  }

  const theme = document.documentElement.getAttribute('data-theme') || 'light';

  return (
    <div className="checkout-page page-enter">
      <div className="checkout-page__inner container">
        {/* Navigation Breadcrumb */}
        <div className="checkout__breadcrumb">
          <Link to="/cart" className="checkout__back-link">
            <ArrowLeft size={16} /> Back to Cart
          </Link>
          <span className="checkout__secure-badge">
            <Lock size={14} /> 256-Bit SSL Encrypted Checkout
          </span>
        </div>

        <h1 className="checkout__page-title">Secure Checkout</h1>

        {isLoading ? (
          <div className="checkout__layout">
            <div className="checkout__col-main">
              <Skeleton height="180px" radius="var(--radius-lg)" />
              <Skeleton height="260px" radius="var(--radius-lg)" />
            </div>
            <div className="checkout__col-side">
              <Skeleton height="350px" radius="var(--radius-lg)" />
            </div>
          </div>
        ) : (!activeOrderId && cartItems.length === 0) ? (
          <div className="checkout__empty glass">
            <Package size={52} strokeWidth={1.2} style={{ color: 'var(--accent)' }} />
            <h2>Your cart is empty</h2>
            <p>Add some products to your cart before proceeding to checkout.</p>
            <Link to="/products">
              <Button size="lg">Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="checkout__layout">
            {/* ── Left Column: Checkout Steps & Payment ── */}
            <div className="checkout__col-main">
              {/* Step 1: Customer & Delivery Info */}
              <section className="checkout-card glass">
                <div className="checkout-card__header">
                  <div className="checkout-card__step-num">1</div>
                  <h2 className="checkout-card__title">Contact & Delivery</h2>
                </div>

                <div className="checkout-card__body">
                  <div className="checkout__customer-info">
                    <div className="checkout__info-row">
                      <span className="checkout__info-label">Customer Name</span>
                      <span className="checkout__info-val">{user?.name || 'Customer'}</span>
                    </div>
                    <div className="checkout__info-row">
                      <span className="checkout__info-label">Email Address</span>
                      <span className="checkout__info-val">{user?.email || 'N/A'}</span>
                    </div>
                    <div className="checkout__info-row">
                      <span className="checkout__info-label">Shipping Method</span>
                      <span className="checkout__info-val" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                        <Truck size={15} style={{ display: 'inline', marginRight: 4 }} /> Standard Free Delivery (2-4 business days)
                      </span>
                    </div>
                  </div>

                  <div className="checkout__form-group" style={{ marginTop: '1rem' }}>
                    <label className="checkout__label" htmlFor="deliveryNote">Delivery Instructions (Optional)</label>
                    <input
                      id="deliveryNote"
                      type="text"
                      className="checkout__input"
                      placeholder="e.g. Leave at front door or ring bell"
                      value={deliveryNote}
                      onChange={(e) => setDeliveryNote(e.target.value)}
                    />
                  </div>
                </div>
              </section>

              {/* Step 2: Payment Section */}
              <section className="checkout-card glass">
                <div className="checkout-card__header">
                  <div className="checkout-card__step-num">2</div>
                  <h2 className="checkout-card__title">Payment Method</h2>
                </div>

                <div className="checkout-card__body">
                  {/* If order not yet created from cart, prompt to proceed */}
                  {!activeOrderId ? (
                    <div className="checkout__init-box">
                      <p className="checkout__init-text">
                        Ready to confirm your items? Click below to generate your secure payment session.
                      </p>
                      <Button
                        size="lg"
                        fullWidth
                        loading={createOrderMutation.isPending}
                        onClick={() => createOrderMutation.mutate()}
                      >
                        Proceed to Payment (${total.toFixed(2)})
                      </Button>
                    </div>
                  ) : clientSecret ? (
                    <div className="checkout__stripe-container">
                      <div className="checkout__payment-methods-header">
                        <CreditCard size={18} style={{ color: 'var(--accent)' }} />
                        <span>Credit / Debit Card (via Stripe)</span>
                      </div>

                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret,
                          appearance: {
                            theme: theme === 'light' ? 'stripe' : 'night',
                            variables: {
                              colorPrimary: '#7B9669',
                              colorText: theme === 'light' ? '#404E3B' : '#f2f6f0',
                              colorBackground: 'transparent',
                              colorDanger: '#dc2626',
                              fontFamily: 'Inter, system-ui, sans-serif',
                            },
                          },
                        }}
                      >
                        <PaymentForm
                          clientSecret={clientSecret}
                          orderNumber={orderNumber}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                        />
                      </Elements>
                    </div>
                  ) : (
                    <div className="checkout__secret-pending">
                      <AlertTriangle size={24} style={{ color: 'var(--warning)' }} />
                      <p>Waiting for secure payment gateway initialization...</p>
                      <Button variant="secondary" icon={RefreshCw} onClick={() => refetchOrder()}>
                        Refresh Payment Session
                      </Button>
                    </div>
                  )}

                  {/* Trust Badges */}
                  <div className="checkout__trust-row">
                    <div className="checkout__trust-item">
                      <ShieldCheck size={16} /> 100% Secure Checkout
                    </div>
                    <div className="checkout__trust-item">
                      <CheckCircle size={16} /> Instant Order Confirmation
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* ── Right Column: Order Summary (Shopify/Amazon style sticky) ── */}
            <aside className="checkout__col-side">
              <div className="checkout-summary glass">
                <h3 className="checkout-summary__title">
                  Order Summary
                  <span className="checkout-summary__count">{lineItems.length} items</span>
                </h3>

                {/* Items List */}
                <div className="checkout-summary__items">
                  {lineItems.map((item, idx) => (
                    <div key={item.id || idx} className="checkout-item">
                      <div className="checkout-item__thumb">
                        {item.product?.image_path ? (
                          <img src={item.product.image_path} alt={item.product_name} />
                        ) : (
                          <Package size={20} style={{ color: 'var(--text-muted)' }} />
                        )}
                        <span className="checkout-item__qty">{item.quantity}</span>
                      </div>
                      <div className="checkout-item__details">
                        <span className="checkout-item__name">{item.product_name}</span>
                        <span className="checkout-item__unit">${Number(item.price).toFixed(2)} each</span>
                      </div>
                      <div className="checkout-item__total">
                        ${Number(item.total).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing Breakdown */}
                <div className="checkout-summary__costs">
                  <div className="checkout-summary__row">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="checkout-summary__row">
                    <span>Estimated Tax (10%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="checkout-summary__row">
                    <span>Shipping</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>FREE</span>
                  </div>
                  <div className="checkout-summary__total-row">
                    <span>Total Due</span>
                    <span className="checkout-summary__total-val">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Guarantees */}
                <div className="checkout-summary__perks">
                  <div className="checkout-summary__perk">
                    <CheckCircle size={14} style={{ color: 'var(--accent)' }} /> 30-Day Money-Back Guarantee
                  </div>
                  <div className="checkout-summary__perk">
                    <ShieldCheck size={14} style={{ color: 'var(--accent)' }} /> Safe & Encrypted Transactions
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
