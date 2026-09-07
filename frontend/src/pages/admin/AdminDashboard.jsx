import { useAnalyticsSummary, useTopProducts, useUserGrowth } from '../../hooks/useAdmin';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const { data: summary, isLoading: loadingSummary } = useAnalyticsSummary();
  const { data: topProducts, isLoading: loadingProducts } = useTopProducts();
  const { data: growth, isLoading: loadingGrowth } = useUserGrowth();

  if (loadingSummary) {
    return <div className="admin__loading">Loading dashboard...</div>;
  }

  const maxGrowth = growth ? Math.max(...growth.map((d) => d.count), 1) : 1;

  return (
    <div>
      <div className="admin__section-header">
        <h1 className="admin__section-title">Dashboard</h1>
      </div>

      <div className="admin__stats">
        <div className="admin__stat-card">
          <div className="admin__stat-label"><DollarSign size={14} style={{ display: 'inline', marginRight: 4 }} />Total Revenue</div>
          <div className="admin__stat-value">${summary?.revenue?.total?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}</div>
        </div>
        <div className="admin__stat-card">
          <div className="admin__stat-label"><TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} />Today</div>
          <div className="admin__stat-value">${summary?.revenue?.today?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}</div>
        </div>
        <div className="admin__stat-card">
          <div className="admin__stat-label"><ShoppingBag size={14} style={{ display: 'inline', marginRight: 4 }} />Total Orders</div>
          <div className="admin__stat-value">{summary?.orders?.total || 0}</div>
        </div>
        <div className="admin__stat-card">
          <div className="admin__stat-label"><Users size={14} style={{ display: 'inline', marginRight: 4 }} />Total Users</div>
          <div className="admin__stat-value">{summary?.total_users || 0}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Order Status Breakdown */}
        <div className="admin__detail-card">
          <div className="admin__detail-title">Orders by Status</div>
          {summary?.orders?.by_status && Object.entries(summary.orders.by_status).map(([status, count]) => (
            <div className="admin__detail-row" key={status}>
              <span className={`admin__badge admin__badge--${status}`}>{status}</span>
              <span className="admin__detail-value">{count}</span>
            </div>
          ))}
          {(!summary?.orders?.by_status || Object.keys(summary.orders.by_status).length === 0) && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>No orders yet</p>
          )}
        </div>

        {/* User Growth Chart */}
        <div className="admin__chart">
          <div className="admin__chart-title">User Registrations (30 days)</div>
          {loadingGrowth ? (
            <div className="admin__loading">Loading...</div>
          ) : (
            <div className="admin__chart-bars">
              {growth?.map((day) => (
                <div
                  key={day.date}
                  className="admin__chart-bar"
                  style={{ height: `${(day.count / maxGrowth) * 100}%` }}
                  title={`${day.date}: ${day.count} users`}
                />
              ))}
              {(!growth || growth.length === 0) && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>No data</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="admin__table-wrap" style={{ marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Top Selling Products</span>
        </div>
        {loadingProducts ? (
          <div className="admin__loading">Loading...</div>
        ) : (
          <table className="admin__table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Units Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts?.map((p) => (
                <tr key={p.product_id}>
                  <td>{p.product_name}</td>
                  <td>{p.total_sold}</td>
                  <td>${Number(p.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {(!topProducts || topProducts.length === 0) && (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No sales data</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Orders */}
      <div className="admin__table-wrap">
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Recent Orders</span>
          <Link to="/admin/orders" style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>View All</Link>
        </div>
        <table className="admin__table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {summary?.recent_orders?.map((order) => (
              <tr key={order.id}>
                <td><Link to={`/admin/orders/${order.id}`} style={{ color: 'var(--accent)' }}>{order.order_number}</Link></td>
                <td>{order.user?.name || 'N/A'}</td>
                <td><span className={`admin__badge admin__badge--${order.status}`}>{order.status}</span></td>
                <td>${Number(order.total).toFixed(2)}</td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {(!summary?.recent_orders || summary.recent_orders.length === 0) && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
