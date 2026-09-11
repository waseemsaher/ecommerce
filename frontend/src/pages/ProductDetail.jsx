import '../styles/pages/ProductDetail.css';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProduct } from '../api/products';
import { addToCart } from '../api/cart';
import { buyNow } from '../api/orders';
import { useState } from 'react';
import {
  ShoppingCart, Minus, Plus, ChevronLeft, Package,
  Check, AlertTriangle, CreditCard,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';
import { getProductImageUrl } from '../utils/productImage';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProduct(slug),
  });

  const product = data?.data;
  usePageTitle(product?.name ?? 'Product');

  const addMutation = useMutation({
    mutationFn: addToCart,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      if (data?.data?.items_count !== undefined) {
        useCartStore.getState().setItemCount(data.data.items_count);
      }
      setJustAdded(true);
      toast.success(`${product.name} added to cart!`);
      setTimeout(() => setJustAdded(false), 2500);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    },
  });

  const buyNowMutation = useMutation({
    mutationFn: ({ productId, requestedQuantity, idempotencyKey }) => buyNow({
      product_id: productId,
      quantity: requestedQuantity,
      idempotencyKey,
    }),
    onSuccess: (data) => {
      const orderId = data?.data?.id;
      const clientSecret = data?.data?.client_secret;

      if (orderId) {
        if (clientSecret) {
          sessionStorage.setItem(`cs_order_${orderId}`, clientSecret);
        }
        navigate(`/checkout?order=${orderId}`);
        return;
      }

      toast.success('Order created successfully.');
      navigate('/orders');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create order');
    },
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }
    addMutation.mutate({ product_id: product.id, quantity });
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast.error('Please login to buy now');
      return;
    }

    const idempotencyKey =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `buy-now-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    buyNowMutation.mutate({
      productId: product.id,
      requestedQuantity: quantity,
      idempotencyKey,
    });
  };

  if (isLoading) {
    return (
      <div className="product-detail page-enter">
        <div className="product-detail__inner container">
          <Skeleton height="1rem" width="120px" />
          <div className="product-detail__layout">
            <Skeleton height="400px" radius="var(--radius-xl)" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Skeleton height="0.75rem" width="80px" />
              <Skeleton height="2rem" width="70%" />
              <Skeleton height="1rem" width="100%" />
              <Skeleton height="1rem" width="90%" />
              <Skeleton height="2rem" width="120px" />
              <Skeleton height="3rem" width="100%" radius="var(--radius-md)" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail page-enter">
        <div className="product-detail__inner container">
          <div className="product-detail__error">
            <AlertTriangle size={48} />
            <h2>Product not found</h2>
            <p>The product you're looking for doesn't exist or has been removed.</p>
            <Link to="/products">
              <Button variant="secondary" icon={ChevronLeft}>
                Back to Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="product-detail page-enter">
      <div className="product-detail__inner container">
        {/* Breadcrumb */}
        <Link to="/products" className="product-detail__back">
          <ChevronLeft size={18} />
          <span>Back to Products</span>
        </Link>

        <div className="product-detail__layout">
          {/* Image */}
          <div className="product-detail__image-area">
            <img
              src={getProductImageUrl(product, 900)}
              alt={product.name}
              className="product-detail__image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="product-detail__image-placeholder" style={{ display: 'none' }}>
              <Package size={80} strokeWidth={0.6} />
            </div>
            {!inStock && (
              <div className="product-detail__out-overlay">
                <span>Out of Stock</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="product-detail__info">
            <span className="product-detail__sku">{product.sku}</span>
            <h1 className="product-detail__name">{product.name}</h1>

            {product.description && (
              <p className="product-detail__desc">{product.description}</p>
            )}

            <div className="product-detail__price-row">
              <span className="product-detail__price">
                ${parseFloat(product.price).toFixed(2)}
              </span>
              {inStock ? (
                lowStock ? (
                  <Badge variant="warning">Only {product.stock} left</Badge>
                ) : (
                  <Badge variant="success">In Stock</Badge>
                )
              ) : (
                <Badge variant="danger">Out of Stock</Badge>
              )}
            </div>

            {/* Quantity + Add to Cart */}
            <div className="product-detail__actions">
              <div className="product-detail__quantity">
                <button
                  className="product-detail__qty-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="product-detail__qty-value">{quantity}</span>
                <button
                  className="product-detail__qty-btn"
                  onClick={() => setQuantity((q) => Math.min(product.stock || 100, q + 1))}
                  disabled={quantity >= (product.stock || 100)}
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="product-detail__cta-group">
                <Button
                  size="lg"
                  fullWidth
                  icon={justAdded ? Check : ShoppingCart}
                  onClick={handleAddToCart}
                  disabled={!inStock || addMutation.isPending || buyNowMutation.isPending}
                  loading={addMutation.isPending}
                  className={justAdded ? 'product-detail__added-btn' : ''}
                >
                  {justAdded ? 'Added to Cart!' : 'Add to Cart'}
                </Button>

                <Button
                  size="lg"
                  fullWidth
                  variant="secondary"
                  icon={CreditCard}
                  onClick={handleBuyNow}
                  disabled={!inStock || buyNowMutation.isPending || addMutation.isPending}
                  loading={buyNowMutation.isPending}
                >
                  Buy Now
                </Button>
              </div>
            </div>

            {/* Meta */}
            <div className="product-detail__meta">
              <div className="product-detail__meta-row">
                <span className="product-detail__meta-label">Stock</span>
                <span className="product-detail__meta-value">
                  {product.stock} units available
                </span>
              </div>
              <div className="product-detail__meta-row">
                <span className="product-detail__meta-label">SKU</span>
                <span className="product-detail__meta-value">{product.sku}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
