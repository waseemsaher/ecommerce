import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminOrders } from '../../hooks/useAdmin';
import { Search } from 'lucide-react';

const STATUSES = ['', 'pending', 'processing', 'completed', 'cancelled', 'refunded'];

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const params = { page, per_page: 15 };
  if (status) params.status = status;
  if (search) params.search = search;

  const { data, isLoading } = useAdminOrders(params);

  return (
    <div>
      <div className="admin__section-header">
        <h1 className="admin__section-title">Orders</h1>
      </div>

      <div className="admin__filters">
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            className="admin__filter-input"
            placeholder="Search orders or customers..."
            style={{ paddingLeft: 30 }}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="admin__filter-select"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="admin__table-wrap">
        {isLoading ? (
          <div className="admin__loading">Loading orders...</div>
        ) : (
          <>
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link to={`/admin/orders/${order.id}`} style={{ color: 'var(--accent)', fontWeight: 500 }}>
                        {order.order_number}
                      </Link>
                    </td>
                    <td>{order.user?.name || 'N/A'}</td>
                    <td><span className={`admin__badge admin__badge--${order.status}`}>{order.status}</span></td>
                    <td><span className={`admin__badge admin__badge--${order.payment_status}`}>{order.payment_status}</span></td>
                    <td>${Number(order.total).toFixed(2)}</td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {data?.data?.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No orders found</td></tr>
                )}
              </tbody>
            </table>

            {data?.last_page > 1 && (
              <div className="admin__pagination">
                <span className="admin__pagination-info">
                  Page {data.current_page} of {data.last_page} ({data.total} orders)
                </span>
                <div className="admin__pagination-btns">
                  <button
                    className="admin__pagination-btn"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="admin__pagination-btn"
                    disabled={page >= data.last_page}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
