import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAdminOrder, useUpdateOrderStatus } from '../../hooks/useAdmin';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const TRANSITIONS = {
  pending: ['processing', 'cancelled'],
  processing: ['completed', 'cancelled', 'refunded'],
  completed: ['refunded'],
  cancelled: [],
  refunded: [],
};

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { data: order, isLoading } = useAdminOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const [newStatus, setNewStatus] = useState('');

  if (isLoading) return <div className="admin__loading">Loading order...</div>;
  if (!order) return <div className="admin__loading">Order not found</div>;

  const availableTransitions = TRANSITIONS[order.status] || [];

  const handleStatusUpdate = () => {
    if (!newStatus) return;
    updateStatus.mutate(
      { id: order.id, status: newStatus },
      {
        onSuccess: () => {
          toast.success(`Order status updated to ${newStatus}`);
          setNewStatus('');
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || 'Failed to update status');
        },
      }
    );
  };

  return (
    <div>
      <Link to="/admin/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '1rem', textDecoration: 'none' }}>
        <ArrowLeft size={16} /> Back to Orders
      </Link>

      <div className="admin__section-header">
        <h1 className="admin__section-title">{order.order_number}</h1>
        <span className={`admin__badge admin__badge--${order.status}`}>{order.status}</span>
      </div>

      <div className="admin__detail">
        {/* Customer & Order Info */}
        <div className="admin__detail-card">
          <div className="admin__detail-title">Order Information</div>
          <div className="admin__detail-row">
            <span className="admin__detail-label">Customer</span>
            <span className="admin__detail-value">{order.user?.name} ({order.user?.email})</span>
          </div>
          <div className="admin__detail-row">
            <span className="admin__detail-label">Order Status</span>
            <span className={`admin__badge admin__badge--${order.status}`}>{order.status}</span>
          </div>
          <div className="admin__detail-row">
            <span className="admin__detail-label">Payment Status</span>
            <span className={`admin__badge admin__badge--${order.payment_status}`}>{order.payment_status}</span>
          </div>
          <div className="admin__detail-row">
            <span className="admin__detail-label">Subtotal</span>
            <span className="admin__detail-value">${Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="admin__detail-row">
            <span className="admin__detail-label">Tax</span>
            <span className="admin__detail-value">${Number(order.tax).toFixed(2)}</span>
          </div>
          <div className="admin__detail-row">
            <span className="admin__detail-label">Total</span>
            <span className="admin__detail-value" style={{ fontWeight: 700 }}>${Number(order.total).toFixed(2)}</span>
          </div>
          <div className="admin__detail-row">
            <span className="admin__detail-label">Date</span>
            <span className="admin__detail-value">{new Date(order.created_at).toLocaleString()}</span>
          </div>

          {availableTransitions.length > 0 && (
            <div className="admin__status-update">
              <select
                className="admin__filter-select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="">Update status...</option>
                {availableTransitions.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <button
                className="admin__btn admin__btn--primary"
                onClick={handleStatusUpdate}
                disabled={!newStatus || updateStatus.isPending}
              >
                {updateStatus.isPending ? 'Updating...' : 'Update'}
              </button>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="admin__table-wrap">
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Items</span>
          </div>
          <table className="admin__table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td>{item.product_name}</td>
                  <td>${Number(item.price).toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td>${Number(item.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment Info */}
        {order.payment && (
          <div className="admin__detail-card">
            <div className="admin__detail-title">Payment Details</div>
            <div className="admin__detail-row">
              <span className="admin__detail-label">Method</span>
              <span className="admin__detail-value">{order.payment.method}</span>
            </div>
            <div className="admin__detail-row">
              <span className="admin__detail-label">Transaction ID</span>
              <span className="admin__detail-value" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{order.payment.transaction_id || 'N/A'}</span>
            </div>
            <div className="admin__detail-row">
              <span className="admin__detail-label">Amount</span>
              <span className="admin__detail-value">${Number(order.payment.amount).toFixed(2)} {order.payment.currency}</span>
            </div>
            <div className="admin__detail-row">
              <span className="admin__detail-label">Status</span>
              <span className={`admin__badge admin__badge--${order.payment.status}`}>{order.payment.status}</span>
            </div>
            {order.payment.paid_at && (
              <div className="admin__detail-row">
                <span className="admin__detail-label">Paid At</span>
                <span className="admin__detail-value">{new Date(order.payment.paid_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
