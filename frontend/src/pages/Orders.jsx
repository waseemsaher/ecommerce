import '../styles/pages/Orders.css';
import { useState } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock3, Package, ChevronRight, ReceiptText, CreditCard, ChevronDown } from 'lucide-react';
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
  usePageTitle('My Orders');
  const [cursor, setCursor] = useState(null);
  const [allOrders, setAllOrders] = useState([]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['orders', cursor],
    queryFn: () => getOrders({ cursor }),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const orders = query.state.data?.data;
      if (!orders) return false;
      const hasActive = orders.some((o) =>
        ['pending', 'processing'].includes(o.status)
      );
      return hasActive ? 5000 : false;
    },
    onSuccess: (incoming) => {
      setAllOrders((prev) =>
        cursor === null
          ? incoming.data || []
          : [...prev, ...(incoming.data || [])]
      );
    },
  });

  // Merge in pages that come back (handles both first load and load-more)
  const pageOrders = data?.data || [];
  const displayOrders = cursor === null ? pageOrders : allOrders;
  const nextCursor = data?.meta?.next_cursor || null;

  const handleLoadMore = () => {
    setAllOrders((prev) => [...prev, ...pageOrders]);
    setCursor(nextCursor);
  };

  return (
    <div className="orders-page page-enter">
      <div className="orders-page__inner container">
        <div className="orders-page__header">
          <div>
            <h1 className="orders-page__title">Orders</h1>
            <p className="orders-page__subtitle">Review your recent purchases and track totals.</p>
          </div>

          {displayOrders.length > 0 && (
            <Link to={`/orders/${displayOrders[0].id}`} className="orders-page__latest-link">
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
        ) : displayOrders.length === 0 ? (
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
              {displayOrders.map((order) => (
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
                <Button
                  variant="secondary"
                  icon={ChevronDown}
                  loading={isFetching}
                  onClick={handleLoadMore}
                >
                  Load more orders
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
