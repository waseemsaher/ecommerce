import './ProductCard.css';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, Check } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addToCart } from '../../api/cart';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import toast from 'react-hot-toast';
import Badge from '../ui/Badge';
import { getProductImageUrl } from '../../utils/productImage';

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuthStore();
  const incrementCount = useCartStore((s) => s.incrementCount);
  const queryClient = useQueryClient();
  const [justAdded, setJustAdded] = useState(false);

  const addMutation = useMutation({
    mutationFn: addToCart,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      if (data?.data?.items_count !== undefined) {
        useCartStore.getState().setItemCount(data.data.items_count);
      } else {
        incrementCount(1);
      }
      setJustAdded(true);
      toast.success(`${product.name} added to cart!`);
      setTimeout(() => setJustAdded(false), 2000);
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Failed to add to cart';
      toast.error(msg);
    },
  });

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }
    addMutation.mutate({ product_id: product.id, quantity: 1 });
  };

  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <Link to={`/products/${product.slug}`} className="product-card">
      {/* Image Area */}
      <div className="product-card__image-area">
        <img
          src={getProductImageUrl(product, 640)}
          alt={product.name}
          className="product-card__image"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'flex';
          }}
        />
        <div className="product-card__image-placeholder" style={{ display: 'none' }}>
          <Package size={40} strokeWidth={1} />
        </div>
        {!inStock && (
          <div className="product-card__out-badge">Out of Stock</div>
        )}
        {lowStock && (
          <Badge variant="warning" size="sm" className="product-card__low-badge">
            Only {product.stock} left
          </Badge>
        )}
      </div>

      {/* Body */}
      <div className="product-card__body">
        <span className="product-card__sku">{product.sku}</span>
        <h3 className="product-card__name">{product.name}</h3>
        {product.description && (
          <p className="product-card__desc">
            {product.description.length > 80
              ? product.description.slice(0, 80) + '...'
              : product.description}
          </p>
        )}

        <div className="product-card__footer">
          <span className="product-card__price">
            ${parseFloat(product.price).toFixed(2)}
          </span>
          <button
            className={`product-card__add-btn ${justAdded ? 'product-card__add-btn--added' : ''}`}
            onClick={handleAddToCart}
            disabled={!inStock || addMutation.isPending}
            aria-label={`Add ${product.name} to cart`}
          >
            {justAdded ? (
              <>
                <Check size={16} />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart size={16} />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
