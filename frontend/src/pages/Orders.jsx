import '../styles/pages/Orders.css';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock3, Package, ChevronRight, ReceiptText, CreditCard } from 'lucide-react';
import { getOrders } from '../api/orders';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function formatStatus(value) {
  return String(value || 'unknown').replaceAll('_', ' ');
}

export default function Orders() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders(),
    staleTime: 0,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const orders = data?.data || [];
  const nextCursor = data?.meta?.next_cursor || null;

  const latestOrder = useMemo(() => orders[0], [orders]);

  return (
    <div className="orders-page page-enter">
      <div className="orders-page__inner container">
        <div className="orders-page__header">
          <div>
            <h1 className="orders-page__title">Orders</h1>
            <p className="orders-page__subtitle">Review your recent purchases and track totals.</p>
          </div>

          {latestOrder && (
            <Link to={`/orders/${latestOrder.id}`} className="orders-page__latest-link">
              View latest order
              <ChevronRight size={16} />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="orders-page__list">
            {[1, 2, 3].map((item) => (
              <div key={item} className="orders-page__card glass">
                <Skeleton height="1rem" width="160px" />
                <Skeleton height="1.5rem" width="120px" />
                <Skeleton height="0.9rem" width="70%" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="orders-page__empty glass">
            <ReceiptText size={44} />
            <h2>No orders yet</h2>
            <p>Your completed checkouts will appear here.</p>
            <Link to="/products">
              <Button icon={Package}>Browse products</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="orders-page__list">
              {orders.map((order) => (
                <Link key={order.id} to={`/orders/${order.id}`} className="orders-page__card glass">
                  <div className="orders-page__card-top">
                    <div>
                      <span className="orders-page__number">{order.order_number}</span>
                      <h2 className="orders-page__amount">${formatMoney(order.total)}</h2>
                    </div>
                    <div className="orders-page__status-stack">
                      <span className={`orders-page__status orders-page__status--${order.status}`}>
                        {formatStatus(order.status)}
                      </span>
                      <span className={`orders-page__payment orders-page__payment--${order.payment_status}`}>
                        <CreditCard size={12} />
                        {formatStatus(order.payment_status)}
                      </span>
                    </div>
                  </div>

                  <div className="orders-page__meta">
                    <span>
                      <Clock3 size={14} />
                      {new Date(order.created_at).toLocaleString()}
                    </span>
                    <span>{order.items?.length || 0} item(s)</span>
                    <span>Payment: {formatStatus(order.payment_status)}</span>
                  </div>
                </Link>
              ))}
            </div>

            {nextCursor && (
              <div className="orders-page__more">
                <Button variant="secondary" disabled>
                  More orders available in API cursor results
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}