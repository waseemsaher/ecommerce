import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAdminProduct, useCreateProduct, useUpdateProduct } from '../../hooks/useAdmin';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: product, isLoading } = useAdminProduct(id);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    sku: '',
    image_path: '',
    is_active: true,
  });

  useEffect(() => {
    if (product && isEdit) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        stock: product.stock || '',
        sku: product.sku || '',
        image_path: product.image_path || '',
        is_active: product.is_active ?? true,
      });
    }
  }, [product, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
    };

    if (isEdit) {
      updateMutation.mutate(
        { id, data: payload },
        {
          onSuccess: () => {
            toast.success('Product updated');
            navigate('/admin/products');
          },
          onError: (err) => toast.error(err.response?.data?.message || 'Failed to update'),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Product created');
          navigate('/admin/products');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to create'),
      });
    }
  };

  if (isEdit && isLoading) return <div className="admin__loading">Loading product...</div>;

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <Link to="/admin/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '1rem', textDecoration: 'none' }}>
        <ArrowLeft size={16} /> Back to Products
      </Link>

      <div className="admin__section-header">
        <h1 className="admin__section-title">{isEdit ? 'Edit Product' : 'New Product'}</h1>
      </div>

      <form className="admin__form" onSubmit={handleSubmit}>
        <div className="admin__form-group">
          <label className="admin__form-label" htmlFor="name">Name *</label>
          <input className="admin__form-input" id="name" name="name" value={form.name} onChange={handleChange} required />
        </div>

        <div className="admin__form-group">
          <label className="admin__form-label" htmlFor="description">Description</label>
          <textarea className="admin__form-textarea" id="description" name="description" value={form.description} onChange={handleChange} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="admin__form-group">
            <label className="admin__form-label" htmlFor="price">Price *</label>
            <input className="admin__form-input" id="price" name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} required />
          </div>
          <div className="admin__form-group">
            <label className="admin__form-label" htmlFor="stock">Stock *</label>
            <input className="admin__form-input" id="stock" name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required />
          </div>
        </div>

        <div className="admin__form-group">
          <label className="admin__form-label" htmlFor="sku">SKU</label>
          <input className="admin__form-input" id="sku" name="sku" value={form.sku} onChange={handleChange} placeholder="Auto-generated if empty" />
        </div>

        <div className="admin__form-group">
          <label className="admin__form-label" htmlFor="image_path">Image URL</label>
          <input className="admin__form-input" id="image_path" name="image_path" value={form.image_path} onChange={handleChange} placeholder="https://..." />
        </div>

        <div className="admin__form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input type="checkbox" id="is_active" name="is_active" checked={form.is_active} onChange={handleChange} />
          <label className="admin__form-label" htmlFor="is_active" style={{ margin: 0 }}>Active (visible to customers)</label>
        </div>

        <div className="admin__form-actions">
          <button type="submit" className="admin__btn admin__btn--primary" disabled={isPending}>
            {isPending ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <Link to="/admin/products" className="admin__btn">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
