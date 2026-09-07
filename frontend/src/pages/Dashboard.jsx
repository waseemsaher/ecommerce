import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getUserDashboard } from '../api/dashboard';
import { ShoppingBag, Package, User } from 'lucide-react';
import '../styles/pages/Dashboard.css';

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getUserDashboard,
  });

  if (isLoading) {
    return (
      <div className="dashboard">
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-tertiary)' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard__welcome">
        <h1>Welcome back, {data?.user?.name || 'there'}</h1>
        <p>Member since {data?.user?.member_since ? new Date(data.user.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}</p>
      </div>

      <div className="dashboard__stats">
        <div className="dashboard__stat-card">
          <div className="dashboard__stat-value">{data?.stats?.order_count || 0}</div>
          <div className="dashboard__stat-label">Total Orders</div>
        </div>
        <div className="dashboard__stat-card">
          <div className="dashboard__stat-value">${data?.stats?.total_spent?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}</div>
          <div className="dashboard__stat-label">Total Spent</div>
        </div>
        <div className="dashboard__stat-card">
          <div className="dashboard__stat-value">{data?.recent_orders?.length || 0}</div>
          <div className="dashboard__stat-label">Recent Orders</div>
        </div>
      </div>

      <div className="dashboard__section">
        <div className="dashboard__section-header">
          <h2 className="dashboard__section-title">Recent Orders</h2>
          <Link to="/orders" className="dashboard__section-link">View All</Link>
        </div>
        <div className="dashboard__orders">
          {data?.recent_orders?.length > 0 ? (
            data.recent_orders.map((order) => (
              <Link to={`/orders/${order.id}`} key={order.id} className="dashboard__order-item">
                <div className="dashboard__order-info">
                  <span className="dashboard__order-number">{order.order_number}</span>
                  <span className="dashboard__order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="dashboard__order-right">
                  <span className="dashboard__order-total">${Number(order.total).toFixed(2)}</span>
                  <span className={`dashboard__order-badge dashboard__order-badge--${order.status}`}>{order.status}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="dashboard__empty">No orders yet. Start shopping!</div>
          )}
        </div>
      </div>

      <div className="dashboard__section">
        <h2 className="dashboard__section-title" style={{ marginBottom: '1rem' }}>Quick Actions</h2>
        <div className="dashboard__quick-actions">
          <Link to="/products" className="dashboard__action-btn">
            <Package size={16} /> Browse Products
          </Link>
          <Link to="/orders" className="dashboard__action-btn">
            <ShoppingBag size={16} /> All Orders
          </Link>
          <Link to="/profile" className="dashboard__action-btn">
            <User size={16} /> Edit Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
