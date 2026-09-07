import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminProducts, useToggleProductActive } from '../../hooks/useAdmin';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const params = { page, per_page: 15 };
  if (search) params.search = search;

  const { data, isLoading } = useAdminProducts(params);
  const toggleActive = useToggleProductActive();

  const handleToggle = (id) => {
    toggleActive.mutate(id, {
      onSuccess: (product) => {
        toast.success(`${product.name} is now ${product.is_active ? 'active' : 'inactive'}`);
      },
    });
  };

  return (
    <div>
      <div className="admin__section-header">
        <h1 className="admin__section-title">Products</h1>
        <Link to="/admin/products/new" className="admin__btn admin__btn--primary">
          <Plus size={16} style={{ display: 'inline', marginRight: 4 }} />
          Add Product
        </Link>
      </div>

      <div className="admin__filters">
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            className="admin__filter-input"
            placeholder="Search products..."
            style={{ paddingLeft: 30 }}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="admin__table-wrap">
        {isLoading ? (
          <div className="admin__loading">Loading products...</div>
        ) : (
          <>
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((product) => (
                  <tr key={product.id}>
                    <td style={{ fontWeight: 500 }}>{product.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{product.sku}</td>
                    <td>${Number(product.price).toFixed(2)}</td>
                    <td>
                      <span style={{ color: product.stock === 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`admin__toggle ${product.is_active ? 'admin__toggle--active' : ''}`}
                        onClick={() => handleToggle(product.id)}
                        aria-label={product.is_active ? 'Deactivate' : 'Activate'}
                      />
                    </td>
                    <td>
                      <Link to={`/admin/products/${product.id}/edit`} className="admin__btn" style={{ padding: '0.25rem 0.5rem' }}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
                {data?.data?.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No products found</td></tr>
                )}
              </tbody>
            </table>

            {data?.last_page > 1 && (
              <div className="admin__pagination">
                <span className="admin__pagination-info">
                  Page {data.current_page} of {data.last_page} ({data.total} products)
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
