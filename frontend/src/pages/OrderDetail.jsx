import '../styles/pages/Orders.css';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, Truck, CircleCheckBig, Clock3 } from 'lucide-react';
import { getOrder } from '../api/orders';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { getProductImageUrl } from '../utils/productImage';

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function formatStatus(value) {
  return String(value || 'unknown').replaceAll('_', ' ');
}

export default function OrderDetail() {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id),
  });

  const order = data?.data;

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
            <p>The order you requested does not exist or cannot be loaded.</p>
            <Link to="/orders">
              <Button variant="secondary" icon={ArrowLeft}>Back to orders</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const items = order.items || [];

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