import '../styles/pages/Orders.css';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
} from 'lucide-react';
import { getOrder } from '../api/orders';
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
  const numericOrderId = Number(id);
  const hasValidId = Number.isInteger(numericOrderId) && numericOrderId > 0;

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
      const currentOrder = query.state.data?.data;
      if (!currentOrder) {
        return false;
      }

      if (['pending', 'processing'].includes(currentOrder.status)) {
        return 5000;
      }

      return false;
    },
  });

  const order = data?.data;
  const apiMessage = error?.response?.data?.message;
  const apiStatus = error?.response?.status;

  if (!hasValidId) {
    return (
      <div className="orders-page page-enter">
        <div className="orders-page__inner container">
          <div className="orders-page__empty glass">
            <Package size={44} />
            <h2>Invalid order link</h2>
            <p>The order identifier in this URL is invalid.</p>
            <Button variant="secondary" onClick={() => navigate('/orders')} icon={ArrowLeft}>
              Back to orders
            </Button>
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
    return (
      <div className="orders-page page-enter">
        <div className="orders-page__inner container">
          <div className="orders-page__empty glass">
            <Package size={44} />
            <h2>Order not found</h2>
            <p>{apiMessage || 'The order you requested does not exist or cannot be loaded.'}</p>
            {apiStatus ? <p>HTTP status: {apiStatus}</p> : null}
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
  const clientSecret = order.payment?.metadata?.client_secret;
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
            <span className={`orders-page__status orders-page__status--${order.status}`}>
              {formatStatus(order.status)}
            </span>
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
                  <span>Transaction ID</span>
                  <strong>{order.payment.transaction_id || 'Pending'}</strong>
                </div>
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

              {order.status === 'processing' && (
                <div className="order-detail__payment-note">
                  <RefreshCw size={14} />
                  We are polling for payment updates every few seconds until the order is completed.
                </div>
              )}

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
                        theme: 'night',
                        variables: {
                          colorPrimary: '#7c5cfc',
                          colorText: '#f0f0f8',
                          colorBackground: '#151520',
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
              <p className="order-detail__note">
                This order was created from the cart checkout flow and uses the backend totals.
              </p>
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