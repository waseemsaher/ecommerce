import '../styles/pages/Cart.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCart, updateCartItem, removeCartItem, clearCart } from '../api/cart';
import { Link } from 'react-router-dom';
import {
  Minus, Plus, Trash2, ShoppingBag, ArrowRight,
  Package, AlertTriangle, Loader2,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { getProductImageUrl } from '../utils/productImage';

function normalizeCartItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

function getItemPrice(item) {
  return Number(item?.price || item?.product?.price || 0);
}

function getItemSubtotal(item) {
  if (item?.subtotal !== undefined) {
    return Number(item.subtotal || 0);
  }

  return getItemPrice(item) * Number(item?.quantity || 0);
}

export default function Cart() {
  const queryClient = useQueryClient();
  const setItemCount = useCartStore((s) => s.setItemCount);
  const [removingId, setRemovingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    onSuccess: (data) => {
      const items = normalizeCartItems(data?.data);
      const itemCount = items.reduce((total, item) => total + Number(item?.quantity || 0), 0);
      setItemCount(itemCount);
    },
  });

  const cartData = data?.data;
  const items = normalizeCartItems(cartData);
  const subtotal = items.reduce((total, item) => total + getItemSubtotal(item), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  // ── Update Quantity ────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: updateCartItem,
    onMutate: ({ productId }) => setUpdatingId(productId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      const items = normalizeCartItems(data?.data);
      const itemCount = items.reduce((count, item) => count + Number(item?.quantity || 0), 0);
      setItemCount(itemCount);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update');
    },
    onSettled: () => setUpdatingId(null),
  });

  // ── Remove Item ────────────────────────────────────────────
  const removeMutation = useMutation({
    mutationFn: removeCartItem,
    onMutate: (productId) => setRemovingId(productId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      const items = normalizeCartItems(data?.data);
      const itemCount = items.reduce((count, item) => count + Number(item?.quantity || 0), 0);
      setItemCount(itemCount);
      toast.success('Item removed from cart');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to remove');
    },
    onSettled: () => setRemovingId(null),
  });

  // ── Clear Cart ────────────────────────────────────────────
  const clearMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setItemCount(0);
      toast.success('Cart cleared');
    },
    onError: () => {
      toast.error('Failed to clear cart');
    },
  });

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearMutation.mutate();
    }
  };

  // ── Loading State ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="cart-page page-enter">
        <div className="cart-page__inner container">
          <Skeleton height="2rem" width="200px" />
          <div className="cart-page__layout" style={{ marginTop: '2rem' }}>
            <div className="cart-page__items">
              {[1, 2, 3].map((i) => (
                <div key={i} className="cart-page__skeleton-item">
                  <Skeleton height="80px" width="80px" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Skeleton height="1rem" width="60%" />
                    <Skeleton height="0.75rem" width="40%" />
                  </div>
                  <Skeleton height="2rem" width="100px" />
                </div>
              ))}
            </div>
            <Skeleton height="250px" radius="var(--radius-xl)" />
          </div>
        </div>
      </div>
    );
  }

  // ── Empty State ────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="cart-page page-enter">
        <div className="cart-page__inner container">
          <div className="cart-page__empty">
            <div className="cart-page__empty-icon">
              <ShoppingBag size={64} strokeWidth={0.8} />
            </div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <Link to="/products">
              <Button size="lg" icon={ArrowRight} iconPosition="right">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page page-enter">
      <div className="cart-page__inner container">
        <div className="cart-page__header">
          <h1 className="cart-page__title">Shopping Cart</h1>
          <span className="cart-page__count">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="cart-page__layout">
          {/* Items List */}
          <div className="cart-page__items">
            {items.map((item) => (
              <div
                key={item.product_id || item.id}
                className={`cart-item ${removingId === item.product_id ? 'cart-item--removing' : ''}`}
              >
                {/* Product Image */}
                <div className="cart-item__image">
                  <img
                    src={getProductImageUrl(item.product || item, 320)}
                    alt={item.product?.name || 'Product'}
                    className="cart-item__img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div className="cart-item__img-placeholder" style={{ display: 'none' }}>
                    <Package size={28} strokeWidth={1} />
                  </div>
                </div>

                {/* Product Info */}
                <div className="cart-item__info">
                  <Link
                    to={`/products/${item.slug || item.product?.slug || ''}`}
                    className="cart-item__name"
                  >
                    {item.product_name || item.name || item.product?.name || 'Product'}
                  </Link>
                  <span className="cart-item__price">
                    ${getItemPrice(item).toFixed(2)} each
                  </span>
                  {item.in_stock === false && (
                    <span className="cart-item__out-stock">
                      <AlertTriangle size={12} /> Out of stock
                    </span>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="cart-item__quantity">
                  <button
                    className="cart-item__qty-btn"
                    onClick={() =>
                      updateMutation.mutate({
                        productId: item.product_id,
                        quantity: Math.max(1, item.quantity - 1),
                      })
                    }
                    disabled={item.quantity <= 1 || updatingId === item.product_id}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="cart-item__qty-value">
                    {updatingId === item.product_id ? (
                      <Loader2 size={14} className="cart-item__qty-spinner" />
                    ) : (
                      item.quantity
                    )}
                  </span>
                  <button
                    className="cart-item__qty-btn"
                    onClick={() =>
                      updateMutation.mutate({
                        productId: item.product_id,
                        quantity: item.quantity + 1,
                      })
                    }
                    disabled={updatingId === item.product_id}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Subtotal */}
                <span className="cart-item__subtotal">
                  ${getItemSubtotal(item).toFixed(2)}
                </span>

                {/* Remove */}
                <button
                  className="cart-item__remove"
                  onClick={() => removeMutation.mutate(item.product_id)}
                  disabled={removingId === item.product_id}
                  aria-label="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {/* Clear Cart */}
            <div className="cart-page__clear-row">
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={handleClear}
                loading={clearMutation.isPending}
              >
                Clear Cart
              </Button>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="cart-summary glass">
            <h3 className="cart-summary__title">Order Summary</h3>

            <div className="cart-summary__rows">
              <div className="cart-summary__row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="cart-summary__row">
                <span>Tax (10%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="cart-summary__row cart-summary__row--total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              size="lg"
              fullWidth
              icon={ArrowRight}
              iconPosition="right"
              disabled
              className="cart-summary__checkout-btn"
            >
              Proceed to Checkout
            </Button>
            <p className="cart-summary__note">
              Checkout will be available once the backend is complete.
            </p>

            <Link to="/products" className="cart-summary__continue">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
