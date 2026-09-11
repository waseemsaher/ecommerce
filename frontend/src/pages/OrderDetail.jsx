import '../styles/pages/Orders.css';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  ArrowLeft,
  AlertTriangle,
  Package,
  Truck,
  CircleCheckBig,
  Clock3,
  CreditCard,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { getOrder, cancelOrder } from '../api/orders';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { getProductImageUrl } from '../utils/productImage';
import PaymentForm from '../components/payments/PaymentForm';

const stripePromise = import.meta.env.VITE_STRIPE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_KEY)
  : null;

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function formatStatus(value) {
  return String(value || 'unknown').replaceAll('_', ' ');
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute('data-theme') || 'dark'
  );
  const numericOrderId = Number(id);
  const hasValidId = Number.isInteger(numericOrderId) && numericOrderId > 0;

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      const hasThemeUpdate = mutations.some(
        (mutation) => mutation.attributeName === 'data-theme'
      );

      if (hasThemeUpdate) {
        setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
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

  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(numericOrderId),
    enabled: hasValidId,
    refetchInterval: (query) => {
      if (query.state.error?.response?.status === 429) {
        return false;
      }
      const currentOrder = query.state.data?.data;
      if (!currentOrder) {
        return false;
      }

      if (['pending', 'processing'].includes(currentOrder.status)) {
        return 8000;
      }

      return false;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(numericOrderId),
    onSuccess: () => {
      toast.success('Order cancelled.');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not cancel order.');
    },
  });

  const order = data?.data;
  usePageTitle(order ? `Order ${order.order_number}` : 'Order Details');
  const apiMessage = error?.response?.data?.message;
  const apiStatus = error?.response?.status;

  // client_secret is only present on the initial creation response (never stored in DB).
  // Check sessionStorage fallback if navigated from checkout
  const clientSecret =
    order?.payment?.client_secret ||
    sessionStorage.getItem(`order_${id}_client_secret`);

  if (!hasValidId) {
    return (
      <div className="orders-page page-enter">
        <div className="orders-page__inner container">
          <div className="orders-page__empty glass">
            <Package size={44} />
            <h2>Order not found</h2>
            <p>The order ID in the URL is invalid.</p>
            <div className="order-detail__error-actions">
              <Link to="/orders">
                <Button variant="secondary" icon={ArrowLeft}>Back to orders</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="orders-page page-enter">
        <div className="orders-page__inner container">
          <Skeleton height="1rem" width="140px" />
          <div className="order-detail glass">
            <Skeleton height="1.5rem" width="220px" />
            <Skeleton height="0.9rem" width="180px" />
            <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
              {[1, 2].map((item) => (
                <Skeleton key={item} height="96px" radius="var(--radius-lg)" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    const isRateLimited = apiStatus === 429;
    return (
      <div className="orders-page page-enter">
        <div className="orders-page__inner container">
          <div className="orders-page__empty glass">
            <Package size={44} />
            <h2>{isRateLimited ? 'Too Many Requests' : 'Order not found'}</h2>
            <p>{isRateLimited ? 'You are checking order updates quickly. Please wait a moment.' : (apiMessage || 'The order you requested does not exist or cannot be loaded.')}</p>
            {apiStatus ? <p>Please try again in a moment.</p> : null}
            <div className="order-detail__error-actions">
              <Button variant="secondary" icon={RefreshCw} onClick={() => refetch()}>
                Retry
              </Button>
              <Link to="/orders">
                <Button variant="secondary" icon={ArrowLeft}>Back to orders</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const items = order.items || [];
  const canPay = order.status === 'processing' && order.payment_status === 'pending' && clientSecret;

  return (
    <div className="orders-page page-enter">
      <div className="orders-page__inner container">
        <Link to="/orders" className="orders-page__back">
          <ArrowLeft size={16} />
          <span>Back to orders</span>
        </Link>

        <div className="order-detail glass">
          <div className="order-detail__header">
            <div>
              <span className="orders-page__number">{order.order_number}</span>
              <h1 className="order-detail__title">Order details</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className={`orders-page__status orders-page__status--${order.status}`}>
                {formatStatus(order.status)}
              </span>
              {['pending', 'processing'].includes(order.status) && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={XCircle}
                  loading={cancelMutation.isPending}
                  onClick={() => {
                    if (window.confirm('Are you sure you want to cancel this order?')) {
                      cancelMutation.mutate();
                    }
                  }}
                  style={{ color: 'var(--danger)' }}
                >
                  Cancel Order
                </Button>
              )}
            </div>
          </div>

          <div className="order-detail__timeline">
            <span>
              <Clock3 size={14} />
              Ordered {new Date(order.created_at).toLocaleString()}
            </span>
            <span>
              <Truck size={14} />
              Payment {formatStatus(order.payment_status)}
            </span>
            <span>
              <CircleCheckBig size={14} />
              {items.length} item(s)
            </span>
          </div>

          {order.payment && (
            <div className="order-detail__payment glass">
              <div className="order-detail__payment-header">
                <div>
                  <span className="order-detail__payment-label">Payment</span>
                  <h2>{formatStatus(order.payment.method)}</h2>
                </div>
                <span className={`orders-page__payment orders-page__payment--${order.payment.status}`}>
                  <CreditCard size={12} />
                  {formatStatus(order.payment.status)}
                </span>
              </div>

              <div className="order-detail__payment-grid">
                <div>
                  <span>Amount</span>
                  <strong>${formatMoney(order.payment.amount)}</strong>
                </div>
                <div>
                  <span>Currency</span>
                  <strong>{String(order.payment.currency || 'USD').toUpperCase()}</strong>
                </div>
                <div>
                  <span>Gateway</span>
                  <strong>{formatStatus(order.payment.method)}</strong>
                </div>
              </div>

              {canPay && stripePromise && (
                <div className="order-detail__paybox">
                  <h3>Complete your payment</h3>
                  <p>
                    Confirm the Stripe payment intent to complete the transaction.
                  </p>
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
                          colorDanger: '#ff6b6b',
                          fontFamily: 'Inter, system-ui, sans-serif',
                        },
                      },
                    }}
                  >
                    <PaymentForm
                      clientSecret={clientSecret}
                      orderNumber={order.order_number}
                      onSuccess={() => {
                        sessionStorage.removeItem(`order_${id}_client_secret`);
                        sessionStorage.removeItem(`cs_order_${id}`);
                        navigate(`/orders/${order.id}/success`);
                      }}
                    />
                  </Elements>
                </div>
              )}

              {order.status === 'processing' && !clientSecret && (
                <div className="order-detail__payment-note">
                  <AlertTriangle size={14} />
                  Payment information is still being prepared. Refresh in a moment if the form does not appear.
                </div>
              )}

              {order.status !== 'processing' && order.status !== 'completed' && (
                <div className="order-detail__payment-note">
                  <AlertTriangle size={14} />
                  This order is not ready for payment confirmation.
                </div>
              )}
            </div>
          )}

          <div className="order-detail__grid">
            <section className="order-detail__items">
              <h2>Items</h2>
              <div className="order-detail__item-list">
                {items.map((item) => (
                  <article key={item.id} className="order-detail__item">
                    <img
                      src={getProductImageUrl(item.product || item, 320)}
                      alt={item.product_name || item.product?.name || 'Product'}
                      className="order-detail__item-image"
                    />
                    <div className="order-detail__item-body">
                      <h3>{item.product_name || item.product?.name}</h3>
                      <p>{item.quantity} x ${formatMoney(item.price)}</p>
                    </div>
                    <strong>${formatMoney(item.total)}</strong>
                  </article>
                ))}
              </div>
            </section>

            <aside className="order-detail__summary">
              <h2>Summary</h2>
              <div className="order-detail__rows">
                <div><span>Subtotal</span><strong>${formatMoney(order.subtotal)}</strong></div>
                <div><span>Tax</span><strong>${formatMoney(order.tax)}</strong></div>
                <div className="order-detail__rows-total"><span>Total</span><strong>${formatMoney(order.total)}</strong></div>
              </div>
              <Link to="/products">
                <Button fullWidth icon={Package}>Continue shopping</Button>
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}