import '../styles/pages/Orders.css';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { useQuery } from '@tanstack/react-query';
import { CircleCheckBig, ReceiptText, ShoppingBag, RefreshCw } from 'lucide-react';
import { getOrder } from '../api/orders';
import Button from '../components/ui/Button';

export default function OrderSuccess() {
  usePageTitle('Order Confirmed');
  const { id } = useParams();
  const navigate = useNavigate();
  const numericOrderId = Number(id);
  const hasValidId = Number.isInteger(numericOrderId) && numericOrderId > 0;

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id, 'success'],
    queryFn: () => getOrder(numericOrderId),
    enabled: hasValidId,
    refetchInterval: (query) => {
      if (query.state.error?.response?.status === 429) {
        return false;
      }
      const order = query.state.data?.data;
      if (!order) {
        return 5000;
      }

      if (order.status === 'completed' || order.payment_status === 'paid') {
        return false;
      }

      return 5000;
    },
  });

  const order = data?.data;

  if (!hasValidId) {
    return (
      <div className="orders-page page-enter">
        <div className="orders-page__inner container">
          <section className="order-success glass">
            <div className="order-success__icon">
              <CircleCheckBig size={54} />
            </div>
            <h1>Payment received</h1>
            <p>The order link is invalid.</p>
            <div className="order-success__actions">
              <Button variant="secondary" onClick={() => navigate('/orders')} icon={ReceiptText}>
                Back to orders
              </Button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="orders-page page-enter">
        <div className="orders-page__inner container">
          <section className="order-success glass">
            <div className="order-success__icon">
              <RefreshCw size={54} />
            </div>
            <h1>Checking payment status</h1>
            <p>We’re loading your order confirmation.</p>
          </section>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="orders-page page-enter">
        <div className="orders-page__inner container">
          <section className="order-success glass">
            <div className="order-success__icon">
              <CircleCheckBig size={54} />
            </div>
            <h1>Payment received</h1>
            <p>
              We could not load your order confirmation yet. Please try again in a moment.
            </p>
            <div className="order-success__actions">
              <Link to={`/orders/${id}`}>
                <Button icon={ReceiptText} variant="secondary">View order details</Button>
              </Link>
              <Link to="/orders">
                <Button icon={ShoppingBag}>Back to orders</Button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page page-enter">
      <div className="orders-page__inner container">
        <section className="order-success glass">
          <div className="order-success__icon">
            <CircleCheckBig size={54} />
          </div>
          <h1>{order.status === 'completed' || order.payment_status === 'paid' ? 'Payment completed' : 'Payment received'}</h1>
          <p>
            {order.status === 'completed' || order.payment_status === 'paid'
              ? 'Your order has been confirmed successfully. You can review the final details or continue shopping.'
              : 'Your payment was accepted. We are finalizing your order confirmation.'}
          </p>
          <p className="order-success__meta">
            Order ID: {order.order_number || id}
          </p>

          <div className="order-success__actions">
            <Link to={`/orders/${id}`}>
              <Button icon={ReceiptText} variant="secondary">View order details</Button>
            </Link>
            <Link to="/products">
              <Button icon={ShoppingBag}>Continue shopping</Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}