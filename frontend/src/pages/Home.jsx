import '../styles/pages/Home.css';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Truck, ShoppingBag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/products';
import ProductCard from '../components/shared/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';

export default function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ['products', { per_page: 4 }],
    queryFn: () => getProducts({ per_page: 4 }),
  });

  const products = data?.data || [];

  return (
    <div className="home page-enter">
      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="hero glow-bg">
        <div className="hero__inner container">
          <div className="hero__content">
            <div className="hero__badge">
              <Zap size={14} />
              <span>New Collection Available</span>
            </div>
            <h1 className="hero__title">
              Discover <span className="hero__title-accent">Premium</span> Products
            </h1>
            <p className="hero__subtitle">
              Curated quality, exceptional prices. Shop the latest collection 
              with confidence and style.
            </p>
            <div className="hero__actions">
              <Link to="/products">
                <Button size="lg" icon={ShoppingBag}>
                  Browse Collection
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary" size="lg" icon={ArrowRight} iconPosition="right">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>

          <div className="hero__visual">
            <div className="hero__orb hero__orb--1" />
            <div className="hero__orb hero__orb--2" />
            <div className="hero__orb hero__orb--3" />
            <div className="hero__shape">
              <ShoppingBag size={80} strokeWidth={0.8} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="features container">
        <div className="features__grid">
          <div className="feature-card">
            <div className="feature-card__icon">
              <Truck size={24} />
            </div>
            <h3 className="feature-card__title">Fast Delivery</h3>
            <p className="feature-card__desc">
              Free shipping on orders over $50. Quick and reliable delivery.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-card__icon">
              <Shield size={24} />
            </div>
            <h3 className="feature-card__title">Secure Payments</h3>
            <p className="feature-card__desc">
              Stripe-powered checkout with full encryption and fraud protection.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-card__icon">
              <Zap size={24} />
            </div>
            <h3 className="feature-card__title">Quality Guarantee</h3>
            <p className="feature-card__desc">
              Every product is verified for quality. 30-day return policy.
            </p>
          </div>
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────── */}
      <section className="featured container">
        <div className="featured__header">
          <div>
            <h2 className="featured__title">Featured Products</h2>
            <p className="featured__subtitle">Handpicked for you</p>
          </div>
          <Link to="/products" className="featured__view-all">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div className="product-grid product-grid--4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="cta glow-bg">
        <div className="cta__inner container">
          <h2 className="cta__title">Ready to start shopping?</h2>
          <p className="cta__subtitle">
            Create an account and explore our full collection today.
          </p>
          <Link to="/register">
            <Button size="lg" icon={ArrowRight} iconPosition="right">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
